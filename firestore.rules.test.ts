import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import handler, { resetAppointmentAbuseCachesForTest } from './api/appointments';

/**
 * Adversarial & Role-Based Security Test Suite for N7 Aesthetics
 * Evaluates Firestore rules, Storage rules, Query compatibility, and /api/appointments abuse prevention.
 */

export interface AuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

export interface MockDatabaseState {
  staff_roles: Record<string, { uid: string; email: string; role: string; createdAt: string }>;
  appointment_enquiries: Record<string, Record<string, any>>;
  treatments: Record<string, Record<string, any>>;
  testimonials: Record<string, Record<string, any>>;
  clinical_results: Record<string, Record<string, any>>;
  blog_posts: Record<string, Record<string, any>>;
  site_settings: Record<string, Record<string, any>>;
}

export interface AdversarialTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: AuthContext | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
}

const SERVER_TIME = '2026-11-04T19:00:00Z';

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isSignedIn(auth: AuthContext | null): boolean {
  return auth !== null && auth.email_verified === true;
}

function isBootstrappedAdmin(auth: AuthContext | null): boolean {
  return isSignedIn(auth) && auth!.email === 'dilseinvite@gmail.com';
}

function isAdmin(auth: AuthContext | null, db: MockDatabaseState): boolean {
  if (isBootstrappedAdmin(auth)) return true;
  if (!isSignedIn(auth)) return false;
  const roleDoc = db.staff_roles[auth!.uid];
  return Boolean(roleDoc && roleDoc.role === 'admin');
}

function isStaff(auth: AuthContext | null, db: MockDatabaseState): boolean {
  if (isBootstrappedAdmin(auth)) return true;
  if (!isSignedIn(auth)) return false;
  const roleDoc = db.staff_roles[auth!.uid];
  return Boolean(roleDoc && (roleDoc.role === 'admin' || roleDoc.role === 'editor'));
}

function hasAllKeys(data: Record<string, any>, keys: string[]): boolean {
  return keys.every((k) => Object.prototype.hasOwnProperty.call(data, k));
}

function hasOnlyKeys(data: Record<string, any>, keys: string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(data).every((k) => allowed.has(k));
}

function affectedKeysOnly(
  incoming: Record<string, any>,
  existing: Record<string, any>,
  allowedChangedKeys: string[]
): boolean {
  const allKeys = new Set([...Object.keys(incoming), ...Object.keys(existing)]);
  const changed: string[] = [];
  for (const k of allKeys) {
    if (incoming[k] !== existing[k]) {
      changed.push(k);
    }
  }
  const allowed = new Set(allowedChangedKeys);
  return changed.every((k) => allowed.has(k));
}

function isValidStaffRole(data: Record<string, any>): boolean {
  return (
    hasAllKeys(data, ['uid', 'email', 'role', 'createdAt']) &&
    hasOnlyKeys(data, ['uid', 'email', 'role', 'createdAt']) &&
    typeof data.uid === 'string' &&
    data.uid.length >= 1 &&
    data.uid.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(data.uid) &&
    typeof data.email === 'string' &&
    data.email.length >= 3 &&
    data.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    typeof data.role === 'string' &&
    ['admin', 'editor'].includes(data.role) &&
    data.createdAt === SERVER_TIME
  );
}

function isValidAppointmentEnquiry(data: Record<string, any>): boolean {
  return (
    hasAllKeys(data, [
      'name',
      'phone',
      'treatment',
      'preferredDate',
      'privacyConsent',
      'status',
      'assignedTo',
      'createdAt',
      'updatedAt',
    ]) &&
    hasOnlyKeys(data, [
      'name',
      'phone',
      'email',
      'treatment',
      'preferredDate',
      'message',
      'privacyConsent',
      'status',
      'assignedTo',
      'createdAt',
      'updatedAt',
    ]) &&
    typeof data.name === 'string' &&
    data.name.length >= 2 &&
    data.name.length <= 120 &&
    typeof data.phone === 'string' &&
    data.phone.length >= 7 &&
    data.phone.length <= 30 &&
    /^[0-9+()\- \s]{7,30}$/.test(data.phone) &&
    (!('email' in data) ||
      (typeof data.email === 'string' &&
        data.email.length >= 3 &&
        data.email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) &&
    typeof data.treatment === 'string' &&
    data.treatment.length >= 2 &&
    data.treatment.length <= 120 &&
    typeof data.preferredDate === 'string' &&
    data.preferredDate.length >= 8 &&
    data.preferredDate.length <= 20 &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.preferredDate) &&
    (!('message' in data) || (typeof data.message === 'string' && data.message.length <= 500)) &&
    typeof data.privacyConsent === 'boolean' &&
    data.privacyConsent === true &&
    typeof data.status === 'string' &&
    ['new', 'contacted', 'scheduled', 'archived'].includes(data.status) &&
    typeof data.assignedTo === 'string' &&
    data.assignedTo.length >= 1 &&
    data.assignedTo.length <= 120 &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  );
}

function isValidTreatmentDoc(data: Record<string, any>, auth: AuthContext | null): boolean {
  return (
    auth !== null &&
    hasAllKeys(data, [
      'slug',
      'title',
      'shortTitle',
      'category',
      'summary',
      'overview',
      'cardImage',
      'approvalStatus',
      'isSignature',
      'authorUid',
      'updatedAt',
    ]) &&
    hasOnlyKeys(data, [
      'slug',
      'title',
      'shortTitle',
      'category',
      'summary',
      'overview',
      'cardImage',
      'approvalStatus',
      'isSignature',
      'authorUid',
      'updatedAt',
    ]) &&
    typeof data.slug === 'string' &&
    data.slug.length >= 2 &&
    data.slug.length <= 100 &&
    /^[a-z0-9-]+$/.test(data.slug) &&
    typeof data.title === 'string' &&
    data.title.length >= 2 &&
    data.title.length <= 140 &&
    typeof data.shortTitle === 'string' &&
    data.shortTitle.length >= 2 &&
    data.shortTitle.length <= 80 &&
    typeof data.category === 'string' &&
    data.category.length >= 2 &&
    data.category.length <= 80 &&
    typeof data.summary === 'string' &&
    data.summary.length >= 2 &&
    data.summary.length <= 600 &&
    typeof data.overview === 'string' &&
    data.overview.length >= 2 &&
    data.overview.length <= 2500 &&
    typeof data.cardImage === 'string' &&
    data.cardImage.length >= 1 &&
    data.cardImage.length <= 1000 &&
    typeof data.approvalStatus === 'string' &&
    ['draft_pending_clinic_approval', 'approved_by_clinic'].includes(data.approvalStatus) &&
    typeof data.isSignature === 'boolean' &&
    typeof data.authorUid === 'string' &&
    data.authorUid.length >= 1 &&
    data.authorUid.length <= 128 &&
    data.authorUid === auth.uid &&
    typeof data.updatedAt === 'string'
  );
}

function isValidTestimonialDoc(data: Record<string, any>, auth: AuthContext | null): boolean {
  return (
    auth !== null &&
    hasAllKeys(data, [
      'patientIdentifier',
      'procedureContext',
      'quote',
      'consentVerified',
      'published',
      'authorUid',
      'updatedAt',
    ]) &&
    hasOnlyKeys(data, [
      'patientIdentifier',
      'procedureContext',
      'quote',
      'consentVerified',
      'published',
      'authorUid',
      'updatedAt',
    ]) &&
    typeof data.patientIdentifier === 'string' &&
    data.patientIdentifier.length >= 2 &&
    data.patientIdentifier.length <= 100 &&
    typeof data.procedureContext === 'string' &&
    data.procedureContext.length <= 120 &&
    typeof data.quote === 'string' &&
    data.quote.length >= 10 &&
    data.quote.length <= 1200 &&
    typeof data.consentVerified === 'boolean' &&
    typeof data.published === 'boolean' &&
    (!data.published || data.consentVerified === true) &&
    typeof data.authorUid === 'string' &&
    data.authorUid === auth.uid &&
    typeof data.updatedAt === 'string'
  );
}

function isValidClinicalResultDoc(data: Record<string, any>, auth: AuthContext | null): boolean {
  return (
    auth !== null &&
    hasAllKeys(data, [
      'treatmentSlug',
      'treatmentTitle',
      'beforeImage',
      'afterImage',
      'clinicalNotes',
      'consentReference',
      'consentVerified',
      'published',
      'authorUid',
      'updatedAt',
    ]) &&
    hasOnlyKeys(data, [
      'treatmentSlug',
      'treatmentTitle',
      'beforeImage',
      'afterImage',
      'clinicalNotes',
      'consentReference',
      'consentVerified',
      'published',
      'authorUid',
      'updatedAt',
    ]) &&
    typeof data.treatmentSlug === 'string' &&
    data.treatmentSlug.length >= 2 &&
    data.treatmentSlug.length <= 100 &&
    /^[a-z0-9-]+$/.test(data.treatmentSlug) &&
    typeof data.treatmentTitle === 'string' &&
    data.treatmentTitle.length >= 2 &&
    data.treatmentTitle.length <= 140 &&
    typeof data.beforeImage === 'string' &&
    data.beforeImage.length >= 1 &&
    data.beforeImage.length <= 1000 &&
    typeof data.afterImage === 'string' &&
    data.afterImage.length >= 1 &&
    data.afterImage.length <= 1000 &&
    typeof data.clinicalNotes === 'string' &&
    data.clinicalNotes.length <= 1000 &&
    typeof data.consentReference === 'string' &&
    data.consentReference.length >= 2 &&
    data.consentReference.length <= 160 &&
    typeof data.consentVerified === 'boolean' &&
    typeof data.published === 'boolean' &&
    (!data.published || data.consentVerified === true) &&
    typeof data.authorUid === 'string' &&
    data.authorUid === auth.uid &&
    typeof data.updatedAt === 'string'
  );
}

export function evaluateFirestoreRule(
  db: MockDatabaseState,
  collectionPath: string,
  operation: 'get' | 'list' | 'create' | 'update' | 'delete',
  auth: AuthContext | null,
  payload?: Record<string, any>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  const parts = collectionPath.replace(/^\//, '').split('/');
  const col = parts[0];
  const docId = parts[1] || '';

  if (col === 'staff_roles') {
    if (operation === 'get') {
      return isValidId(docId) && (isAdmin(auth, db) || (isSignedIn(auth) && auth!.uid === docId))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'list') {
      return isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      return isValidId(docId) &&
        payload &&
        isValidStaffRole(payload) &&
        isAdmin(auth, db) &&
        payload.uid === docId &&
        payload.createdAt === SERVER_TIME
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'update') {
      const existing = db.staff_roles[docId];
      if (!existing || !payload) return 'PERMISSION_DENIED';
      const merged = { ...existing, ...payload };
      return isValidId(docId) &&
        isValidStaffRole(merged) &&
        isAdmin(auth, db) &&
        merged.uid === existing.uid &&
        merged.createdAt === existing.createdAt &&
        affectedKeysOnly(merged, existing, ['role', 'email'])
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (col === 'appointment_enquiries') {
    if (operation === 'get' || operation === 'list') {
      return (operation === 'list' || isValidId(docId)) && isStaff(auth, db)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      return isValidId(docId) &&
        payload &&
        isValidAppointmentEnquiry(payload) &&
        payload.status === 'new' &&
        payload.assignedTo === 'unassigned' &&
        payload.createdAt === SERVER_TIME &&
        payload.updatedAt === SERVER_TIME
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'update') {
      const existing = db.appointment_enquiries[docId];
      if (!existing || !payload) return 'PERMISSION_DENIED';
      const merged = { ...existing, ...payload };
      return isValidId(docId) &&
        isValidAppointmentEnquiry(merged) &&
        isStaff(auth, db) &&
        merged.createdAt === existing.createdAt &&
        merged.name === existing.name &&
        merged.phone === existing.phone &&
        merged.treatment === existing.treatment &&
        merged.preferredDate === existing.preferredDate &&
        merged.privacyConsent === existing.privacyConsent &&
        merged.updatedAt === SERVER_TIME &&
        affectedKeysOnly(merged, existing, ['status', 'assignedTo', 'updatedAt'])
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (col === 'treatments') {
    if (operation === 'get') {
      const existing = db.treatments[docId];
      return isValidId(docId) &&
        ((existing &&
          ['draft_pending_clinic_approval', 'approved_by_clinic'].includes(
            existing.approvalStatus
          )) ||
          isStaff(auth, db))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'list') {
      return 'ALLOWED';
    }
    if (operation === 'create') {
      return isValidId(docId) &&
        isSignedIn(auth) &&
        payload &&
        isValidTreatmentDoc(payload, auth) &&
        isStaff(auth, db) &&
        payload.slug === docId &&
        payload.updatedAt === SERVER_TIME
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'update') {
      const existing = db.treatments[docId];
      if (!existing || !payload) return 'PERMISSION_DENIED';
      const merged = { ...existing, ...payload };
      return isValidId(docId) &&
        isSignedIn(auth) &&
        isValidTreatmentDoc(merged, auth) &&
        isStaff(auth, db) &&
        merged.slug === existing.slug &&
        merged.updatedAt === SERVER_TIME &&
        affectedKeysOnly(merged, existing, [
          'title',
          'shortTitle',
          'category',
          'summary',
          'overview',
          'cardImage',
          'approvalStatus',
          'isSignature',
          'authorUid',
          'updatedAt',
        ])
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (col === 'testimonials') {
    if (operation === 'get') {
      const existing = db.testimonials[docId];
      return isValidId(docId) &&
        ((existing && existing.published === true && existing.consentVerified === true) ||
          isStaff(auth, db))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      return isValidId(docId) &&
        isSignedIn(auth) &&
        payload &&
        isValidTestimonialDoc(payload, auth) &&
        isStaff(auth, db) &&
        payload.updatedAt === SERVER_TIME
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (col === 'clinical_results') {
    if (operation === 'get') {
      const existing = db.clinical_results[docId];
      return isValidId(docId) &&
        ((existing && existing.published === true && existing.consentVerified === true) ||
          isStaff(auth, db))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      return isValidId(docId) &&
        isSignedIn(auth) &&
        payload &&
        isValidClinicalResultDoc(payload, auth) &&
        isStaff(auth, db) &&
        payload.updatedAt === SERVER_TIME
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (col === 'site_settings') {
    if (operation === 'get') {
      return isValidId(docId) && (docId === 'main' || isStaff(auth, db))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (operation === 'list') {
      return isStaff(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (operation === 'delete') {
      return isValidId(docId) && isAdmin(auth, db) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}

export const dirtyDozenTestSuite: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Unverified Admin Email Spoof on Enquiries',
    collectionPath: '/appointment_enquiries/enq_1',
    operation: 'get',
    auth: { uid: 'spoof_1', email: 'dilseinvite@gmail.com', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Role Escalation',
    collectionPath: '/staff_roles/user_123',
    operation: 'create',
    auth: { uid: 'user_123', email: 'attacker@example.com', email_verified: true },
    payload: {
      uid: 'user_123',
      email: 'attacker@example.com',
      role: 'admin',
      createdAt: SERVER_TIME,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'PII Scraping on Appointment Enquiries by Non-Staff',
    collectionPath: '/appointment_enquiries',
    operation: 'list',
    auth: { uid: 'regular_user', email: 'patient@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Ghost Field Shadow Update on Enquiries',
    collectionPath: '/appointment_enquiries/enq_1',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { status: 'contacted', isSuperVerified: true, updatedAt: SERVER_TIME },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized Denial-of-Wallet Document ID',
    collectionPath: `/appointment_enquiries/${'a'.repeat(160)}`,
    operation: 'create',
    auth: null,
    payload: {
      name: 'Valid Name',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-01',
      privacyConsent: true,
      status: 'new',
      assignedTo: 'unassigned',
      createdAt: SERVER_TIME,
      updatedAt: SERVER_TIME,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unconsented Public Testimonial Read',
    collectionPath: '/testimonials/test_unconsented',
    operation: 'get',
    auth: null,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unconsented Clinical Result Published Creation',
    collectionPath: '/clinical_results/res_1',
    operation: 'create',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: {
      treatmentSlug: 'rhinoplasty',
      treatmentTitle: 'Rhinoplasty',
      beforeImage: '/media/treatment-rhinoplasty.svg',
      afterImage: '/media/treatment-rhinoplasty.svg',
      clinicalNotes: '6 months post-op',
      consentReference: 'CONSENT-2026-01',
      consentVerified: false,
      published: true,
      authorUid: 'admin_1',
      updatedAt: SERVER_TIME,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client-Spoofed Timestamp on Enquiry Creation',
    collectionPath: '/appointment_enquiries/enq_2',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-01',
      privacyConsent: true,
      status: 'new',
      assignedTo: 'unassigned',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: SERVER_TIME,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable createdAt Tampering on Enquiry Update',
    collectionPath: '/appointment_enquiries/enq_1',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { status: 'contacted', createdAt: '2025-01-01T00:00:00Z', updatedAt: SERVER_TIME },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Author UID Spoofing on Treatment Update',
    collectionPath: '/treatments/rhinoplasty',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { authorUid: 'other_uid', updatedAt: SERVER_TIME },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Treatment Summary (>600 chars)',
    collectionPath: '/treatments/rhinoplasty',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { summary: 'x'.repeat(1000), authorUid: 'admin_1', updatedAt: SERVER_TIME },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unconsented Public Enquiry Creation (privacyConsent: false)',
    collectionPath: '/appointment_enquiries/enq_3',
    operation: 'create',
    auth: null,
    payload: {
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-01',
      privacyConsent: false,
      status: 'new',
      assignedTo: 'unassigned',
      createdAt: SERVER_TIME,
      updatedAt: SERVER_TIME,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];

async function runFullSecurityTestSuite() {
  const mockDb: MockDatabaseState = {
    staff_roles: {
      editor_1: {
        uid: 'editor_1',
        email: 'editor@n7aesthetics.example',
        role: 'editor',
        createdAt: SERVER_TIME,
      },
      staff_admin_2: {
        uid: 'staff_admin_2',
        email: 'director@n7aesthetics.example',
        role: 'admin',
        createdAt: SERVER_TIME,
      },
    },
    appointment_enquiries: {
      enq_1: {
        name: 'Patient One',
        phone: '+919876543210',
        treatment: 'rhinoplasty',
        preferredDate: '2026-12-10',
        privacyConsent: true,
        status: 'new',
        assignedTo: 'unassigned',
        createdAt: SERVER_TIME,
        updatedAt: SERVER_TIME,
      },
    },
    treatments: {
      rhinoplasty: {
        slug: 'rhinoplasty',
        title: 'Rhinoplasty',
        shortTitle: 'Rhinoplasty',
        category: 'Facial Aesthetics',
        summary: 'Structural and aesthetic nasal refinement.',
        overview: 'Comprehensive evaluation of nasal harmony and airway function.',
        cardImage: '/media/treatment-rhinoplasty.svg',
        approvalStatus: 'draft_pending_clinic_approval',
        isSignature: true,
        authorUid: 'admin_1',
        updatedAt: SERVER_TIME,
      },
    },
    testimonials: {
      test_unconsented: {
        patientIdentifier: 'P. K.',
        procedureContext: 'Rhinoplasty',
        quote: 'Unpublished draft reflection awaiting consent sign-off.',
        consentVerified: false,
        published: false,
        authorUid: 'admin_1',
        updatedAt: SERVER_TIME,
      },
      test_consented: {
        patientIdentifier: 'A. S.',
        procedureContext: 'Rhinoplasty',
        quote: 'Thoughtful consultation and natural outcome.',
        consentVerified: true,
        published: true,
        authorUid: 'admin_1',
        updatedAt: SERVER_TIME,
      },
    },
    clinical_results: {
      res_unconsented: {
        treatmentSlug: 'rhinoplasty',
        treatmentTitle: 'Rhinoplasty',
        beforeImage: '/media/treatment-rhinoplasty.svg',
        afterImage: '/media/treatment-rhinoplasty.svg',
        clinicalNotes: 'Pending consent',
        consentReference: 'PENDING',
        consentVerified: false,
        published: false,
        authorUid: 'admin_1',
        updatedAt: SERVER_TIME,
      },
      res_consented: {
        treatmentSlug: 'rhinoplasty',
        treatmentTitle: 'Rhinoplasty',
        beforeImage: '/media/treatment-rhinoplasty.svg',
        afterImage: '/media/treatment-rhinoplasty.svg',
        clinicalNotes: '6 months post-op',
        consentReference: 'CONSENT-2026-001',
        consentVerified: true,
        published: true,
        authorUid: 'admin_1',
        updatedAt: SERVER_TIME,
      },
    },
    blog_posts: {},
    site_settings: {
      main: {
        doctorName: 'Dr. Navjot Singh',
        bookingLiveMode: false,
      },
    },
  };

  // 1. Verify all 12 Dirty Dozen adversarial payloads
  for (const tc of dirtyDozenTestSuite) {
    const actual = evaluateFirestoreRule(
      mockDb,
      tc.collectionPath,
      tc.operation,
      tc.auth,
      tc.payload
    );
    assert.strictEqual(
      actual,
      tc.expectedOutcome,
      `Dirty Dozen #${tc.id} (${tc.name}) expected ${tc.expectedOutcome} but got ${actual}`
    );
  }

  // 2. Role Matrix Tests (Unauthenticated, Unauthorized, Editor, Admin)
  const unauth: AuthContext | null = null;
  const unauthorizedUser: AuthContext = {
    uid: 'random_user',
    email: 'visitor@example.com',
    email_verified: true,
  };
  const editorUser: AuthContext = {
    uid: 'editor_1',
    email: 'editor@n7aesthetics.example',
    email_verified: true,
  };
  const adminUser: AuthContext = {
    uid: 'admin_1',
    email: 'dilseinvite@gmail.com',
    email_verified: true,
  };

  // Unauthenticated can create valid enquiry with privacyConsent: true
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_valid', 'create', unauth, {
      name: 'Valid Patient',
      phone: '+91 98765 43210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      status: 'new',
      assignedTo: 'unassigned',
      createdAt: SERVER_TIME,
      updatedAt: SERVER_TIME,
    }),
    'ALLOWED'
  );

  // Unauthenticated cannot read enquiries
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_1', 'get', unauth),
    'PERMISSION_DENIED'
  );

  // Public can read consented & published testimonial/result, but not unconsented
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/testimonials/test_consented', 'get', unauth),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/clinical_results/res_consented', 'get', unauth),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/clinical_results/res_unconsented', 'get', unauth),
    'PERMISSION_DENIED'
  );

  // Unauthorized signed-in user can read own /staff_roles/{uid} but cannot read others or list
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/staff_roles/random_user', 'get', unauthorizedUser),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/staff_roles/editor_1', 'get', unauthorizedUser),
    'PERMISSION_DENIED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/staff_roles', 'list', unauthorizedUser),
    'PERMISSION_DENIED'
  );

  // Editor can read & update enquiry status/assignedTo, but CANNOT delete enquiry or manage staff_roles
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_1', 'get', editorUser),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_1', 'update', editorUser, {
      status: 'contacted',
      assignedTo: 'Coordinator Priya',
      updatedAt: SERVER_TIME,
    }),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_1', 'delete', editorUser),
    'PERMISSION_DENIED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/treatments/rhinoplasty', 'delete', editorUser),
    'PERMISSION_DENIED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/staff_roles/new_staff', 'create', editorUser, {
      uid: 'new_staff',
      email: 'new@n7aesthetics.example',
      role: 'editor',
      createdAt: SERVER_TIME,
    }),
    'PERMISSION_DENIED'
  );

  // Admin can manage staff_roles and delete enquiries/treatments
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/staff_roles/new_staff', 'create', adminUser, {
      uid: 'new_staff',
      email: 'new@n7aesthetics.example',
      role: 'editor',
      createdAt: SERVER_TIME,
    }),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/appointment_enquiries/enq_1', 'delete', adminUser),
    'ALLOWED'
  );
  assert.strictEqual(
    evaluateFirestoreRule(mockDb, '/treatments/rhinoplasty', 'delete', adminUser),
    'ALLOWED'
  );

  // 3. Static verification of firestore.rules and storage.rules files on disk
  const firestoreRulesContent = fs.readFileSync(
    path.join(process.cwd(), 'firestore.rules'),
    'utf8'
  );
  const storageRulesContent = fs.readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf8');

  assert.ok(
    firestoreRulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'),
    'firestore.rules must include default-deny catch-all'
  );
  assert.ok(
    storageRulesContent.includes('match /{allPaths=**} {\n      allow read, write: if false;\n    }'),
    'storage.rules must include default-deny catch-all'
  );
  assert.ok(
    storageRulesContent.includes("request.resource.size <= 5 * 1024 * 1024"),
    'storage.rules must enforce 5MB file size limit'
  );
  assert.ok(
    storageRulesContent.includes('match /n7_media/clinical_results_private/{filename}'),
    'storage.rules must isolate unconsented clinical results'
  );

  // 4. Test /api/appointments booking security (liveMode spoofing, enquiryId validation, origin, rate limit)
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

  // 4a. Reject liveMode: true when enquiryId is missing (prevents client liveMode spoofing)
  const rNoEnquiryId = await invokeApi(
    {
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
  assert.strictEqual(rNoEnquiryId.statusCode, 400);
  assert.strictEqual(rNoEnquiryId.jsonBody.mode, 'unverified_enquiry_reference');

  // 4b. Reject liveMode: true when enquiryId timestamp is expired (>60s old)
  const expiredEnquiryId = `enq_${Date.now() - 120_000}_abc12345`;
  const rExpired = await invokeApi(
    {
      enquiryId: expiredEnquiryId,
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: true,
    },
    { 'content-type': 'application/json' },
    '10.0.0.11'
  );
  assert.strictEqual(rExpired.statusCode, 400);
  assert.strictEqual(rExpired.jsonBody.mode, 'unverified_enquiry_reference');

  // 4c. Reject duplicate replay of the same enquiryId
  process.env.NOTIFICATION_SKIP_FIRESTORE_CHECK = 'true';
  const freshEnquiryId = `enq_${Date.now()}_ replay01`.replace(/\s+/g, '');
  const rFirst = await invokeApi(
    {
      enquiryId: freshEnquiryId,
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
  assert.strictEqual(rFirst.statusCode, 200);
  assert.strictEqual(rFirst.jsonBody.mode, 'configuration_pending');

  const rReplay = await invokeApi(
    {
      enquiryId: freshEnquiryId,
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
  delete process.env.NOTIFICATION_SKIP_FIRESTORE_CHECK;

  // 4d. Reject cross-origin POST requests
  const rBadOrigin = await invokeApi(
    {
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: false,
    },
    {
      'content-type': 'application/json',
      origin: 'https://malicious-attacker.example',
      host: 'n7aesthetics.vercel.app',
    },
    '10.0.0.13'
  );
  assert.strictEqual(rBadOrigin.statusCode, 403);
  assert.strictEqual(rBadOrigin.jsonBody.mode, 'forbidden_origin');

  // 4e. Enforce rate limit after 3 requests within 60 seconds from the same IP
  resetAppointmentAbuseCachesForTest();
  for (let i = 0; i < 3; i++) {
    const rOk = await invokeApi(
      {
        name: 'Aarav Sharma',
        phone: '+919876543210',
        treatment: 'rhinoplasty',
        preferredDate: '2026-12-20',
        privacyConsent: true,
        liveMode: false,
      },
      { 'content-type': 'application/json' },
      '10.0.0.99'
    );
    assert.strictEqual(rOk.statusCode, 200);
  }
  const rThrottled = await invokeApi(
    {
      name: 'Aarav Sharma',
      phone: '+919876543210',
      treatment: 'rhinoplasty',
      preferredDate: '2026-12-20',
      privacyConsent: true,
      liveMode: false,
    },
    { 'content-type': 'application/json' },
    '10.0.0.99'
  );
  assert.strictEqual(rThrottled.statusCode, 429);
  assert.strictEqual(rThrottled.jsonBody.mode, 'throttled');

  resetAppointmentAbuseCachesForTest();
  console.log('ALL_SECURITY_RULES_AND_BOOKING_ABUSE_TESTS_PASSED');
}

runFullSecurityTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
