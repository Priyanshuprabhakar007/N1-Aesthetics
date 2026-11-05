/**
 * Adversarial Security Test Specification for N7 Aesthetics Firestore Rules
 * Verifies all 12 "Dirty Dozen" payloads from security_spec.md return PERMISSION_DENIED.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
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
    payload: { uid: 'user_123', email: 'attacker@example.com', role: 'admin', createdAt: 'SERVER_TIME' },
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
    payload: { status: 'contacted', isSuperVerified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized Denial-of-Wallet Document ID',
    collectionPath: `/appointment_enquiries/${'a'.repeat(160)}`,
    operation: 'create',
    auth: null,
    payload: { name: 'Valid Name', phone: '+1234567890' },
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
    payload: { consentVerified: false, published: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client-Spoofed Timestamp on Enquiry Creation',
    collectionPath: '/appointment_enquiries/enq_2',
    operation: 'create',
    auth: null,
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable createdAt Tampering on Enquiry Update',
    collectionPath: '/appointment_enquiries/enq_1',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { createdAt: '2025-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Author UID Spoofing on Treatment Update',
    collectionPath: '/treatments/rhinoplasty',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { authorUid: 'other_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Treatment Summary (>600 chars)',
    collectionPath: '/treatments/rhinoplasty',
    operation: 'update',
    auth: { uid: 'admin_1', email: 'dilseinvite@gmail.com', email_verified: true },
    payload: { summary: 'x'.repeat(1000) },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unconsented Public Enquiry Creation (privacyConsent: false)',
    collectionPath: '/appointment_enquiries/enq_3',
    operation: 'create',
    auth: null,
    payload: { privacyConsent: false },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
