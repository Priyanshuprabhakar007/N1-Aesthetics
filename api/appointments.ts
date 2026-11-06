import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { cert, getApps, initializeApp, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
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

export interface VerifiedFirestoreEnquiryRecord {
  enquiryId: string;
  name: string;
  phone: string;
  email?: string;
  treatment: string;
  preferredDate: string;
  message?: string;
  privacyConsent: boolean;
  status: string;
  createdAtMs: number;
  createdAtIso: string;
}

export type IdempotencyAcquireResult =
  | { acquired: true; attemptCount: number }
  | { acquired: false; reason: 'duplicate' | 'in_flight' | 'retry_cooldown' | 'max_attempts_exceeded' };

export interface AppointmentServerBackend {
  isBookingLiveModeEnabled(): Promise<boolean>;
  getVerifiedEnquiry(enquiryId: string): Promise<VerifiedFirestoreEnquiryRecord | null>;
  acquireNotificationLock(enquiryId: string, nowMs: number): Promise<IdempotencyAcquireResult>;
  finalizeNotificationLock(
    enquiryId: string,
    finalStatus: 'sent' | 'configuration_pending' | 'failed',
    attemptCount: number,
    nowMs: number
  ): Promise<void>;
  checkDistributedRateLimit?(
    clientIpHash: string,
    windowBucket: number,
    maxRequests: number,
    nowMs: number
  ): Promise<'allowed' | 'throttled' | 'unavailable'>;
}

const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB
const WEBHOOK_TIMEOUT_MS = 5000;
const ENQUIRY_MAX_AGE_MS = 60 * 1000; // 60 seconds freshness window
const ENQUIRY_ID_DOC_CLOCK_SKEW_MS = 15 * 1000; // Max 15s skew between client ID timestamp and server Timestamp
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per 60s per IP
const NOTIFICATION_LOCK_LEASE_MS = 15 * 1000; // 15s atomic in-flight lease
const MAX_NOTIFICATION_ATTEMPTS = 3; // Max persistent delivery attempts per enquiryId
const RETRY_BASE_COOLDOWN_MS = 2000; // Minimum cooldown between external retries

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

// Local non-production Demo Mode fallback bucket ONLY (never used in production or Live Mode)
const localDemoIpBuckets = new Map<string, number[]>();

let cachedAdminFirestore: AdminFirestore | null = null;
let testBackendOverride: AppointmentServerBackend | null = null;
let testFetchOverride: typeof fetch | null = null;

export function resetAppointmentAbuseCachesForTest(): void {
  localDemoIpBuckets.clear();
  testBackendOverride = null;
  testFetchOverride = null;
}

/**
 * Explicit test-only dependency injection hook for unit/integration testing.
 * Strictly forbidden in production runtimes.
 */
export function setAppointmentServerDependenciesForTest(options: {
  backend?: AppointmentServerBackend | null;
  fetchImpl?: typeof fetch | null;
}): void {
  if (isProductionRuntime()) {
    throw new Error('Test dependency overrides are forbidden in production runtimes.');
  }
  testBackendOverride = options.backend ?? null;
  testFetchOverride = options.fetchImpl ?? null;
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL === '1'
  );
}

function getEffectiveFetch(): typeof fetch {
  return testFetchOverride || fetch;
}

function hashIpForStorage(ip: string): string {
  return crypto.createHash('sha256').update(`n7-ratelimit:${ip}`).digest('hex').slice(0, 32);
}

function parseServiceAccountFromEnv(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const decoded = rawJson.startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };
      const projectId =
        parsed.project_id ||
        parsed.projectId ||
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        appletConfig.projectId;
      const clientEmail = parsed.client_email || parsed.clientEmail || '';
      const privateKey = (parsed.private_key || parsed.privateKey || '').replace(/\\n/g, '\n');
      if (projectId && clientEmail && privateKey.includes('PRIVATE KEY')) {
        return { projectId, clientEmail, privateKey };
      }
    } catch {
      return null;
    }
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    appletConfig.projectId;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() || '';
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim() || '';
  const privateKey = rawPrivateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey.includes('PRIVATE KEY')) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

/**
 * Initializes the privileged server-side Firebase Admin Firestore SDK.
 * Public Firebase API keys or unauthenticated REST reads are NEVER treated as privileged auth.
 */
function getAuthenticatedAdminFirestore(): AdminFirestore | null {
  if (cachedAdminFirestore) {
    return cachedAdminFirestore;
  }

  const credentials = parseServiceAccountFromEnv();
  if (!credentials) {
    return null;
  }

  const databaseId =
    process.env.FIREBASE_FIRESTORE_DATABASE_ID?.trim() ||
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim() ||
    appletConfig.firestoreDatabaseId ||
    '(default)';

  try {
    const appName = 'n7-aesthetics-admin-verifier';
    const existingApp = getApps().find((a) => a.name === appName);
    const adminApp: AdminApp =
      existingApp ||
      initializeApp(
        {
          credential: cert({
            projectId: credentials.projectId,
            clientEmail: credentials.clientEmail,
            privateKey: credentials.privateKey,
          }),
          projectId: credentials.projectId,
        },
        appName
      );

    cachedAdminFirestore = getFirestore(adminApp, databaseId);
    return cachedAdminFirestore;
  } catch (err) {
    console.error('Failed to initialize Firebase Admin Firestore SDK:', err);
    return null;
  }
}

function extractTimestampMs(val: unknown): number | null {
  if (!val) return null;
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) {
    const ms = val.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof val === 'string') {
    const ms = Date.parse(val);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  return null;
}

function createFirebaseAdminBackend(db: AdminFirestore): AppointmentServerBackend {
  return {
    async isBookingLiveModeEnabled(): Promise<boolean> {
      const snap = await db.collection('site_settings').doc('main').get();
      if (!snap.exists) {
        return false;
      }
      const data = snap.data();
      return data?.bookingLiveMode === true;
    },

    async getVerifiedEnquiry(enquiryId: string): Promise<VerifiedFirestoreEnquiryRecord | null> {
      const snap = await db.collection('appointment_enquiries').doc(enquiryId).get();
      if (!snap.exists) {
        return null;
      }
      const data = snap.data();
      if (!data) {
        return null;
      }

      const name = typeof data.name === 'string' ? data.name.trim() : '';
      const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
      const cleanedPhone = phone.replace(/[\s()-]/g, '');
      const treatment = typeof data.treatment === 'string' ? data.treatment.trim() : '';
      const preferredDate = typeof data.preferredDate === 'string' ? data.preferredDate.trim() : '';
      const privacyConsent = data.privacyConsent === true;
      const status = typeof data.status === 'string' ? data.status : '';
      const createdAtMs = extractTimestampMs(data.createdAt);

      if (
        name.length < 2 ||
        name.length > 120 ||
        phone.length < 7 ||
        phone.length > 30 ||
        !/^\+?[0-9]{7,15}$/.test(cleanedPhone) ||
        treatment.length < 2 ||
        treatment.length > 120 ||
        !isValidIsoDateString(preferredDate) ||
        !privacyConsent ||
        status !== 'new' ||
        createdAtMs === null
      ) {
        return null;
      }

      return {
        enquiryId: snap.id,
        name,
        phone,
        email: typeof data.email === 'string' ? data.email.trim() : undefined,
        treatment,
        preferredDate,
        message: typeof data.message === 'string' ? data.message.trim() : undefined,
        privacyConsent: true,
        status,
        createdAtMs,
        createdAtIso: new Date(createdAtMs).toISOString(),
      };
    },

    async acquireNotificationLock(
      enquiryId: string,
      nowMs: number
    ): Promise<IdempotencyAcquireResult> {
      const lockRef = db.collection('appointment_notification_locks').doc(enquiryId);
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(lockRef);
        if (snap.exists) {
          const data = snap.data() || {};
          const status = data.status as string | undefined;
          const attemptCount = typeof data.attemptCount === 'number' ? data.attemptCount : 1;
          const leaseExpiresAtMs =
            typeof data.leaseExpiresAtMs === 'number' ? data.leaseExpiresAtMs : 0;
          const nextRetryAllowedAtMs =
            typeof data.nextRetryAllowedAtMs === 'number' ? data.nextRetryAllowedAtMs : 0;

          if (status === 'sent' || status === 'configuration_pending') {
            return { acquired: false, reason: 'duplicate' };
          }

          if (status === 'sending' && leaseExpiresAtMs > nowMs) {
            return { acquired: false, reason: 'in_flight' };
          }

          if (attemptCount >= MAX_NOTIFICATION_ATTEMPTS) {
            return { acquired: false, reason: 'max_attempts_exceeded' };
          }

          if (status === 'failed' && nextRetryAllowedAtMs > nowMs) {
            return { acquired: false, reason: 'retry_cooldown' };
          }

          const nextAttempt = attemptCount + 1;
          tx.set(
            lockRef,
            {
              enquiryId,
              status: 'sending',
              attemptCount: nextAttempt,
              lockedAtMs: nowMs,
              leaseExpiresAtMs: nowMs + NOTIFICATION_LOCK_LEASE_MS,
              updatedAtMs: nowMs,
            },
            { merge: true }
          );
          return { acquired: true, attemptCount: nextAttempt };
        }

        tx.set(lockRef, {
          enquiryId,
          status: 'sending',
          attemptCount: 1,
          createdAtMs: nowMs,
          lockedAtMs: nowMs,
          leaseExpiresAtMs: nowMs + NOTIFICATION_LOCK_LEASE_MS,
          updatedAtMs: nowMs,
        });
        return { acquired: true, attemptCount: 1 };
      });
    },

    async finalizeNotificationLock(
      enquiryId: string,
      finalStatus: 'sent' | 'configuration_pending' | 'failed',
      attemptCount: number,
      nowMs: number
    ): Promise<void> {
      const lockRef = db.collection('appointment_notification_locks').doc(enquiryId);
      await lockRef.set(
        {
          enquiryId,
          status: finalStatus,
          attemptCount,
          leaseExpiresAtMs: 0,
          nextRetryAllowedAtMs:
            finalStatus === 'failed' ? nowMs + RETRY_BASE_COOLDOWN_MS * attemptCount : 0,
          updatedAtMs: nowMs,
        },
        { merge: true }
      );
    },

    async checkDistributedRateLimit(
      clientIpHash: string,
      windowBucket: number,
      maxRequests: number,
      nowMs: number
    ): Promise<'allowed' | 'throttled' | 'unavailable'> {
      try {
        const docId = `rl_${clientIpHash}_${windowBucket}`;
        const rateRef = db.collection('appointment_rate_limits').doc(docId);
        return await db.runTransaction(async (tx) => {
          const snap = await tx.get(rateRef);
          const currentCount = snap.exists ? Number(snap.data()?.count || 0) : 0;
          if (currentCount >= maxRequests) {
            return 'throttled';
          }
          tx.set(
            rateRef,
            {
              count: currentCount + 1,
              windowBucket,
              updatedAtMs: nowMs,
              expiresAtMs: (windowBucket + 2) * RATE_LIMIT_WINDOW_MS,
            },
            { merge: true }
          );
          return 'allowed';
        });
      } catch (err) {
        console.error('Firestore distributed rate limiter error:', err);
        return 'unavailable';
      }
    },
  };
}

function getActiveServerBackend(): AppointmentServerBackend | null {
  if (testBackendOverride && !isProductionRuntime()) {
    return testBackendOverride;
  }
  const adminDb = getAuthenticatedAdminFirestore();
  if (!adminDb) {
    return null;
  }
  return createFirebaseAdminBackend(adminDb);
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

  const allowedEnvUrls = [
    process.env.APP_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

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
 * Enforces rate limiting across serverless instances:
 * 1. Uses Upstash Redis REST API when configured (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`).
 *    If Upstash is configured and fails/unreachable, fails closed ('unavailable') rather than bypassing.
 * 2. Otherwise uses the authenticated Firebase Admin Firestore distributed rate limiter (`appointment_rate_limits`).
 * 3. In production (`NODE_ENV === 'production' || VERCEL === '1'`) or when `requireDistributed` is true,
 *    a distributed limiter MUST succeed; if unavailable, fails safely ('unavailable') and never falls back to
 *    per-instance memory.
 */
async function checkRateLimit(
  clientIp: string,
  options: { requireDistributed: boolean; backend: AppointmentServerBackend | null }
): Promise<'allowed' | 'throttled' | 'unavailable'> {
  const now = Date.now();
  const windowBucket = Math.floor(now / RATE_LIMIT_WINDOW_MS);
  const ipHash = hashIpForStorage(clientIp);

  // 1. Primary Distributed Limiter: Upstash Redis REST API
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    try {
      const key = `n7:ratelimit:appointments:${ipHash}:${windowBucket}`;
      const resp = await getEffectiveFetch()(`${upstashUrl.replace(/\/$/, '')}/pipeline`, {
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
      if (!resp.ok) {
        return 'unavailable';
      }
      const result = (await resp.json()) as Array<{ result?: number }>;
      const count = Number(result?.[0]?.result || 0);
      if (!Number.isFinite(count) || count <= 0) {
        return 'unavailable';
      }
      return count > RATE_LIMIT_MAX_REQUESTS ? 'throttled' : 'allowed';
    } catch {
      // Fail closed when distributed Redis limiter is configured but unreachable
      return 'unavailable';
    }
  }

  // 2. Secondary Distributed Limiter: Authenticated Firebase Admin Firestore Transaction
  if (options.backend?.checkDistributedRateLimit) {
    return await options.backend.checkDistributedRateLimit(
      ipHash,
      windowBucket,
      RATE_LIMIT_MAX_REQUESTS,
      now
    );
  }

  // 3. If running in production or live mode, refuse to fall back to per-instance memory
  if (options.requireDistributed || isProductionRuntime()) {
    return 'unavailable';
  }

  // 4. Local non-production Demo Mode fallback only
  if (localDemoIpBuckets.size > 500) {
    const oldestAllowed = now - RATE_LIMIT_WINDOW_MS;
    for (const [ip, timestamps] of localDemoIpBuckets.entries()) {
      const recent = timestamps.filter((t) => t > oldestAllowed);
      if (recent.length === 0) {
        localDemoIpBuckets.delete(ip);
      } else {
        localDemoIpBuckets.set(ip, recent);
      }
    }
  }

  const existing = (localDemoIpBuckets.get(clientIp) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (existing.length >= RATE_LIMIT_MAX_REQUESTS) {
    localDemoIpBuckets.set(clientIp, existing);
    return 'throttled';
  }
  existing.push(now);
  localDemoIpBuckets.set(clientIp, existing);
  return 'allowed';
}

function parseEnquiryIdFormat(
  enquiryId: unknown,
  nowMs: number
): { valid: true; trimmedId: string; idTimestampMs: number } | { valid: false } {
  if (typeof enquiryId !== 'string') {
    return { valid: false };
  }
  const trimmedId = enquiryId.trim();
  const match = /^enq_(\d{13})_([a-z0-9]{4,12})$/.exec(trimmedId);
  if (!match) {
    return { valid: false };
  }

  const idTimestampMs = Number.parseInt(match[1], 10);
  if (Number.isNaN(idTimestampMs) || Math.abs(nowMs - idTimestampMs) > ENQUIRY_MAX_AGE_MS) {
    return { valid: false };
  }

  return { valid: true, trimmedId, idTimestampMs };
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

function isTransientWebhookStatus(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}

/**
 * Dispatches a privacy-safe server-side webhook notification using ONLY verified Firestore metadata.
 * Includes an `Idempotency-Key` header and bounded retry for transient 5xx/network errors.
 */
async function dispatchOptionalWebhookNotification(verifiedRecord: {
  enquiryId: string;
  treatment: string;
  preferredDate: string;
  createdAtIso: string;
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

  const bodyPayload = JSON.stringify({
    event: 'new_consultation_enquiry',
    clinic: 'N7 Aesthetics',
    enquiryId: verifiedRecord.enquiryId,
    treatment: verifiedRecord.treatment,
    preferredDate: verifiedRecord.preferredDate,
    submittedAt: verifiedRecord.createdAtIso,
    piiOmitted: true,
  });

  const maxDeliveryTries = 2;
  for (let attempt = 1; attempt <= maxDeliveryTries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await getEffectiveFetch()(parsedUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `n7-enquiry-${verifiedRecord.enquiryId}`,
          'X-N7-Enquiry-Id': verifiedRecord.enquiryId,
        },
        signal: controller.signal,
        body: bodyPayload,
      });

      if (response.ok) {
        return 'sent';
      }

      console.error(
        `Optional notification webhook returned HTTP ${response.status} (attempt ${attempt}/${maxDeliveryTries})`
      );

      if (!isTransientWebhookStatus(response.status) || attempt === maxDeliveryTries) {
        return 'failed';
      }
    } catch (err) {
      console.error(
        `Optional notification webhook error (attempt ${attempt}/${maxDeliveryTries}):`,
        err
      );
      if (attempt === maxDeliveryTries) {
        return 'failed';
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Short backoff before single retry on transient failure
    await new Promise((r) => setTimeout(r, 250 * attempt));
  }

  return 'failed';
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

  const backend = getActiveServerBackend();
  const clientIp = getClientIp(req);
  const rateLimitResult = await checkRateLimit(clientIp, {
    requireDistributed: isProductionRuntime() || liveMode === true,
    backend,
  });

  if (rateLimitResult === 'throttled') {
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

  if (rateLimitResult === 'unavailable') {
    // If Live Mode is requested or running in production without an available distributed limiter:
    // Fail safely (fail closed) so rate limiting can never be bypassed across serverless instances.
    if (liveMode === true && !backend) {
      sendJson(res, 200, {
        ok: true,
        mode: 'configuration_pending',
        notificationStatus: 'configuration_pending',
        notificationDispatched: false,
        message:
          'Enquiry recorded in Firestore. Server-side Firebase Admin verification credentials are pending configuration.',
      });
      return;
    }

    res.setHeader('Retry-After', '30');
    sendJson(res, 503, {
      ok: false,
      mode: 'throttled',
      notificationStatus: 'not_attempted',
      notificationDispatched: false,
      message:
        'Distributed rate limiting service is temporarily unavailable. Please wait a moment and try again.',
    });
    return;
  }

  if (liveMode === true) {
    const nowMs = Date.now();
    const parsedEnquiry = parseEnquiryIdFormat(enquiryId, nowMs);
    if (!parsedEnquiry.valid) {
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

    if (!backend) {
      sendJson(res, 200, {
        ok: true,
        mode: 'configuration_pending',
        notificationStatus: 'configuration_pending',
        notificationDispatched: false,
        message:
          'Enquiry recorded in Firestore. Server-side Firebase Admin credentials are pending configuration.',
      });
      return;
    }

    let serverLiveModeActive = false;
    let verifiedRecord: VerifiedFirestoreEnquiryRecord | null = null;
    try {
      serverLiveModeActive = await backend.isBookingLiveModeEnabled();
      if (serverLiveModeActive) {
        verifiedRecord = await backend.getVerifiedEnquiry(parsedEnquiry.trimmedId);
      }
    } catch (err) {
      console.error('Server-side Firestore verification error:', err);
      sendJson(res, 502, {
        ok: false,
        mode: 'notification_error',
        notificationStatus: 'failed',
        notificationDispatched: false,
        message:
          'Unable to verify consultation enquiry with Firestore. No staff notification was dispatched.',
      });
      return;
    }

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

    // Verify the Firestore document actually exists, is fresh, and matches the client-submitted enquiry
    if (
      !verifiedRecord ||
      Math.abs(nowMs - verifiedRecord.createdAtMs) > ENQUIRY_MAX_AGE_MS ||
      Math.abs(verifiedRecord.createdAtMs - parsedEnquiry.idTimestampMs) >
        ENQUIRY_ID_DOC_CLOCK_SKEW_MS ||
      verifiedRecord.name !== trimmedName ||
      verifiedRecord.phone !== trimmedPhone ||
      verifiedRecord.treatment !== trimmedTreatment ||
      verifiedRecord.preferredDate !== trimmedDate
    ) {
      sendJson(res, 400, {
        ok: false,
        mode: 'unverified_enquiry_reference',
        notificationStatus: 'not_attempted',
        notificationDispatched: false,
        message:
          'The referenced consultation enquiry could not be verified in Firestore or did not match the saved record.',
      });
      return;
    }

    // Persistent, atomic idempotency lock via Firestore transaction
    let lockResult: IdempotencyAcquireResult;
    try {
      lockResult = await backend.acquireNotificationLock(verifiedRecord.enquiryId, nowMs);
    } catch (err) {
      console.error('Failed to acquire persistent notification idempotency lock:', err);
      sendJson(res, 502, {
        ok: false,
        mode: 'notification_error',
        notificationStatus: 'failed',
        notificationDispatched: false,
        message: 'Unable to verify notification idempotency state.',
      });
      return;
    }

    if (!lockResult.acquired) {
      if (lockResult.reason === 'duplicate' || lockResult.reason === 'in_flight') {
        sendJson(res, 409, {
          ok: false,
          mode: 'duplicate_enquiry',
          notificationStatus: 'skipped',
          notificationDispatched: false,
          message: 'This consultation enquiry notification has already been processed.',
        });
        return;
      }

      sendJson(res, 429, {
        ok: false,
        mode: 'throttled',
        notificationStatus: 'not_attempted',
        notificationDispatched: false,
        message:
          lockResult.reason === 'max_attempts_exceeded'
            ? 'Maximum notification delivery attempts reached for this enquiry.'
            : 'Please wait a moment before retrying notification delivery.',
      });
      return;
    }

    // Construct notification strictly from the verified Firestore record (never from client body)
    const webhookStatus = await dispatchOptionalWebhookNotification({
      enquiryId: verifiedRecord.enquiryId,
      treatment: verifiedRecord.treatment,
      preferredDate: verifiedRecord.preferredDate,
      createdAtIso: verifiedRecord.createdAtIso,
    });

    try {
      await backend.finalizeNotificationLock(
        verifiedRecord.enquiryId,
        webhookStatus,
        lockResult.attemptCount,
        Date.now()
      );
    } catch (err) {
      console.error('Failed to finalize notification idempotency lock:', err);
    }

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
