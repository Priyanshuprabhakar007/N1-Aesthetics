import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { useRouter } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import { BookingSection } from './BookingSection';

interface ConsultationModalContextValue {
  isOpen: boolean;
  openConsultationForm: (preselectedTreatment?: string) => void;
  closeModal: () => void;
}

const CONSULTATION_POPUP_SESSION_KEY = 'n7_consultation_form_popup_shown_v1';

const ConsultationModalContext = createContext<ConsultationModalContextValue | undefined>(undefined);

function markPopupShownInSession() {
  try {
    window.sessionStorage.setItem(CONSULTATION_POPUP_SESSION_KEY, 'true');
  } catch {
    // Ignore storage access errors in restricted private browsing contexts
  }
}

function hasPopupShownInSession(): boolean {
  try {
    return window.sessionStorage.getItem(CONSULTATION_POPUP_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function ConsultationModalProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [preselectedTreatment, setPreselectedTreatment] = useState<string>('');

  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const captureTriggerFocus = useCallback(() => {
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement &&
      !dialogRef.current?.contains(document.activeElement)
    ) {
      previouslyFocusedElementRef.current = document.activeElement;
    }
  }, []);

  const openConsultationForm = useCallback(
    (treatmentSlug = '') => {
      captureTriggerFocus();
      markPopupShownInSession();
      if (treatmentSlug) {
        setPreselectedTreatment(treatmentSlug);
      } else if (normalizedPath.startsWith('/treatments/')) {
        const currentSlug = normalizedPath.replace('/treatments/', '');
        if (currentSlug) setPreselectedTreatment(currentSlug);
      }
      setIsOpen(true);
    },
    [captureTriggerFocus, normalizedPath]
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Automatically close if user navigates to /admin
  useEffect(() => {
    if (normalizedPath === '/admin' && isOpen) {
      setIsOpen(false);
    }
  }, [normalizedPath, isOpen]);

  // Automatically open the consultation form popup 3 seconds after a visitor lands on the homepage,
  // once per browser session, and never on /admin.
  useEffect(() => {
    if (normalizedPath !== '/') return;
    if (isOpen) return;
    if (hasPopupShownInSession()) return;

    const timer = window.setTimeout(() => {
      if (hasPopupShownInSession()) return;
      captureTriggerFocus();
      markPopupShownInSession();
      setIsOpen(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [normalizedPath, isOpen, captureTriggerFocus]);

  // Connect all existing "Book Consultation" links across the website (#book-consultation or /contact#book-consultation)
  // to open this single consultation form popup directly.
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href') || '';
      if (rawHref === '#book-consultation' || rawHref.endsWith('#book-consultation')) {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement !== anchor) {
          previouslyFocusedElementRef.current = anchor;
        }
        openConsultationForm();
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [openConsultationForm]);

  // Lock background page scrolling while open and restore on close without adding a second scrollbar
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  // Restore focus to the trigger element when modal closes
  useEffect(() => {
    if (isOpen) return;
    const prevEl = previouslyFocusedElementRef.current;
    if (prevEl && typeof prevEl.focus === 'function' && document.contains(prevEl)) {
      prevEl.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen]);

  // Subtle backdrop fade (~250ms) and modal entrance animation + initial focus management
  useEffect(() => {
    if (!isOpen) return;
    const backdropEl = backdropRef.current;
    const dialogEl = dialogRef.current;

    const focusTimer = window.setTimeout(() => {
      const firstInput = dialogEl?.querySelector<HTMLElement>('#modal-booking-name');
      if (firstInput) {
        firstInput.focus();
      } else {
        closeButtonRef.current?.focus();
      }
    }, 40);

    if (prefersReducedMotion()) {
      return () => window.clearTimeout(focusTimer);
    }

    const ctx = gsap.context(() => {
      if (backdropEl) {
        gsap.fromTo(
          backdropEl,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.25,
            ease: 'power2.out',
            clearProps: 'opacity,visibility',
          }
        );
      }

      if (dialogEl) {
        gsap.fromTo(
          dialogEl,
          { y: 14, autoAlpha: 0, scale: 0.985 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.36,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility',
          }
        );
      }
    });

    return () => {
      window.clearTimeout(focusTimer);
      ctx.revert();
    };
  }, [isOpen]);

  // Escape key dismissal and accessible focus trapping within active modal dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !dialogRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !dialogRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  return (
    <ConsultationModalContext.Provider
      value={{
        isOpen,
        openConsultationForm,
        closeModal,
      }}
    >
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          {/* Subtle dark luxury backdrop with blur */}
          <div
            ref={backdropRef}
            aria-hidden="true"
            onClick={closeModal}
            className="fixed inset-0 bg-[#211A17]/72 backdrop-blur-[4px]"
          />

          {/* SINGLE CONSULTATION FORM MODAL (650–760px desktop width, warm ivory #F5EEE8) */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="n7-consultation-form-modal-title"
            className="relative z-10 w-full max-w-[720px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain rounded-[26px] bg-[#F5EEE8] border border-[#E6CDB5]/65 shadow-[0_28px_80px_rgba(15,10,8,0.58)]"
          >
            {/* Visible top-right Close (X) button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeModal}
              aria-label="Close consultation booking form"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#30251F]/18 bg-[#FAF5F0] text-[#211A17] hover:bg-[#E6CDB5]/55 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17]"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>

            <BookingSection
              isModal
              headingId="n7-consultation-form-modal-title"
              preselectedTreatment={preselectedTreatment}
            />
          </div>
        </div>
      )}
    </ConsultationModalContext.Provider>
  );
}

export function useConsultationModal(): ConsultationModalContextValue {
  const ctx = useContext(ConsultationModalContext);
  if (!ctx) {
    throw new Error('useConsultationModal must be used within a ConsultationModalProvider');
  }
  return ctx;
}
