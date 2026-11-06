import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import handler, {
  resetAppointmentAbuseCachesForTest,
  setAppointmentServerDependenciesForTest,
  type AppointmentServerBackend,
  type VerifiedFirestoreEnquiryRecord,
  type IdempotencyAcquireResult,
} from './api/appointments';

// Always use an offline demo-* project ID for emulator tests so tests never connect to production Firebase
const EMULATOR_PROJECT_ID = process.env.GCLOUD_PROJECT?.startsWith('demo-')
  ? process.env.GCLOUD_PROJECT
  : 'demo-n7-aesthetics';

const FIRESTORE_RULES = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
const STORAGE_RULES = fs.readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf8');

async function isFirebaseEmulatorRunning(): Promise<boolean> {
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    return true;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);
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
 * Executes against live local Firestore & Storage emulators.
 * Never connects to the production Firebase database.
 */
export async function runRealFirebaseEmulatorRulesTests(): Promise<void> {
  const firestoreHostEnv = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [fsHost, fsPortRaw] = firestoreHostEnv.split(':');
  const fsPort = Number.parseInt(fsPortRaw || '8080', 10);

  const storageHostEnv = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
  const [stHost, stPortRaw] = storageHostEnv.split(':');
  const stPort = Number.parseInt(stPortRaw || '9199', 10);

  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: EMULATOR_PROJECT_ID,
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
      await setDoc(doc(adminDb, 'treatments', 'rhinoplasty'), {
        slug: 'rhinoplasty',
        title: 'Rhinoplasty',
        shortTitle: 'Rhinoplasty',
        category: 'Facial Plastic Surgery',
        summary: 'Structural and aesthetic nasal refinement.',
        overview: 'Comprehensive evaluation of nasal harmony and airway function.',
        cardImage: '/media/treatment-rhinoplasty.jpg',
        approvalStatus: 'approved_by_clinic',
        isSignature: true,
        authorUid: 'admin_uid_1',
        updatedAt: Timestamp.now(),
      });
      await setDoc(doc(adminDb, 'treatments', 'hair-transplant'), {
        slug: 'hair-transplant',
        title: 'Hair Transplant',
        shortTitle: 'Hair Transplant',
        category: 'Hair Restoration',
        summary: 'Draft procedure concept pending clinic approval.',
        overview: 'Follicular unit restoration planning.',
        cardImage: '/media/treatment-hair-transplant.jpg',
        approvalStatus: 'draft_pending_clinic_approval',
        isSignature: true,
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

    // 1. Public visitor can create a valid enquiry with privacyConsent == true, but cannot create without consent
    await assertSucceeds(
      setDoc(doc(unauthContext.firestore(), 'appointment_enquiries', 'enq_public_valid_1'), {
        name: 'Priya Verma',
        phone: '+919876543219',
        treatment: 'rhinoplasty',
        preferredDate: '2026-12-28',
        privacyConsent: true,
        status: 'new',
        assignedTo: 'unassigned',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      setDoc(doc(unauthContext.firestore(), 'appointment_enquiries', 'enq_public_noconsent_1'), {
        name: 'Priya Verma',
        phone: '+919876543219',
        treatment: 'rhinoplasty',
        preferredDate: '2026-12-28',
        privacyConsent: false,
        status: 'new',
        assignedTo: 'unassigned',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // 2. Unauthenticated & regular users cannot read or modify appointment enquiries
    await assertFails(getDoc(doc(unauthContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(getDoc(doc(regularUserContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(getDoc(doc(spoofedUnverifiedAdminContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(
      updateDoc(doc(regularUserContext.firestore(), 'appointment_enquiries', 'enq_seeded_1'), {
        status: 'contacted',
      })
    );

    // 3. Staff (editor & admin) can read appointment enquiries; only admin can delete
    await assertSucceeds(getDoc(doc(editorContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertFails(deleteDoc(doc(editorContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));
    await assertSucceeds(deleteDoc(doc(bootstrapAdminContext.firestore(), 'appointment_enquiries', 'enq_seeded_1')));

    // 4. Regular users cannot assign themselves admin or editor roles
    await assertFails(
      setDoc(doc(regularUserContext.firestore(), 'staff_roles', 'user_regular_1'), {
        uid: 'user_regular_1',
        email: 'visitor@example.com',
        role: 'admin',
        createdAt: serverTimestamp(),
      })
    );
    await assertFails(getDocs(collection(regularUserContext.firestore(), 'staff_roles')));

    // 5. Public can read testimonials and clinical results ONLY when published == true && consentVerified == true
    await assertFails(getDoc(doc(unauthContext.firestore(), 'testimonials', 'test_unconsented')));
    await assertSucceeds(getDoc(doc(unauthContext.firestore(), 'testimonials', 'test_consented')));
    await assertFails(getDoc(doc(unauthContext.firestore(), 'clinical_results', 'res_unconsented')));
    await assertSucceeds(getDoc(doc(unauthContext.firestore(), 'clinical_results', 'res_consented')));

    // 6. Treatments access rules:
    // - Public access to approved treatment succeeds
    await assertSucceeds(getDoc(doc(unauthContext.firestore(), 'treatments', 'rhinoplasty')));
    // - Public access to draft treatment fails
    await assertFails(getDoc(doc(unauthContext.firestore(), 'treatments', 'hair-transplant')));
    // - Public listing of approved treatments works without permission errors
    const publicApprovedSnap = await assertSucceeds(
      getDocs(
        query(
          collection(unauthContext.firestore(), 'treatments'),
          where('approvalStatus', '==', 'approved_by_clinic')
        )
      )
    );
    assert.strictEqual(publicApprovedSnap.docs.length, 1);
    assert.strictEqual(publicApprovedSnap.docs[0].id, 'rhinoplasty');
    // - Public listing that includes draft treatments fails
    await assertFails(
      getDocs(
        query(
          collection(unauthContext.firestore(), 'treatments'),
          where('approvalStatus', 'in', ['draft_pending_clinic_approval', 'approved_by_clinic'])
        )
      )
    );
    // - Authorized staff (editor & admin) can access draft treatments and list both draft & approved treatments
    await assertSucceeds(getDoc(doc(editorContext.firestore(), 'treatments', 'hair-transplant')));
    await assertSucceeds(getDoc(doc(bootstrapAdminContext.firestore(), 'treatments', 'hair-transplant')));
    const staffAllTreatmentsSnap = await assertSucceeds(
      getDocs(
        query(
          collection(editorContext.firestore(), 'treatments'),
          where('approvalStatus', 'in', ['draft_pending_clinic_approval', 'approved_by_clinic'])
        )
      )
    );
    assert.strictEqual(staffAllTreatmentsSnap.docs.length, 2);

    // 7. Storage rules verification
    const validWebpBytes = new Uint8Array([
      82, 73, 70, 70, 34, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32, 22, 0, 0, 0, 48, 1, 0, 157, 1,
      42, 1, 0, 1, 0, 14, 192, 254, 37, 164, 0, 3, 112, 0, 0, 0, 0,
    ]);

    // Regular user cannot upload to treatments folder
    const unauthTreatmentRef = storageRef(
      regularUserContext.storage(),
      'n7_media/treatments/1762380000000_abc12345_rhinoplasty.webp'
    );
    await assertFails(
      uploadBytes(unauthTreatmentRef, validWebpBytes, {
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
      uploadBytes(editorTreatmentRef, validWebpBytes, {
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
      uploadBytes(unconsentedResultRef, validWebpBytes, {
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
      uploadBytes(consentedResultRef, validWebpBytes, {
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
    await assertSucceeds(
      deleteObject(
        storageRef(
          bootstrapAdminContext.storage(),
          'n7_media/treatments/1762380000000_abc12345_rhinoplasty.webp'
        )
      )
    );
  } finally {
    await testEnv.cleanup();
  }
}

/**
 * Comprehensive server-side security test suite for /api/appointments.ts
 */
async function runAppointmentApiAndContractTests(): Promise<void> {
  const adminPageSource = fs.readFileSync(
    path.join(process.cwd(), 'src/pages/AdminPage.tsx'),
    'utf8'
  );
  const cmsContextSource = fs.readFileSync(
    path.join(process.cwd(), 'src/context/CmsContext.tsx'),
    'utf8'
  );
  assert.ok(
    FIRESTORE_RULES.includes(
      "allow get: if isValidId(treatmentId) && (resource.data.approvalStatus == 'approved_by_clinic' || isStaff());"
    ) &&
      FIRESTORE_RULES.includes(
        "allow list: if resource.data.approvalStatus == 'approved_by_clinic' || isStaff();"
      ),
    'firestore.rules must restrict public treatment get/list to approvalStatus == approved_by_clinic while allowing staff access to drafts'
  );
  assert.ok(
    cmsContextSource.includes("where('approvalStatus', '==', 'approved_by_clinic')"),
    'CmsContext.tsx must filter public treatment queries by approvalStatus == approved_by_clinic'
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
    const status =
      webhookStatusesToReturn.length > 1
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
  assert.strictEqual(
    dispatchedWebhooks[0].headers['Idempotency-Key'],
    `n7-enquiry-${validEnquiryId}`
  );
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
  webhookStatusesToReturn = [503, 200];
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
  assert.strictEqual(
    dispatchedWebhooks.length,
    3,
    'Should have attempted 1 transient 503 + 1 successful retry'
  );

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
  console.log(
    'API_SECURITY_TESTS: PASS (/api/appointments server-side verification, idempotency, retry, and distributed rate-limit tests passed).'
  );

  // 2. Check if Firebase Rules Emulator is required (in CI / emulators:exec) or reachable
  const requireEmulator =
    process.env.REQUIRE_FIREBASE_EMULATOR === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
    Boolean(process.env.FIREBASE_EMULATOR_HUB);

  const emulatorRunning = await isFirebaseEmulatorRunning();

  if (!emulatorRunning) {
    if (requireEmulator) {
      console.error(
        'FIREBASE_RULES_EMULATOR_TESTS: FAIL — Required Firebase Firestore/Storage Emulator is not reachable.'
      );
      process.exit(1);
    }
    console.log(
      'FIREBASE_RULES_EMULATOR_TESTS: NOT_RUN (Local Firestore/Storage Emulator is not active because Java JVM is not installed in this container. In GitHub Actions or any environment with Java 21, run `npx firebase-tools emulators:exec --only firestore,storage "npm run test:rules"`).'
    );
    return;
  }

  await runRealFirebaseEmulatorRulesTests();
  console.log(
    'FIREBASE_RULES_EMULATOR_TESTS: PASS (Real Firebase Security Rules Emulator tests for firestore.rules & storage.rules passed).'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
