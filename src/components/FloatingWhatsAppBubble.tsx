import React from 'react';
import { useCms } from '../context/CmsContext';
import { useRouter } from '../lib/router';
import { useConsultationModal } from './ConsultationModal';
import { resolveWhatsappCtaState } from '../lib/mobileCta';
import { WhatsAppIcon } from './WhatsAppIcon';

export function FloatingWhatsAppBubble() {
  const { settings } = useCms();
  const { pathname } = useRouter();
  const { isOpen } = useConsultationModal();

  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Hide on admin routes, or when consultation modal is open
  if (isOpen || normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
    return null;
  }

  const whatsappState = resolveWhatsappCtaState(settings);

  // Per Part 4: If the number is not confirmed or invalid, hide the global floating bubble
  if (!whatsappState.isAvailable || !whatsappState.href) {
    return null;
  }

  return (
    <a
      href={whatsappState.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with N7 Aesthetics on WhatsApp"
      className="fixed z-40 right-4 sm:right-6 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] sm:bottom-6 w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] rounded-full bg-[#205C46] text-[#FFFFFF] shadow-[0_6px_22px_rgba(32,92,70,0.38)] hover:shadow-[0_8px_28px_rgba(32,92,70,0.48)] flex items-center justify-center hover:-translate-y-1 active:translate-y-0 transition-all duration-300 motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205C46]"
    >
      <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#FFFFFF] shrink-0" />
      <span className="sr-only">Chat with N7 Aesthetics on WhatsApp</span>
    </a>
  );
}
