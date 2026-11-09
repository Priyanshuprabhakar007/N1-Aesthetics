import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import {
  type BookingFormState,
  type BookingFormErrors,
  type BookingServerResponse,
  DEMO_MODE_SUCCESS_TITLE,
  DEMO_MODE_SUCCESS_MESSAGE,
  LIVE_ENQUIRY_SUCCESS_TITLE,
  LIVE_ENQUIRY_SUCCESS_MESSAGE,
  GENERAL_CONSULTATION_OPTION,
  getPublicApprovedTreatments,
  getPublicBookingOptions,
  resolveInitialBookingTreatment,
  getLocalTodayDateString,
  validatePreferredDate,
  validatePhoneFormat,
  normalizePhoneForSubmission,
  validateBookingForm,
  processBookingSubmission,
} from '../lib/bookingValidation';
import styles from '../styles/luxury.module.css';

export {
  type BookingFormState,
  type BookingFormErrors,
  type BookingServerResponse,
  DEMO_MODE_SUCCESS_TITLE,
  DEMO_MODE_SUCCESS_MESSAGE,
  LIVE_ENQUIRY_SUCCESS_TITLE,
  LIVE_ENQUIRY_SUCCESS_MESSAGE,
  GENERAL_CONSULTATION_OPTION,
  getPublicApprovedTreatments,
  getPublicBookingOptions,
  resolveInitialBookingTreatment,
  getLocalTodayDateString,
  validatePreferredDate,
  validatePhoneFormat,
  normalizePhoneForSubmission,
  validateBookingForm,
  processBookingSubmission,
};

interface BookingSectionProps {
  compact?: boolean;
  preselectedTreatment?: string;
  isModal?: boolean;
  headingId?: string;
}

export function BookingSection({
  compact = false,
  preselectedTreatment = '',
  isModal = false,
  headingId,
}: BookingSectionProps) {
  const { settings, treatments, submitEnquiryToCms } = useCms();
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBannerRef = useRef<HTMLDivElement>(null);
  const idPrefix = isModal ? 'modal-' : '';

  const approvedTreatments = useMemo(
    () => getPublicApprovedTreatments(treatments),
    [treatments]
  );

  const [form, setForm] = useState<BookingFormState>(() => ({
    name: '',
    phone: '',
    email: '',
    treatment: isModal
      ? GENERAL_CONSULTATION_OPTION.value
      : resolveInitialBookingTreatment(preselectedTreatment, approvedTreatments),
    preferredDate: '',
    message: '',
    privacyConsent: false,
    website_url: '',
  }));

  useEffect(() => {
    if (isModal) {
      setForm((prev) =>
        prev.treatment === GENERAL_CONSULTATION_OPTION.value
          ? prev
          : { ...prev, treatment: GENERAL_CONSULTATION_OPTION.value }
      );
      return;
    }
    const resolved = resolveInitialBookingTreatment(preselectedTreatment, approvedTreatments);
    if (resolved) {
      setForm((prev) => ({ ...prev, treatment: resolved }));
    } else if (
      form.treatment &&
      form.treatment !== GENERAL_CONSULTATION_OPTION.value &&
      !approvedTreatments.some((t) => t.slug === form.treatment)
    ) {
      setForm((prev) => ({ ...prev, treatment: '' }));
    }
  }, [isModal, preselectedTreatment, approvedTreatments]);

  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTimestamp, setLastSubmitTimestamp] = useState<number>(0);
  const lastSubmittedFingerprintRef = useRef<string>('');
  const [serverResponse, setServerResponse] = useState<BookingServerResponse>({
    status: 'idle',
    title: '',
    message: '',
  });

  // PHASE 9 — BOOKING SECTION: Gentle upward heading text mask + two short staggered field groups
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        ...(isModal
          ? {}
          : {
              scrollTrigger: {
                trigger: el,
                start: 'top 84%',
                once: true,
              },
            }),
      });

      tl.from(
        '.gsap-booking-heading',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: isModal ? 0.52 : 0.72,
          clearProps: 'transform,opacity,visibility',
        },
        0
      );

      tl.from(
        '.gsap-booking-subcopy',
        {
          y: 10,
          autoAlpha: 0,
          duration: isModal ? 0.45 : 0.6,
          clearProps: 'transform,opacity,visibility',
        },
        0.08
      );

      // Two short staggered field groups
      tl.from(
        '.gsap-booking-group',
        {
          y: 14,
          autoAlpha: 0,
          duration: isModal ? 0.5 : 0.68,
          stagger: 0.1,
          clearProps: 'transform,opacity,visibility',
        },
        0.12
      );
    }, el);

    return () => ctx.revert();
  }, [isModal]);

  // Accessible status banner smooth entrance
  useEffect(() => {
    const banner = statusBannerRef.current;
    if (serverResponse.status === 'idle' || !banner || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        banner,
        { y: 8, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.34,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        }
      );
    }, banner);

    return () => ctx.revert();
  }, [serverResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateBookingForm(form, approvedTreatments, new Date(), {
      isSimplifiedPopup: isModal,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setServerResponse({ status: 'idle', title: '', message: '' });
      return;
    }

    const cleanedPhone = form.phone.replace(/[\s().-]/g, '');
    const effectiveTreatment = isModal
      ? GENERAL_CONSULTATION_OPTION.value
      : form.treatment.trim();
    const submissionFingerprint = [
      settings.bookingLiveMode ? 'live' : 'demo',
      form.name.trim().toLowerCase(),
      cleanedPhone,
      effectiveTreatment,
      form.preferredDate.trim(),
    ].join('|');

    if (
      settings.bookingLiveMode &&
      lastSubmittedFingerprintRef.current &&
      lastSubmittedFingerprintRef.current === submissionFingerprint
    ) {
      setServerResponse({
        status: 'throttled',
        title: 'Enquiry Already Recorded',
        message:
          'This consultation enquiry has already been saved for coordinator review. Please update your details if you wish to submit a separate request.',
      });
      return;
    }

    const nowMs = Date.now();
    if (settings.bookingLiveMode && nowMs - lastSubmitTimestamp < 8000) {
      setServerResponse({
        status: 'throttled',
        title: 'Please wait a moment before resubmitting',
        message: 'To prevent duplicate submissions, please wait 8 seconds before trying again.',
      });
      return;
    }

    setIsSubmitting(true);
    if (settings.bookingLiveMode) {
      setLastSubmitTimestamp(nowMs);
    }

    try {
      const result = await processBookingSubmission({
        form,
        bookingLiveMode: settings.bookingLiveMode,
        approvedTreatments,
        submitEnquiryToCms,
        isSimplifiedPopup: isModal,
      });

      setErrors(result.validationErrors);
      setServerResponse(result.serverResponse);

      if (result.ok && settings.bookingLiveMode) {
        lastSubmittedFingerprintRef.current = submissionFingerprint;
      } else if (!result.ok && settings.bookingLiveMode) {
        setLastSubmitTimestamp(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDateString = getLocalTodayDateString();
  const cleanDigitsPhone = settings.phone.replace(/[^0-9+]/g, '');
  const cleanDigitsWhatsapp = settings.whatsappNumber.replace(/[^0-9]/g, '');

  const headingText = isModal ? 'Book Your Private Consultation' : 'Book a Consultation';
  const subtitleText = isModal
    ? 'Begin with a personalised consultation with Dr. Navjot Singh.'
    : 'Take the first step towards your transformation.';
  const inputBgClass = isModal ? 'bg-[#FAF5F0]' : 'bg-[#F5EEE8]/95';
  const inputPyClass = isModal ? 'py-2.5' : 'py-3';

  return (
    <div
      ref={containerRef}
      id={isModal ? undefined : 'book-consultation'}
      className={`${
        isModal
          ? 'bg-[#F5EEE8] p-5 sm:p-6 lg:p-7'
          : 'bg-[#FAF5F0] border border-[#30251F]/12 rounded-[24px] p-5 sm:p-8 lg:p-9 shadow-sm h-full'
      } flex flex-col justify-between`}
    >
      <div>
        <div
          className={`flex flex-wrap items-start justify-between gap-2 ${
            isModal ? 'mb-3.5 pr-10 sm:pr-12 border-b border-[#30251F]/10 pb-3' : 'mb-5'
          }`}
        >
          <div>
            <h2
              id={headingId}
              className={`${styles.sectionHeading} text-[#211A17] ${
                isModal ? '!text-[25px] sm:!text-[30px] !leading-[1.15]' : '!text-3xl sm:!text-[34px]'
              }`}
            >
              <span className="editorial-mask-line pb-0.5">
                <span className="gsap-booking-heading block">{headingText}</span>
              </span>
            </h2>
            <p className="gsap-booking-subcopy mt-1 text-xs sm:text-sm text-[#30251F]/80">
              {subtitleText}
            </p>
          </div>
          {!settings.bookingLiveMode && (
            <span className="gsap-booking-subcopy text-[11px] text-[#30251F]/75 font-medium px-2.5 py-1 rounded-full bg-[#E6CDB5]/35 border border-[#E6CDB5]/60">
              Demo Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className={isModal ? 'space-y-3' : 'space-y-3.5'}>
          {/* Honeypot field */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor={`${idPrefix}n7-website-url`}>Website URL (Leave blank)</label>
            <input
              id={`${idPrefix}n7-website-url`}
              name="website_url"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            />
          </div>

          {/* STAGGERED GROUP 1: Primary Contact & Preferred Date */}
          <div className={`gsap-booking-group ${isModal ? 'space-y-3' : 'space-y-3.5'}`}>
            {/* Row 1: Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${idPrefix}booking-name`}
                  className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                >
                  Full Name *
                </label>
                <input
                  id={`${idPrefix}booking-name`}
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={form.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${idPrefix}booking-name-error` : undefined}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 ${inputPyClass} text-sm text-[#211A17] placeholder:text-[#30251F]/55 ${
                    errors.name ? '!border-red-700' : ''
                  }`}
                />
                {errors.name && (
                  <p
                    id={`${idPrefix}booking-name-error`}
                    role="alert"
                    className="mt-1 text-xs text-red-800 px-2"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}booking-phone`}
                  className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                >
                  Phone Number *
                </label>
                <input
                  id={`${idPrefix}booking-phone`}
                  type="tel"
                  required
                  placeholder="Phone Number *"
                  value={form.phone}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? `${idPrefix}booking-phone-error` : undefined}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 ${inputPyClass} text-sm text-[#211A17] placeholder:text-[#30251F]/55 ${
                    errors.phone ? '!border-red-700' : ''
                  }`}
                />
                {errors.phone && (
                  <p
                    id={`${idPrefix}booking-phone-error`}
                    role="alert"
                    className="mt-1 text-xs text-red-800 px-2"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Preferred Consultation Date (full width in modal; paired with Treatment in standalone section) */}
            {isModal ? (
              <div className="relative">
                <label
                  htmlFor={`${idPrefix}booking-date`}
                  className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                >
                  Preferred Consultation Date *
                </label>
                <input
                  id={`${idPrefix}booking-date`}
                  type="date"
                  required
                  min={minDateString}
                  value={form.preferredDate}
                  aria-invalid={Boolean(errors.preferredDate)}
                  aria-describedby={errors.preferredDate ? `${idPrefix}booking-date-error` : undefined}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 ${inputPyClass} text-sm text-[#211A17] ${
                    errors.preferredDate ? '!border-red-700' : ''
                  }`}
                />
                <Calendar
                  className="w-4 h-4 text-[#30251F]/60 pointer-events-none absolute right-4 top-8.5 hidden sm:block"
                  aria-hidden="true"
                />
                {errors.preferredDate && (
                  <p
                    id={`${idPrefix}booking-date-error`}
                    role="alert"
                    className="mt-1 text-xs text-red-800 px-2"
                  >
                    {errors.preferredDate}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`${idPrefix}booking-treatment`}
                    className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                  >
                    Treatment / Procedure *
                  </label>
                  <select
                    id={`${idPrefix}booking-treatment`}
                    required
                    value={form.treatment}
                    aria-invalid={Boolean(errors.treatment)}
                    aria-describedby={errors.treatment ? `${idPrefix}booking-treatment-error` : undefined}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                    className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 ${inputPyClass} text-sm ${
                      !form.treatment ? 'text-[#30251F]/70' : 'text-[#211A17]'
                    } ${errors.treatment ? '!border-red-700' : ''}`}
                  >
                    <option value="">Select Procedure *</option>
                    {approvedTreatments.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                    <option value={GENERAL_CONSULTATION_OPTION.value}>
                      {GENERAL_CONSULTATION_OPTION.label}
                    </option>
                  </select>
                  {errors.treatment && (
                    <p
                      id={`${idPrefix}booking-treatment-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-800 px-2"
                    >
                      {errors.treatment}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label
                    htmlFor={`${idPrefix}booking-date`}
                    className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                  >
                    Preferred Consultation Date *
                  </label>
                  <input
                    id={`${idPrefix}booking-date`}
                    type="date"
                    required
                    min={minDateString}
                    value={form.preferredDate}
                    aria-invalid={Boolean(errors.preferredDate)}
                    aria-describedby={errors.preferredDate ? `${idPrefix}booking-date-error` : undefined}
                    onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                    className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 ${inputPyClass} text-sm text-[#211A17] ${
                      errors.preferredDate ? '!border-red-700' : ''
                    }`}
                  />
                  <Calendar
                    className="w-4 h-4 text-[#30251F]/60 pointer-events-none absolute right-4 top-8.5 hidden sm:block"
                    aria-hidden="true"
                  />
                  {errors.preferredDate && (
                    <p
                      id={`${idPrefix}booking-date-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-800 px-2"
                    >
                      {errors.preferredDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STAGGERED GROUP 2: Consent & Submit (Optional Email/Message omitted in modal and compact mode) */}
          <div className={`gsap-booking-group ${isModal ? 'space-y-3' : 'space-y-3.5'}`}>
            {!compact && !isModal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`${idPrefix}booking-email`}
                    className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                  >
                    Email Address (Optional)
                  </label>
                  <input
                    id={`${idPrefix}booking-email`}
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? `${idPrefix}booking-email-error` : undefined}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 py-2.5 text-sm text-[#211A17] placeholder:text-[#30251F]/55 ${
                      errors.email ? '!border-red-700' : ''
                    }`}
                  />
                  {errors.email && (
                    <p
                      id={`${idPrefix}booking-email-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-800 px-2"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`${idPrefix}booking-message`}
                    className="block text-xs font-medium text-[#211A17] mb-1 px-2"
                  >
                    Message (Optional)
                  </label>
                  <input
                    id={`${idPrefix}booking-message`}
                    type="text"
                    placeholder="Preferred time or non-medical note"
                    value={form.message}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? `${idPrefix}booking-message-error` : undefined}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`editorial-input w-full rounded-full ${inputBgClass} border px-4 py-2.5 text-sm text-[#211A17] placeholder:text-[#30251F]/55 ${
                      errors.message ? '!border-red-700' : ''
                    }`}
                  />
                  {errors.message && (
                    <p
                      id={`${idPrefix}booking-message-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-800 px-2"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Consent Checkbox (Compact Part A implementation) */}
            <div id={isModal ? undefined : 'privacy-notice'} className="pt-0.5 px-1">
              <label className="flex items-center gap-2 text-xs text-[#30251F]/85 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.privacyConsent}
                  aria-invalid={Boolean(errors.privacyConsent)}
                  aria-describedby={errors.privacyConsent ? `${idPrefix}booking-consent-error` : undefined}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="h-4 w-4 rounded border-[#30251F]/35 text-[#30251F] focus:ring-[#30251F] shrink-0"
                />
                <span>
                  I agree to the <span className="underline underline-offset-2">Privacy Policy</span>. *
                </span>
              </label>
              {errors.privacyConsent && (
                <p
                  id={`${idPrefix}booking-consent-error`}
                  role="alert"
                  className="mt-1 text-xs text-red-800 px-1"
                >
                  {errors.privacyConsent}
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="editorial-btn-lift w-full inline-flex items-center justify-center gap-2 bg-[#30251F] hover:bg-[#211A17] disabled:opacity-60 text-[#F5EEE8] text-sm font-medium py-3.5 px-7 rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17] group"
              >
                <span>
                  {isSubmitting ? 'Validating...' : 'Submit Consultation Enquiry'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#E6CDB5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Conditional Mobile Call & WhatsApp CTAs (standalone mode only, when phone confirmed) */}
            {!isModal && settings.isPhoneConfirmed && cleanDigitsPhone.length >= 7 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`tel:${cleanDigitsPhone}`}
                  className="editorial-btn-lift inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#30251F]/25 text-xs font-medium text-[#211A17] hover:bg-[#E6CDB5]/40 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#30251F]" />
                  <span>Call Clinic Directly</span>
                </a>
                {cleanDigitsWhatsapp.length >= 7 && (
                  <a
                    href={`https://wa.me/${cleanDigitsWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-btn-lift inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#30251F]/25 text-xs font-medium text-[#211A17] hover:bg-[#E6CDB5]/40 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#30251F]" />
                    <span>WhatsApp Coordinator</span>
                  </a>
                )}
              </div>
            )}

            {/* Accessible Status Banner */}
            {serverResponse.status !== 'idle' && (
              <div
                ref={statusBannerRef}
                role="status"
                aria-live="polite"
                className="mt-3 rounded-[16px] p-3.5 border border-[#BA9876]/50 bg-[#F5EEE8] text-xs leading-relaxed flex items-start gap-2.5 text-[#211A17]"
              >
                {serverResponse.status === 'demo_mode' ? (
                  <Info className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                ) : serverResponse.status === 'live_enquiry_logged' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-[#211A17]">{serverResponse.title}</p>
                  <p className="mt-0.5 text-[#30251F]/85">{serverResponse.message}</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
