import { siteContent, type TreatmentItem } from '../content/site';

export interface BookingFormState {
  name: string;
  phone: string;
  email: string;
  treatment: string;
  preferredDate: string;
  message: string;
  privacyConsent: boolean;
  /** Honeypot field: must remain empty */
  website_url: string;
}

export interface BookingFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  treatment?: string;
  preferredDate?: string;
  message?: string;
  privacyConsent?: string;
}

export interface BookingServerResponse {
  status: 'idle' | 'demo_mode' | 'live_enquiry_logged' | 'throttled' | 'error';
  title: string;
  message: string;
}

export const DEMO_MODE_SUCCESS_TITLE = siteContent.bookingConfig.demoNoticeTitle;
export const DEMO_MODE_SUCCESS_MESSAGE =
  'Your consultation request passed validation. Live booking is not yet enabled. No enquiry has been sent or appointment booked.';

export const GENERAL_CONSULTATION_OPTION = {
  value: 'general-consultation',
  label: 'General Aesthetic Consultation',
} as const;

/**
 * Filters a treatment list to ONLY clinic-approved public treatments.
 * Draft treatments (`draft_pending_clinic_approval`) are strictly excluded.
 */
export function getPublicApprovedTreatments(
  treatments: readonly TreatmentItem[]
): TreatmentItem[] {
  return treatments.filter((t) => t.approvalStatus === 'approved_by_clinic');
}

/**
 * Builds the public booking dropdown options from approved treatments plus
 * the General Aesthetic Consultation fallback option.
 */
export function getPublicBookingOptions(
  treatments: readonly TreatmentItem[]
): Array<{ value: string; label: string }> {
  const approved = getPublicApprovedTreatments(treatments).map((t) => ({
    value: t.slug,
    label: t.title,
  }));
  return [...approved, { ...GENERAL_CONSULTATION_OPTION }];
}

/**
 * Resolves a preselected treatment slug so that only 'general-consultation'
 * or an approved treatment (`approvalStatus === 'approved_by_clinic'`) can be preselected.
 */
export function resolveInitialBookingTreatment(
  preselectedTreatment: string | undefined,
  treatments: readonly Pick<TreatmentItem, 'slug' | 'approvalStatus'>[]
): string {
  const trimmed = (preselectedTreatment || '').trim();
  if (!trimmed) return '';
  if (trimmed === GENERAL_CONSULTATION_OPTION.value) {
    return GENERAL_CONSULTATION_OPTION.value;
  }
  const isApproved = treatments.some(
    (t) => t.slug === trimmed && t.approvalStatus === 'approved_by_clinic'
  );
  return isApproved ? trimmed : '';
}

/**
 * Formats a Date object as YYYY-MM-DD in the visitor's local timezone (avoids UTC drift).
 */
export function getLocalTodayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates a YYYY-MM-DD date string using local calendar components,
 * rejecting empty dates, invalid calendar dates (e.g. 2026-02-30), and past dates.
 */
export function validatePreferredDate(
  dateStr: string,
  now: Date = new Date()
): { valid: boolean; error?: string } {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please select a preferred consultation date.' };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return { valid: false, error: 'Please enter a valid consultation date (YYYY-MM-DD).' };
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: 'Please enter a valid calendar date.' };
  }

  const candidateLocal = new Date(year, month - 1, day);
  if (
    Number.isNaN(candidateLocal.getTime()) ||
    candidateLocal.getFullYear() !== year ||
    candidateLocal.getMonth() !== month - 1 ||
    candidateLocal.getDate() !== day
  ) {
    return { valid: false, error: 'Please enter a valid calendar date.' };
  }

  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidateLocal.getTime() < todayLocal.getTime()) {
    return { valid: false, error: 'Preferred consultation date cannot be in the past.' };
  }

  return { valid: true };
}

/**
 * Validates domestic and international phone formats (7 to 15 digits, optional leading +,
 * spaces, hyphens, parentheses, or dots).
 */
export function validatePhoneFormat(phoneStr: string): boolean {
  const trimmed = phoneStr.trim();
  if (!trimmed || trimmed.length > 30) return false;
  if (!/^\+?[0-9()\-.\s]+$/.test(trimmed)) return false;
  const digitsAndPlus = trimmed.replace(/[\s().-]/g, '');
  return /^\+?[0-9]{7,15}$/.test(digitsAndPlus);
}

/**
 * Normalizes a validated phone string so it satisfies Firestore schema rules (`^[0-9+()\- \s]{7,30}$`).
 */
export function normalizePhoneForSubmission(phoneStr: string): string {
  return phoneStr.trim().replace(/\./g, ' ').replace(/\s+/g, ' ').slice(0, 30);
}

/**
 * Pure validation function for the consultation form.
 */
export function validateBookingForm(
  form: BookingFormState,
  approvedTreatments?: readonly Pick<TreatmentItem, 'slug' | 'approvalStatus'>[],
  now: Date = new Date()
): BookingFormErrors {
  const nextErrors: BookingFormErrors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    nextErrors.name = 'Please enter your full name (at least 2 characters).';
  } else if (form.name.trim().length > 120) {
    nextErrors.name = 'Full name must be 120 characters or fewer.';
  }

  if (!validatePhoneFormat(form.phone)) {
    nextErrors.phone =
      'Please enter a valid contact phone number (7 to 15 digits, international formats supported).';
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    nextErrors.email = 'Please enter a valid email address or leave this optional field blank.';
  }

  const trimmedTreatment = form.treatment.trim();
  if (!trimmedTreatment) {
    nextErrors.treatment = 'Please select a procedure or consultation area.';
  } else if (approvedTreatments) {
    const isAllowed =
      trimmedTreatment === GENERAL_CONSULTATION_OPTION.value ||
      approvedTreatments.some(
        (t) => t.slug === trimmedTreatment && t.approvalStatus === 'approved_by_clinic'
      );
    if (!isAllowed) {
      nextErrors.treatment = 'Please select an approved procedure or General Aesthetic Consultation.';
    }
  }

  const dateValidation = validatePreferredDate(form.preferredDate, now);
  if (!dateValidation.valid) {
    nextErrors.preferredDate = dateValidation.error;
  }

  if (form.message.trim().length > 500) {
    nextErrors.message =
      'Please keep your note concise (under 500 characters) and omit medical history.';
  }

  if (!form.privacyConsent) {
    nextErrors.privacyConsent =
      'Please confirm privacy consent to proceed with your consultation enquiry.';
  }

  return nextErrors;
}

export interface ProcessBookingSubmissionParams {
  form: BookingFormState;
  bookingLiveMode: boolean;
  approvedTreatments: readonly Pick<TreatmentItem, 'slug' | 'approvalStatus'>[];
  submitEnquiryToCms: (payload: {
    name: string;
    phone: string;
    email?: string;
    treatment: string;
    preferredDate: string;
    message?: string;
    privacyConsent: boolean;
  }) => Promise<string>;
  fetchImpl?: typeof fetch;
  endpoint?: string;
  now?: Date;
}

export interface ProcessBookingSubmissionResult {
  ok: boolean;
  validationErrors: BookingFormErrors;
  serverResponse: BookingServerResponse;
}

/**
 * Handles both Demo Mode (local validation only — zero API or Firestore calls)
 * and Live Booking Mode (secured Firestore write followed by optional /api/appointments notification).
 */
export async function processBookingSubmission({
  form,
  bookingLiveMode,
  approvedTreatments,
  submitEnquiryToCms,
  fetchImpl = typeof fetch !== 'undefined' ? fetch : undefined,
  endpoint = siteContent.bookingConfig.endpoint,
  now = new Date(),
}: ProcessBookingSubmissionParams): Promise<ProcessBookingSubmissionResult> {
  const validationErrors = validateBookingForm(form, approvedTreatments, now);
  if (Object.keys(validationErrors).length > 0) {
    return {
      ok: false,
      validationErrors,
      serverResponse: { status: 'idle', title: '', message: '' },
    };
  }

  // Honeypot check: silently return Demo Mode notice without network or DB writes
  if (form.website_url.trim().length > 0) {
    return {
      ok: true,
      validationErrors: {},
      serverResponse: {
        status: 'demo_mode',
        title: DEMO_MODE_SUCCESS_TITLE,
        message: DEMO_MODE_SUCCESS_MESSAGE,
      },
    };
  }

  // DEMO MODE: Validate locally only. Do NOT call /api/appointments and do NOT write to Firestore.
  if (!bookingLiveMode) {
    return {
      ok: true,
      validationErrors: {},
      serverResponse: {
        status: 'demo_mode',
        title: DEMO_MODE_SUCCESS_TITLE,
        message: DEMO_MODE_SUCCESS_MESSAGE,
      },
    };
  }

  // LIVE BOOKING MODE:
  // Step 1: Save live enquiry to Firebase Firestore (source of truth).
  const normalizedPhone = normalizePhoneForSubmission(form.phone);
  let createdEnquiryId = '';
  try {
    createdEnquiryId = await submitEnquiryToCms({
      name: form.name.trim(),
      phone: normalizedPhone,
      email: form.email.trim() || undefined,
      treatment: form.treatment.trim(),
      preferredDate: form.preferredDate.trim(),
      message: form.message.trim() || undefined,
      privacyConsent: form.privacyConsent,
    });
  } catch {
    return {
      ok: false,
      validationErrors: {},
      serverResponse: {
        status: 'error',
        title: 'Unable to Save Consultation Enquiry',
        message:
          'Your consultation enquiry could not be saved to the clinic database at this time. No enquiry or appointment has been recorded. Please check your connection and try again.',
      },
    };
  }

  // Step 2: Trigger optional server-side notification via /api/appointments with the created enquiryId.
  if (!fetchImpl) {
    return {
      ok: true,
      validationErrors: {},
      serverResponse: {
        status: 'live_enquiry_logged',
        title: 'Enquiry Saved — Automated Staff Notification Pending',
        message:
          'Your consultation enquiry was saved in the /admin queue for coordinator review, but the optional staff notification service was unreachable. Please note this is an initial enquiry and not a confirmed calendar appointment until the clinic contacts you.',
      },
    };
  }

  const requestBody = {
    enquiryId: createdEnquiryId,
    name: form.name.trim(),
    phone: normalizedPhone,
    email: form.email.trim() || undefined,
    treatment: form.treatment.trim(),
    preferredDate: form.preferredDate.trim(),
    message: form.message.trim() || undefined,
    privacyConsent: form.privacyConsent,
    website_url: form.website_url,
    liveMode: true,
  };

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.ok && data?.notificationStatus === 'sent') {
      return {
        ok: true,
        validationErrors: {},
        serverResponse: {
          status: 'live_enquiry_logged',
          title: 'Enquiry Saved for Clinic Coordinator Review',
          message:
            'Your consultation enquiry has been saved in the /admin queue and staff notification was dispatched. Please note this is an initial enquiry and not a confirmed calendar appointment until the clinic contacts you.',
        },
      };
    }

    if (response.ok && data?.ok && data?.notificationStatus === 'configuration_pending') {
      return {
        ok: true,
        validationErrors: {},
        serverResponse: {
          status: 'live_enquiry_logged',
          title: 'Enquiry Saved for Clinic Coordinator Review',
          message:
            'Your consultation enquiry has been saved in the /admin queue for coordinator review (optional automated staff webhook notification is not yet configured). Please note this is an initial enquiry and not a confirmed calendar appointment until the clinic contacts you.',
        },
      };
    }

    return {
      ok: true,
      validationErrors: {},
      serverResponse: {
        status: 'live_enquiry_logged',
        title: 'Enquiry Saved — Automated Staff Notification Pending',
        message:
          'Your consultation enquiry was saved in the /admin queue for coordinator review, but automated staff webhook notification could not be completed. Please note this is an initial enquiry and not a confirmed calendar appointment until the clinic contacts you.',
      },
    };
  } catch {
    return {
      ok: true,
      validationErrors: {},
      serverResponse: {
        status: 'live_enquiry_logged',
        title: 'Enquiry Saved — Automated Staff Notification Pending',
        message:
          'Your consultation enquiry was saved in the /admin queue for coordinator review, but the optional staff notification service was unreachable. Please note this is an initial enquiry and not a confirmed calendar appointment until the clinic contacts you.',
      },
    };
  }
}
