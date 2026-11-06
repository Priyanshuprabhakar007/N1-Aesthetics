import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import handler, {
  resetAppointmentAbuseCachesForTest,
  setAppointmentServerDependenciesForTest,
  type AppointmentServerBackend,
  type VerifiedFirestoreEnquiryRecord,
  type IdempotencyAcquireResult,
} from './api/appointments';

const PROJECT_ID = 'gen-lang-client-0746984388';
const FIRESTORE_RULES = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
const STORAGE_RULES = fs.readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf8');

async function isFirebaseEmulatorRunning(): Promise<boolean> {
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    return true;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600);
  try {
    const resp = await fetch('http://127.0.0.1:4400/emulators', {
      signal: controller.signal,
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { firestore?: unknown; storage?: unknown };
    return Boolean(data && data.firestore && data.storage);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Real Firebase Security Rules Emulator Test Suite using @firebase/rules-unit-testing
 * Executes against live Firestore & Storage emulators when FIRESTORE_EMULATOR_HOST / port 8080 is reachable.
 */
export async function runRealFirebaseEmulatorRulesTests(): Promise<void> {
  const firestoreHostEnv = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [fsHost, fsPortRaw] = firestoreHostEnv.split(':');
  const fsPort = Number.parseInt(fsPortRaw || '8080', 10);

  const storageHostEnv = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
  const [stHost, stPortRaw] = storageHostEnv.split(':');
  const stPort = Number.parseInt(stPortRaw || '9199', 10);

  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: fsHost,
      port: fsPort,
      rules: FIRESTORE_RULES,
    },
    storage: {
      host: stHost,
      port: stPort,
      rules: STORAGE_RULES,
    },
  });

  try {
    await testEnv.clearFirestore();

    // Seed baseline data using security-rules-disabled context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'staff_roles', 'editor_uid_1'), {
        uid: 'editor_uid_1',
        email: 'editor@n7aesthetics.com',
        role: 'editor',
        createdAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'appointment_enquiries', 'enq_seeded_1'), {
        name: 'Aarav Sharma',
        phone: '+919876543210',
        treatment: 'rhinoplasty',
        preferredDate: '2026-12-15',
        privacyConsent: true,
        status: 'new',
        assignedTo: 'unassigned',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'testimonials', 'test_unconsented'), {
        patientIdentifier: 'P. K.',
        procedureContext: 'Rhinoplasty',
        quote: 'Draft quote pending patient consent verification.',
        consentVerified: false,
        published: false,
        authorUid: 'admin_uid_1',
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'testimonials', 'test_consented'), {
        patientIdentifier: 'A. S.',
        procedureContext: 'Rhinoplasty',
        quote: 'Consented and published patient reflection.',
        consentVerified: true,
        published: true,
        authorUid: 'admin_uid_1',
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'clinical_results', 'res_unconsented'), {
        treatmentSlug: 'rhinoplasty',
        treatmentTitle: 'Rhinoplasty',
        beforeImage: '/media/treatment-rhinoplasty.svg',
        afterImage: '/media/treatment-rhinoplasty.svg',
        clinicalNotes: '6 months post-op',
        consentReference: 'CONSENT-PENDING',
        consentVerified: false,
        published: false,
        authorUid: 'admin_uid_1',
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'clinical_results', 'res_consented'), {
        treatmentSlug: 'rhinoplasty',
        treatmentTitle: 'Rhinoplasty',
        beforeImage: '/media/treatment-rhinoplasty.svg',
        afterImage: '/media/treatment-rhinoplasty.svg',
        clinicalNotes: '6 months post-op',
        consentReference: 'CONSENT-2026-01',
        consentVerified: true,
        published: true,
        authorUid: 'admin_uid_1',
        updatedAt: Timestamp.now(),
      });
    });

    const unauthContext = testEnv.unauthenticatedContext();
    const regularUserContext = testEnv.authenticatedContext('user_regular_1', {
      email: 'visitor@example.com',
      email_verified: true,
    });
    const spoofedUnverifiedAdminContext = testEnv.authenticatedContext('spoof_admin', {
      email: 'dilseinvite@gmail.com',
      email_verified: false,
    });
    const editorContext = testEnv.authenticatedContext('editor_uid_1', {
      email: 'editor@n7aesthetics.com',
      email_verified: true,
      role: 'editor',
    });
    const bootstrapAdminContext = testEnv.authenticatedContext('admin_uid_1', {
      email: 'dilseinvite@gmail.com',
      email_verified: true,
      role: 'admin',
    });

    // 1. Unauthenticated & regular users cannot read or modify appointment enquiries
    await assertFails(getDoc(doc(unauthContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(getDoc(doc(regularUserContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(getDoc(doc(spoofedUnverifiedAdminContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(
      updateDoc(doc(regularUserContext.firestore(), 'appointment_enquiries', 'enq_seeded_1'), {
        status: 'contacted',
      })
    );

    // 2. Staff (editor & admin) can read appointment enquiries; only admin can delete
    await assertSucceeds(getDoc(doc(editorContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(deleteDoc(doc(editorContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertSucceeds(deleteDoc(doc(bootstrapAdminContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));

    // 3. Regular users cannot assign themselves admin or editor roles
    await assertFails(
      setDoc(doc(regularUserContext.firestore(), 'staff_roles', 'user_regular_1'), {
        uid: 'user_regular_1',
        email: 'visitor@example.com',
        role: 'admin',
        createdAt: Timestamp.now(),
      })
    );
    await assertFails(getDocs(collection(regularUserContext.firestore(), 'staff_roles')));

    // 4. Public can read testimonials and clinical results ONLY when published == true && consentVerified == true
    await assertFails(getDoc(doc(unauthContext.firestore(), 'testimonials', 'test_unconsented')));
    await assertSucceeds(getDoc(doc(unauthContext.firestore(), 'testimonials', 'test_consented')));
    await assertFails(getDoc(doc(unauthContext.firestore(), 'clinical_results', 'res_unconsented')));
    await assertSucceeds(getDoc(doc(unauthContext.firestore(), 'clinical_results', 'res_consented')));

    // 5. Storage rules verification
    const tinyWebpDataUrl =
      'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

    // Regular user cannot upload to treatments folder
    const unauthTreatmentRef = storageRef(
      regularUserContext.storage(),
      'n7_media/treatments/1762380000000_abc12345_rhinoplasty.webp'
    );
    await assertFails(
      uploadString(unauthTreatmentRef, tinyWebpDataUrl, 'data_url', {
        contentType: 'image/webp',
        customMetadata: {
          uploadedByUid: 'user_regular_1',
          consentVerified: 'false',
          published: 'false',
          consentReference: '',
        },
      })
    );

    // Staff (editor) can upload valid image with matching metadata to treatments folder
    const editorTreatmentRef = storageRef(
      editorContext.storage(),
      'n7_media/treatments/1762380000000_abc12345_rhinoplasty.webp'
    );
    await assertSucceeds(
      uploadString(editorTreatmentRef, tinyWebpDataUrl, 'data_url', {
        contentType: 'image/webp',
        customMetadata: {
          uploadedByUid: 'editor_uid_1',
          consentVerified: 'false',
          published: 'false',
          consentReference: '',
        },
      })
    );

    // Staff cannot upload to clinical_results_consented without consentVerified == 'true' & consentReference
    const unconsentedResultRef = storageRef(
      editorContext.storage(),
      'n7_media/clinical_results_consented/1762380000000_abc12345_case1.webp'
    );
    await assertFails(
      uploadString(unconsentedResultRef, tinyWebpDataUrl, 'data_url', {
        contentType: 'image/webp',
        customMetadata: {
          uploadedByUid: 'editor_uid_1',
          consentVerified: 'false',
          published: 'true',
          consentReference: '',
        },
      })
    );

    // Staff can upload to clinical_results_consented when consentVerified == 'true' & valid consentReference
    const consentedResultRef = storageRef(
      editorContext.storage(),
      'n7_media/clinical_results_consented/1762380000000_abc12345_case2.webp'
    );
    await assertSucceeds(
      uploadString(consentedResultRef, tinyWebpDataUrl, 'data_url', {
        contentType: 'image/webp',
        customMetadata: {
          uploadedByUid: 'editor_uid_1',
          consentVerified: 'true',
          published: 'true',
          consentReference: 'CONSENT-2026-009',
        },
      })
    );
    await assertSucceeds(getDownloadURL(consentedResultRef));

    // Editor cannot delete storage object; Admin can delete
    await assertFails(deleteObject(editorTreatmentRef));
    await assertSucceeds(deleteObject(
      storageRef(
        bootstrapAdminContext.storage(),
        'n7_media/treatments/1762380000000_abc12345_rhinoplasty.webp'
      )
    ));
  } finally {
    await testEnv.cleanup();
  }
}

/**
 * Comprehensive server-side security test suite for /api/appointments.ts
 * Verifies:
 * 1. Authenticated Firestore record existence & schema validation before webhook dispatch
 * 2. Complete removal of NOTIFICATION_SKIP_FIRESTORE_CHECK bypass
 * 3. Anti-forgery: client-supplied fields cannot forge notification metadata; webhook payload uses verified Firestore record
 * 4. Persistent, atomic idempotency lock preventing duplicate messages across invocations + safe retry on transient failure
 * 5. Distributed rate limiting & fail-safe (fail-closed) behavior when distributed limiter is unavailable
 * 6. Storage path & metadata contract compatibility between AdminPage.tsx and storage.rules
 */
async function runAppointmentApiAndContractTests(): Promise<void> {
  // Verify storage.rules and AdminPage.tsx alignment on paths and metadata keys
  const adminPageSource = fs.readFileSync(
    path.join(process.cwd(), 'src/pages/AdminPage.tsx'),
    'utf8'
  );
  assert.ok(
    STORAGE_RULES.includes(
      "request.resource.metadata.keys().hasAll(['uploadedByUid', 'consentVerified', 'published', 'consentReference'])"
    ),
    'storage.rules must validate all 4 customMetadata keys produced by AdminPage.tsx'
  );
  assert.ok(
    adminPageSource.includes('const path = `n7_media/${folder}/${filename}`;'),
    'AdminPage.tsx must upload to n7_media/{folder}/{filename}'
  );

  // Set up an in-memory mock of the privileged Firebase Admin backend to test /api/appointments logic deterministically
  const storedEnquiries = new Map<string, VerifiedFirestoreEnquiryRecord>();
  const notificationLocks = new Map<
    string,
    {
      status: 'sending' | 'sent' | 'configuration_pending' | 'failed';
      attemptCount: number;
      leaseExpiresAtMs: number;
      nextRetryAllowedAtMs: number;
    }
  >();
  const rateLimitCounts = new Map<string, number>();
  let liveModeEnabledInDb = true;
  let rateLimiterAvailable = true;

  const mockAdminBackend: AppointmentServerBackend = {
    async isBookingLiveModeEnabled() {
      return liveModeEnabledInDb;
    },
    async getVerifiedEnquiry(enquiryId: string) {
      return storedEnquiries.get(enquiryId) || null;
    },
    async acquireNotificationLock(
      enquiryId: string,
      nowMs: number
    ): Promise<IdempotencyAcquireResult> {
      const existing = notificationLocks.get(enquiryId);
      if (existing) {
        if (existing.status === 'sent' || existing.status === 'configuration_pending') {
          return { acquired: false, reason: 'duplicate' };
        }
        if (existing.status === 'sending' && existing.leaseExpiresAtMs > nowMs) {
          return { acquired: false, reason: 'in_flight' };
        }
        if (existing.attemptCount >= 3) {
          return { acquired: false, reason: 'max_attempts_exceeded' };
        }
        if (existing.status === 'failed' && existing.nextRetryAllowedAtMs > nowMs) {
          return { acquired: false, reason: 'retry_cooldown' };
        }
        const nextAttempt = existing.attemptCount + 1;
        notificationLocks.set(enquiryId, {
          status: 'sending',
          attemptCount: nextAttempt,
          leaseExpiresAtMs: nowMs + 15000,
          nextRetryAllowedAtMs: 0,
        });
        return { acquired: true, attemptCount: nextAttempt };
      }

      notificationLocks.set(enquiryId, {
        status: 'sending',
        attemptCount: 1,
        leaseExpiresAtMs: nowMs + 15000,
        nextRetryAllowedAtMs: 0,
      });
      return { acquired: true, attemptCount: 1 };
    },
    async finalizeNotificationLock(enquiryId, finalStatus, attemptCount, nowMs) {
      notificationLocks.set(enquiryId, {
        status: finalStatus,
        attemptCount,
        leaseExpiresAtMs: 0,
        nextRetryAllowedAtMs: finalStatus === 'failed' ? nowMs + 2000 * attemptCount : 0,
      });
    },
    async checkDistributedRateLimit(clientIpHash, windowBucket, maxRequests) {
      if (!rateLimiterAvailable) {
        return 'unavailable';
      }
      const key = `${clientIpHash}:${windowBucket}`;
      const next = (rateLimitCounts.get(key) || 0) + 1;
      rateLimitCounts.set(key, next);
      return next > maxRequests ? 'throttled' : 'allowed';
    },
  };

  const dispatchedWebhooks: Array<{ url: string; headers: Record<string, string>; body: any }> = [];
  let webhookStatusesToReturn: number[] = [200];

  const mockFetch: typeof fetch = async (input: any, init?: any) => {
    const status = webhookStatusesToReturn.length > 1
      ? webhookStatusesToReturn.shift()!
      : webhookStatusesToReturn[0] || 200;
    dispatchedWebhooks.push({
      url: String(input),
      headers: (init?.headers as Record<string, string>) || {},
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return {};
      },
    } as Response;
  };

  const invokeApi = async (
    body: any,
    headers: Record<string, string> = { 'content-type': 'application/json' },
    ip = '10.0.0.1'
  ) => {
    let statusCode = 200;
    let jsonBody: any = null;
    const req: any = {
      method: 'POST',
      headers,
      socket: { remoteAddress: ip },
      body,
    };
    const res: any = {
      setHeader() {},
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
    };
    await handler(req, res);
    return { statusCode, jsonBody };
  };

  resetAppointmentAbuseCachesForTest();
  setAppointmentServerDependenciesForTest({
    backend: mockAdminBackend,
    fetchImpl: mockFetch,
  });
  process.env.NOTIFICATION_WEBHOOK_URL = 'https://hooks.n7aesthetics.example/notify';

  // Test 1: Setting NOTIFICATION_SKIP_FIRESTORE_CHECK=true CANNOT bypass Firestore document existence verification
  process.env.NOTIFICATION_SKIP_FIRESTORE_CHECK = 'true';
  const now1 = Date.now();
  const fakeEnquiryId = `enq_${now1}_nonexist`;
  const rUnverified = await invokeApi(
    {
      enquiryId: fakeEnquiryId,
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.10'
  );
  assert.strictEqual(
    rUnverified.statusCode,
    400,
    'Must reject enquiryId that does not exist in Firestore even when NOTIFICATION_SKIP_FIRESTORE_CHECK=true'
  );
  assert.strictEqual(rUnverified.jsonBody.mode, 'unverified_enquiry_reference');
  assert.strictEqual(dispatchedWebhooks.length, 0);
  delete process.env.NOTIFICATION_SKIP_FIRESTORE_CHECK;

  // Test 2: Client cannot forge or alter notification fields for a saved enquiry
  const now2 = Date.now();
  const validEnquiryId = `enq_${now2}_valid123`;
  storedEnquiries.set(validEnquiryId, {
    enquiryId: validEnquiryId,
    name: 'Aarav Sharma',
    phone: '+919876543210',
    treatment: 'rhinoplasty',
    preferredDate: '2026-12-20',
    privacyConsent: true,
    status: 'new',
    createdAtMs: now2,
    createdAtIso: new Date(now2).toISOString(),
  });

  const rForgedTreatment = await invokeApi(
    {
      enquiryId: validEnquiryId,
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'forged-treatment-name',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.11'
  );
  assert.strictEqual(
    rForgedTreatment.statusCode,
    400,
    'Must reject request when client-supplied treatment does not match the saved Firestore document'
  );
  assert.strictEqual(rForgedTreatment.jsonBody.mode, 'unverified_enquiry_reference');
  assert.strictEqual(dispatchedWebhooks.length, 0);

  // Test 3: Verified enquiry dispatches webhook using metadata from the verified Firestore record + Idempotency-Key header
  const rVerified = await invokeApi(
    {
      enquiryId: validEnquiryId,
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.12'
  );
  assert.strictEqual(rVerified.statusCode, 200);
  assert.strictEqual(rVerified.jsonBody.mode, 'notification_sent');
  assert.strictEqual(dispatchedWebhooks.length, 1);
  assert.strictEqual(dispatchedWebhooks[0].headers['Idempotency-Key'], `n7-enquiry-${validEnquiryId}`);
  assert.strictEqual(dispatchedWebhooks[0].body.enquiryId, validEnquiryId);
  assert.strictEqual(dispatchedWebhooks[0].body.treatment, 'rhinoplasty');
  assert.strictEqual(dispatchedWebhooks[0].body.preferredDate, '2026-12-20');
  assert.strictEqual(dispatchedWebhooks[0].body.submittedAt, new Date(now2).toISOString());

  // Test 4: Persistent atomic idempotency prevents duplicate webhook delivery on replay
  const rReplay = await invokeApi(
    {
      enquiryId: validEnquiryId,
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.12'
  );
  assert.strictEqual(rReplay.statusCode, 409);
  assert.strictEqual(rReplay.jsonBody.mode, 'duplicate_enquiry');
  assert.strictEqual(dispatchedWebhooks.length, 1, 'Webhook must not be dispatched a second time');

  // Test 5: Safe retry strategy recovers from transient 503 webhook failure without losing notification
  const now3 = Date.now();
  const retryEnquiryId = `enq_${now3}_retry123`;
  storedEnquiries.set(retryEnquiryId, {
    enquiryId: retryEnquiryId,
    name: 'Meera Kapoor',
    phone: '+919876543211',
    treatment: 'hair-transplant',
    preferredDate: '2026-12-22',
    privacyConsent: true,
    status: 'new',
    createdAtMs: now3,
    createdAtIso: new Date(now3).toISOString(),
  });
  webhookStatusesToReturn = [503, 200]; // First attempt 503, second attempt 200 OK
  const rTransientRetry = await invokeApi(
    {
      enquiryId: retryEnquiryId,
      name: 'Meera Kapoor',
      phone: '+919876543211',
      treatment: 'hair-transplant',
      preferredDate: '2026-12-22',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.13'
  );
  assert.strictEqual(rTransientRetry.statusCode, 200);
  assert.strictEqual(rTransientRetry.jsonBody.mode, 'notification_sent');
  assert.strictEqual(dispatchedWebhooks.length, 3, 'Should have attempted 1 transient 503 + 1 successful retry');

  // Test 6: Fail safely (fail closed) when distributed rate limiter is unavailable
  rateLimiterAvailable = false;
  const rLimiterDown = await invokeApi(
    {
      enquiryId: retryEnquiryId,
      name: 'Meera Kapoor',
      phone: '+919876543211',
      treatment: 'hair-transplant',
      preferredDate: '2026-12-22',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.14'
  );
  assert.strictEqual(
    rLimiterDown.statusCode,
    503,
    'Must fail safely with 503 when distributed rate limiter is unavailable in live/production mode'
  );
  assert.strictEqual(rLimiterDown.jsonBody.notificationDispatched, false);

  rateLimiterAvailable = true;
  delete process.env.NOTIFICATION_WEBHOOK_URL;
  resetAppointmentAbuseCachesForTest();
}

async function main() {
  // 1. Run /api/appointments & storage/admin contract tests
  await runAppointmentApiAndContractTests();
  console.log('PASS: /api/appointments server-side verification, idempotency, retry, and distributed rate-limit tests passed.');

  // 2. Check if Firebase Rules Emulator is active
  const emulatorRunning = await isFirebaseEmulatorRunning();
  if (emulatorRunning) {
    await runRealFirebaseEmulatorRulesTests();
    console.log('PASS: Real Firebase Security Rules Emulator tests (firestore.rules & storage.rules) passed.');
  } else {
    console.log(
      'EMULATOR_STATUS: NOT_RUN (Local Firestore/Storage Emulator port 127.0.0.1:8080 is not active because a Java JVM runtime is not installed in this container. Run `npm run test:rules:emulator` in an environment with Java 11+ installed to execute `runRealFirebaseEmulatorRulesTests()`).'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
