import React from 'react';
import { Calendar } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { useRouter } from '../lib/router';
import { useConsultationModal } from './ConsultationModal';
import { resolveWhatsappCtaState } from '../lib/mobileCta';

export function MobileStickyCtaBar() {
  const { settings } = useCms();
  const { pathname } = useRouter();
  const { isOpen, openConsultationForm } = useConsultationModal();

  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Hide when the consultation modal is open or on admin screens
  if (isOpen || normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
    return null;
  }

  const whatsappState = resolveWhatsappCtaState(settings);
  const hasWhatsapp = whatsappState.isAvailable && Boolean(whatsappState.href);

  return (
    <div
      role="region"
      aria-label="Mobile quick consultation action"
      className={`fixed z-40 md:hidden pointer-events-none bottom-[calc(18px+env(safe-area-inset-bottom,0px))] left-4 ${
        hasWhatsapp ? 'right-[74px] max-w-[calc(100vw-86px)]' : 'right-4 max-w-sm mx-auto'
      }`}
    >
      {/* Book Consultation Pill — Ivory #F5EEE8, dark chocolate #30251F text */}
      <button
        type="button"
        onClick={() => openConsultationForm()}
        aria-label="Book Consultation"
        className="pointer-events-auto w-full min-h-[50px] h-[50px] inline-flex items-center justify-center gap-2 rounded-full bg-[#F5EEE8] active:bg-[#E6CDB5] text-[#30251F] border border-[#E6CDB5]/70 px-4 text-[13px] font-medium tracking-[0.01em] shadow-[0_6px_20px_rgba(15,10,8,0.28)] transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#30251F]"
      >
        <Calendar className="w-4 h-4 text-[#30251F] shrink-0" aria-hidden="true" />
        <span className="truncate">Book Consultation</span>
      </button>
    </div>
  );
}
