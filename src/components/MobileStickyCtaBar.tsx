import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { useRouter } from '../lib/router';
import { useConsultationModal } from './ConsultationModal';
import { resolveWhatsappCtaState } from '../lib/mobileCta';

export function MobileStickyCtaBar() {
  const { settings } = useCms();
  const { pathname } = useRouter();
  const { isOpen, openConsultationForm } = useConsultationModal();

  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Hide when the consultation modal is open or on the /admin portal
  if (isOpen || normalizedPath === '/admin') {
    return null;
  }

  const whatsappState = resolveWhatsappCtaState(settings);

  return (
    <div
      role="region"
      aria-label="Quick consultation actions"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-transparent pointer-events-none px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5">
        {/* Button 1: Book Consultation (~65% width, warm ivory #F5EEE8, dark chocolate #30251F text) */}
        <button
          type="button"
          onClick={() => openConsultationForm()}
          aria-label="Book Consultation"
          className="pointer-events-auto basis-[65%] grow min-h-[48px] h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-[#F5EEE8] active:bg-[#E6CDB5] text-[#30251F] border border-[#E6CDB5]/60 px-3.5 text-[13px] font-medium tracking-[0.01em] shadow-[0_6px_20px_rgba(15,10,8,0.28)] transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
        >
          <Calendar className="w-4 h-4 text-[#30251F] shrink-0" aria-hidden="true" />
          <span className="truncate">Book Consultation</span>
        </button>

        {/* Button 2: WhatsApp (~35% width, solid dark green #205C46, white text #FFFFFF) */}
        {whatsappState.isAvailable && whatsappState.href ? (
          <a
            href={whatsappState.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enquire on WhatsApp"
            style={{ opacity: 1 }}
            className="pointer-events-auto basis-[35%] shrink-0 min-h-[48px] h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#205C46] hover:bg-[#1A4B39] active:bg-[#163E2F] text-[#FFFFFF] opacity-100 border border-[#E6CDB5]/20 px-3 text-[13px] font-medium tracking-[0.01em] shadow-[0_6px_20px_rgba(15,10,8,0.28)] transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
          >
            <MessageCircle className="w-4 h-4 text-[#FFFFFF] shrink-0" aria-hidden="true" />
            <span className="truncate text-[#FFFFFF]">WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="WhatsApp (activates once clinic phone is confirmed)"
            title="WhatsApp activates automatically once the clinic phone number is confirmed"
            style={{ opacity: 1 }}
            className="pointer-events-auto basis-[35%] shrink-0 min-h-[48px] h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#205C46] disabled:bg-[#205C46] text-[#FFFFFF] disabled:text-[#FFFFFF] opacity-100 disabled:opacity-100 border border-[#E6CDB5]/20 px-3 text-[13px] font-medium tracking-[0.01em] shadow-[0_6px_20px_rgba(15,10,8,0.28)] cursor-not-allowed select-none"
          >
            <MessageCircle className="w-4 h-4 text-[#FFFFFF] shrink-0" aria-hidden="true" />
            <span className="truncate text-[#FFFFFF]">WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  );
}
