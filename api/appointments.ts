import type { IncomingMessage, ServerResponse } from 'http';
import appletConfig from '../firebase-applet-config.json';

export interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, unknown>;
  cookies?: Record<string, string>;
}

export interface VercelLikeResponse extends ServerResponse {
  status?: (statusCode: number) => VercelLikeResponse;
  json?: (body: unknown) => VercelLikeResponse;
  send?: (body: unknown) => VercelLikeResponse;
}

export interface AppointmentApiResponse {
  ok: boolean;
  mode:
    | 'notification_sent'
    | 'configuration_pending'
    | 'demo_mode'
    | 'honeypot_filtered'
    | 'validation_error'
    | 'unverified_enquiry_reference'
    | 'duplicate_enquiry'
    | 'forbidden_origin'
    | 'throttled'
    | 'malformed_request'
    | 'payload_too_large'
    | 'method_not_allowed'
    | 'notification_error';
  notificationStatus: 'sent' | 'configuration_pending' | 'skipped' | 'failed' | 'not_attempted';
  notificationDispatched: boolean;
  message: string;
}

const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB
const WEBHOOK_TIMEOUT_MS = 5000;
const ENQUIRY_MAX_AGE_MS = 60 * 1000; // 60 seconds freshness window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per 60s per IP

const ALLOWED_BODY_KEYS = new Set([
  'enquiryId',
  'name',
  'phone',
  'email',
  'treatment',
  'preferredDate',
  'message',
  'privacyConsent',
  'website_url',
  'liveMode',
  'turnstileToken',
]);

// Bounded warm-instance fallback caches (paired with Upstash Redis REST in multi-instance production)
const warmIpBuckets = new Map<string, number[]>();
const processedEnquiryIds = new Map<string, number>();

export function resetAppointmentAbuseCachesForTest(): void {
  warmIpBuckets.clear();
  processedEnquiryIds.clear();
}

function sendJson(
  res: VercelLikeResponse,
  statusCode: number,
  payload: AppointmentApiResponse
): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const target = res.status(statusCode);
    if (typeof target.json === 'function') {
      target.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getClientIp(req: VercelLikeRequest): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isOriginAllowed(req: VercelLikeRequest): boolean {
  const originHeader = req.headers?.origin;
  if (!originHeader || typeof originHeader !== 'string') {
    return true;
  }

  let originHost: string;
  try {
    originHost = new URL(originHeader).host.toLowerCase();
  } catch {
    return false;
  }

  const hostHeader =
    (typeof req.headers?.['x-forwarded-host'] === 'string' && req.headers['x-forwarded-host']) ||
    (typeof req.headers?.host === 'string' && req.headers.host) ||
    '';

  if (hostHeader && originHost === hostHeader.split(',')[0].trim().toLowerCase()) {
    return true;
  }

  if (
    originHost.startsWith('localhost:') ||
    originHost === 'localhost' ||
    originHost.startsWith('127.0.0.1:')
  ) {
    return true;
  }

  const allowedEnvUrls = [process.env.APP_URL, process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  for (const raw of allowedEnvUrls) {
    try {
      const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
      if (new URL(normalized).host.toLowerCase() === originHost) {
        return true;
      }
    } catch {
      // ignore invalid env URL
    }
  }

  return false;
}

/**
 * Distributed rate limiting via Upstash Redis REST API (when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
 * are configured in Vercel) with bounded warm-instance sliding-window fallback.
 */
async function checkRateLimit(clientIp: string): Promise<boolean> {
  const now = Date.now();

  // 1. Distributed Upstash Redis rate limit when configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    try {
      const windowBucket = Math.floor(now / RATE_LIMIT_WINDOW_MS);
      const key = `n7:ratelimit:appointments:${clientIp}:${windowBucket}`;
      const resp = await fetch(`${upstashUrl.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, 65],
        ]),
      });
      if (resp.ok) {
        const result = (await resp.json()) as Array<{ result?: number }>;
        const count = Number(result?.[0]?.result || 0);
        if (count > RATE_LIMIT_MAX_REQUESTS) {
          return false;
        }
      }
    } catch {
      // Fall back to warm-instance limiter if Redis is unreachable
    }
  }

  // 2. Bounded warm-instance sliding window limiter
  if (warmIpBuckets.size > 500) {
    const oldestAllowed = now - RATE_LIMIT_WINDOW_MS;
    for (const [ip, timestamps] of warmIpBuckets.entries()) {
      const recent = timestamps.filter((t) => t > oldestAllowed);
      if (recent.length === 0) {
        warmIpBuckets.delete(ip);
      } else {
        warmIpBuckets.set(ip, recent);
      }
    }
  }

  const existing = (warmIpBuckets.get(clientIp) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (existing.length >= RATE_LIMIT_MAX_REQUESTS) {
    warmIpBuckets.set(clientIp, existing);
    return false;
  }
  existing.push(now);
  warmIpBuckets.set(clientIp, existing);
  return true;
}

/**
 * Validates that the client-provided enquiryId matches `enq_<timestamp>_<random>`
 * and was generated within the last 60 seconds, and has not already been processed.
 */
function validateEnquiryIdAndIdempotency(enquiryId: unknown): {
  valid: boolean;
  reason?: 'invalid' | 'duplicate';
} {
  if (typeof enquiryId !== 'string') {
    return { valid: false, reason: 'invalid' };
  }
  const trimmed = enquiryId.trim();
  const match = /^enq_(\d{13})_([a-z0-9]{4,12})$/.exec(trimmed);
  if (!match) {
    return { valid: false, reason: 'invalid' };
  }

  const timestamp = Number.parseInt(match[1], 10);
  const now = Date.now();
  if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > ENQUIRY_MAX_AGE_MS) {
    return { valid: false, reason: 'invalid' };
  }

  // Prune expired idempotency entries
  if (processedEnquiryIds.size > 500) {
    for (const [id, ts] of processedEnquiryIds.entries()) {
      if (now - ts > ENQUIRY_MAX_AGE_MS * 5) {
        processedEnquiryIds.delete(id);
      }
    }
  }

  if (processedEnquiryIds.has(trimmed)) {
    return { valid: false, reason: 'duplicate' };
  }

  processedEnquiryIds.set(trimmed, now);
  return { valid: true };
}

/**
 * Queries the clinic's Firestore `site_settings/main` document directly on the server
 * to verify whether `bookingLiveMode` is genuinely enabled by a clinic administrator,
 * rather than trusting the client-supplied `liveMode` boolean alone.
 */
async function verifyServerBookingLiveModeEnabled(): Promise<boolean> {
  if (process.env.NOTIFICATION_SKIP_FIRESTORE_CHECK === 'true') {
    return true;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId;
  const databaseId =
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    appletConfig.firestoreDatabaseId ||
    '(default)';
  const apiKey = process.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey;

  if (!projectId || !apiKey) {
    return false;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(
    databaseId
  )}/documents/site_settings/main?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!resp.ok) {
      return false;
    }
    const docJson = (await resp.json()) as {
      fields?: {
        bookingLiveMode?: { booleanValue?: boolean };
      };
    };
    return docJson?.fields?.bookingLiveMode?.booleanValue === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readRawBody(req: VercelLikeRequest): Promise<{
  status: 'ok' | 'too_large' | 'malformed';
  data?: Record<string, unknown>;
}> {
  const contentLengthHeader = req.headers?.['content-length'];
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(
      Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader,
      10
    );
    if (!Number.isNaN(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
      return { status: 'too_large' };
    }
  }

  // Case 1: Pre-parsed by Vercel or Express middleware
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_PAYLOAD_BYTES) {
        return { status: 'too_large' };
      }
      if (!req.body.trim()) {
        return { status: 'malformed' };
      }
      try {
        const parsed = JSON.parse(req.body);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { status: 'malformed' };
        }
        return { status: 'ok', data: parsed as Record<string, unknown> };
      } catch {
        return { status: 'malformed' };
      }
    }

    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_PAYLOAD_BYTES) {
        return { status: 'too_large' };
      }
      try {
        const parsed = JSON.parse(req.body.toString('utf8'));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { status: 'malformed' };
        }
        return { status: 'ok', data: parsed as Record<string, unknown> };
      } catch {
        return { status: 'malformed' };
      }
    }

    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      const serialized = JSON.stringify(req.body);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_PAYLOAD_BYTES) {
        return { status: 'too_large' };
      }
      return { status: 'ok', data: req.body as Record<string, unknown> };
    }

    return { status: 'malformed' };
  }

  // Case 2: Read raw stream if req.body was not pre-populated
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        settled = true;
        resolve({ status: 'too_large' });
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({ status: 'malformed' });
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          resolve({ status: 'malformed' });
          return;
        }
        resolve({ status: 'ok', data: parsed as Record<string, unknown> });
      } catch {
        resolve({ status: 'malformed' });
      }
    });

    req.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ status: 'malformed' });
    });
  });
}

function isValidIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(timestamp);
}

/**
 * Dispatches a privacy-safe server-side webhook notification when NOTIFICATION_WEBHOOK_URL is configured.
 * Patient PII (name, phone, email, message) is intentionally omitted from third-party webhook payloads.
 */
async function dispatchOptionalWebhookNotification(payload: {
  enquiryId: string;
  treatment: string;
  preferredDate: string;
}): Promise<'sent' | 'configuration_pending' | 'failed'> {
  const rawWebhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  const webhookUrl = typeof rawWebhookUrl === 'string' ? rawWebhookUrl.trim() : '';

  if (!webhookUrl) {
    return 'configuration_pending';
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(webhookUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return 'failed';
    }
  } catch {
    return 'failed';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        event: 'new_consultation_enquiry',
        clinic: 'N7 Aesthetics',
        enquiryId: payload.enquiryId,
        treatment: payload.treatment,
        preferredDate: payload.preferredDate,
        submittedAt: new Date().toISOString(),
        piiOmitted: true,
      }),
    });

    if (!response.ok) {
      console.error(`Optional notification webhook returned HTTP ${response.status}`);
      return 'failed';
    }

    return 'sent';
  } catch (err) {
    console.error('Optional notification webhook error:', err);
    return 'failed';
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, {
      ok: false,
      mode: 'method_not_allowed',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Method Not Allowed. Use POST /api/appointments.',
    });
    return;
  }

  if (!isOriginAllowed(req)) {
    sendJson(res, 403, {
      ok: false,
      mode: 'forbidden_origin',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Cross-origin appointment requests are not permitted.',
    });
    return;
  }

  const bodyResult = await readRawBody(req);

  if (bodyResult.status === 'too_large') {
    sendJson(res, 413, {
      ok: false,
      mode: 'payload_too_large',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Request payload exceeds the 16KB maximum limit.',
    });
    return;
  }

  if (bodyResult.status === 'malformed' || !bodyResult.data) {
    sendJson(res, 400, {
      ok: false,
      mode: 'malformed_request',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Malformed JSON request body.',
    });
    return;
  }

  const body = bodyResult.data;

  // Reject unexpected top-level keys
  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      sendJson(res, 400, {
        ok: false,
        mode: 'malformed_request',
        notificationStatus: 'not_attempted',
        notificationDispatched: false,
        message: `Unexpected field in request payload: ${key}`,
      });
      return;
    }
  }

  const {
    enquiryId,
    name,
    phone,
    email,
    treatment,
    preferredDate,
    message,
    privacyConsent,
    website_url,
    liveMode,
  } = body;

  // Validate honeypot field type and check for bot fills
  if (website_url !== undefined && website_url !== null && typeof website_url !== 'string') {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Invalid honeypot field format.',
    });
    return;
  }

  if (typeof website_url === 'string' && website_url.trim().length > 0) {
    sendJson(res, 200, {
      ok: true,
      mode: 'honeypot_filtered',
      notificationStatus: 'skipped',
      notificationDispatched: false,
      message: 'Demo Mode — Booking integration is being configured.',
    });
    return;
  }

  // Strict type checks for required fields
  if (
    typeof name !== 'string' ||
    typeof phone !== 'string' ||
    typeof treatment !== 'string' ||
    typeof preferredDate !== 'string' ||
    typeof privacyConsent !== 'boolean'
  ) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message:
        'Invalid field types. Name, phone, treatment, and preferredDate must be strings, and privacyConsent must be a boolean.',
    });
    return;
  }

  // Strict type checks for optional fields
  if (email !== undefined && email !== null && typeof email !== 'string') {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Optional email field must be a string.',
    });
    return;
  }

  if (message !== undefined && message !== null && typeof message !== 'string') {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Optional message field must be a string.',
    });
    return;
  }

  if (liveMode !== undefined && typeof liveMode !== 'boolean') {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Optional liveMode flag must be a boolean.',
    });
    return;
  }

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const cleanedPhone = trimmedPhone.replace(/[\s()-]/g, '');
  const trimmedTreatment = treatment.trim();
  const trimmedDate = preferredDate.trim();
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (trimmedName.length < 2 || trimmedName.length > 120) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Full name must be between 2 and 120 characters.',
    });
    return;
  }

  if (
    trimmedPhone.length < 7 ||
    trimmedPhone.length > 30 ||
    !/^\+?[0-9]{7,15}$/.test(cleanedPhone)
  ) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Phone number must be a valid contact number (7 to 15 digits).',
    });
    return;
  }

  if (trimmedTreatment.length < 2 || trimmedTreatment.length > 120) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Treatment selection must be between 2 and 120 characters.',
    });
    return;
  }

  if (
    trimmedDate.length < 8 ||
    trimmedDate.length > 20 ||
    !isValidIsoDateString(trimmedDate)
  ) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Preferred consultation date must be a valid YYYY-MM-DD date.',
    });
    return;
  }

  if (privacyConsent !== true) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Privacy consent is required to submit a consultation enquiry.',
    });
    return;
  }

  if (
    trimmedEmail.length > 0 &&
    (trimmedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
  ) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Optional email must be a valid email address up to 254 characters.',
    });
    return;
  }

  if (trimmedMessage.length > 500) {
    sendJson(res, 400, {
      ok: false,
      mode: 'validation_error',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Optional note must not exceed 500 characters.',
    });
    return;
  }

  // Enforce rate limiting before any live notification or external call
  const clientIp = getClientIp(req);
  const withinRateLimit = await checkRateLimit(clientIp);
  if (!withinRateLimit) {
    res.setHeader('Retry-After', '20');
    sendJson(res, 429, {
      ok: false,
      mode: 'throttled',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message: 'Too many consultation requests from this address. Please wait a minute and try again.',
    });
    return;
  }

  // Live Mode: Do NOT trust client-supplied liveMode alone.
  // Require a valid, fresh enquiryId AND verify on the server that bookingLiveMode is enabled in Firestore.
  if (liveMode === true) {
    const enquiryCheck = validateEnquiryIdAndIdempotency(enquiryId);
    if (!enquiryCheck.valid) {
      if (enquiryCheck.reason === 'duplicate') {
        sendJson(res, 409, {
          ok: false,
          mode: 'duplicate_enquiry',
          notificationStatus: 'skipped',
          notificationDispatched: false,
          message: 'This consultation enquiry notification has already been processed.',
        });
        return;
      }
      sendJson(res, 400, {
        ok: false,
        mode: 'unverified_enquiry_reference',
        notificationStatus: 'not_attempted',
        notificationDispatched: false,
        message:
          'A valid, recent Firestore enquiry reference ID is required to trigger staff notification.',
      });
      return;
    }

    const serverLiveModeActive = await verifyServerBookingLiveModeEnabled();
    if (!serverLiveModeActive) {
      sendJson(res, 200, {
        ok: true,
        mode: 'demo_mode',
        notificationStatus: 'skipped',
        notificationDispatched: false,
        message:
          'Demo Mode — Live booking mode is not currently enabled in clinic settings. No staff notification was dispatched.',
      });
      return;
    }

    const webhookStatus = await dispatchOptionalWebhookNotification({
      enquiryId: String(enquiryId).trim(),
      treatment: trimmedTreatment,
      preferredDate: trimmedDate,
    });

    if (webhookStatus === 'sent') {
      sendJson(res, 200, {
        ok: true,
        mode: 'notification_sent',
        notificationStatus: 'sent',
        notificationDispatched: true,
        message:
          'Enquiry logged for clinic coordinator review and staff notification dispatched. Please note this does not confirm a booked appointment slot until the clinic contacts you.',
      });
      return;
    }

    if (webhookStatus === 'configuration_pending') {
      sendJson(res, 200, {
        ok: true,
        mode: 'configuration_pending',
        notificationStatus: 'configuration_pending',
        notificationDispatched: false,
        message:
          'Enquiry validated for clinic coordinator review. Optional staff webhook notification is not yet configured on the server. Please note this does not confirm a booked appointment slot until the clinic contacts you.',
      });
      return;
    }

    // Webhook was configured in environment but failed to deliver
    sendJson(res, 502, {
      ok: false,
      mode: 'notification_error',
      notificationStatus: 'failed',
      notificationDispatched: false,
      message:
        'Optional staff webhook notification failed to deliver. Please note this does not confirm a booked appointment slot.',
    });
    return;
  }

  // Demo Mode response (clearly labelled, no fake appointment confirmation)
  sendJson(res, 200, {
    ok: true,
    mode: 'demo_mode',
    notificationStatus: 'configuration_pending',
    notificationDispatched: false,
    message:
      'Demo Mode — Booking integration is being configured. Your request format was validated, and no appointment has been booked.',
  });
}
