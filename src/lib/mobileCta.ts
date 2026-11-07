export const WHATSAPP_PREFILLED_MESSAGE =
  'Hello N7 Aesthetics, I would like to enquire about a consultation.';

export interface WhatsappCtaState {
  isAvailable: boolean;
  digitsOnlyPhone: string;
  href: string | null;
}

/**
 * Resolves the mobile WhatsApp CTA state from live CMS settings.
 * Returns `isAvailable: true` and a valid `https://wa.me/<digits>?text=...` URL
 * ONLY when `isPhoneConfirmed` is true and `whatsappNumber` contains 7–15 digits
 * (and is not an unconfirmed bracketed placeholder).
 */
export function resolveWhatsappCtaState(settings: {
  whatsappNumber?: string | null;
  isPhoneConfirmed?: boolean | null;
}): WhatsappCtaState {
  const raw = (settings.whatsappNumber || '').trim();
  const isPlaceholder = raw.includes('[') || raw.includes('Pending');
  const digitsOnlyPhone = raw.replace(/\D/g, '');
  const hasValidDigits =
    !isPlaceholder && digitsOnlyPhone.length >= 7 && digitsOnlyPhone.length <= 15;

  const isAvailable = Boolean(settings.isPhoneConfirmed) && hasValidDigits;

  if (!isAvailable) {
    return {
      isAvailable: false,
      digitsOnlyPhone: '',
      href: null,
    };
  }

  const encodedMessage = encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE);
  return {
    isAvailable: true,
    digitsOnlyPhone,
    href: `https://wa.me/${digitsOnlyPhone}?text=${encodedMessage}`,
  };
}
