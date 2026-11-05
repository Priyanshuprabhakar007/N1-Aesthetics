import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { gsap, prefersReducedMotion } from '../lib/gsap';

interface DisplayReviewCard {
  id: string;
  quote: string;
  attribution: string;
  context?: string;
  isPlaceholder: boolean;
}

const DEV_PLACEHOLDER_CARDS: DisplayReviewCard[] = [
  {
    id: 'dev-placeholder-1',
    quote:
      'Reserved for an authentic, written-consent patient reflection regarding consultation care, surgical planning, and recovery support at N7 Aesthetics.',
    attribution: 'Placeholder · Awaiting Verified Patient Review',
    context: 'Hidden on live launch until approved in CMS',
    isPlaceholder: true,
  },
  {
    id: 'dev-placeholder-2',
    quote:
      'Reserved for a second verified patient reflection. Only genuine, unaltered patient feedback with documented consent is published by the clinic.',
    attribution: 'Placeholder · Awaiting Verified Patient Review',
    context: 'No invented ratings or fictional quotes',
    isPlaceholder: true,
  },
  {
    id: 'dev-placeholder-3',
    quote:
      'Patient reflections are managed via the Clinic Admin CMS and require explicit consent verification before appearing in this gallery.',
    attribution: 'Placeholder · Clinical Governance Slot',
    context: 'Consent-verified publication workflow',
    isPlaceholder: true,
  },
];

export function TestimonialsSection() {
  const { consentedTestimonials } = useCms();
  const [startIndex, setStartIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const cards: DisplayReviewCard[] =
    consentedTestimonials.length > 0
      ? consentedTestimonials.map((item) => ({
          id: item.id,
          quote: item.quote,
          attribution: item.patientIdentifier,
          context: item.procedureContext,
          isPlaceholder: false,
        }))
      : DEV_PLACEHOLDER_CARDS;

  const total = cards.length;
  const firstCard = cards[startIndex % total];
  const secondCard = cards[(startIndex + 1) % total];

  // PHASE 7 — TESTIMONIAL SECTION: Coordinated GSAP ScrollTrigger reveal
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 82%',
          once: true,
        },
      });

      // 1. Smooth background-image reveal on the left editorial portrait
      tl.fromTo(
        '.gsap-testimonial-bg',
        { scale: 1.04, opacity: 0 },
        {
          scale: 1,
          opacity: 0.9,
          duration: 0.95,
          clearProps: 'transform',
        },
        0
      );

      // 2. Coordinated heading masked lines + circular controls
      tl.from(
        '.gsap-testimonial-heading-line',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: 0.68,
          stagger: 0.08,
          clearProps: 'transform,opacity,visibility',
        },
        0.1
      );

      tl.from(
        '.gsap-testimonial-controls',
        {
          y: 12,
          autoAlpha: 0,
          duration: 0.62,
          clearProps: 'transform,opacity,visibility',
        },
        0.24
      );

      // 3. Two soft-ivory quote cards reveal in sequence
      tl.from(
        '.gsap-testimonial-card',
        {
          y: 20,
          autoAlpha: 0,
          duration: 0.72,
          stagger: 0.1,
          clearProps: 'transform,opacity,visibility',
        },
        0.16
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  // Manual carousel transition using GSAP opacity + translateX with proper disabled state
  const changeSlide = (direction: 1 | -1) => {
    if (isTransitioning || total <= 1) return;

    const container = cardsContainerRef.current;
    if (!container || prefersReducedMotion()) {
      setStartIndex((prev) => (prev + direction + total) % total);
      return;
    }

    setIsTransitioning(true);

    gsap.to(container, {
      x: direction * -16,
      opacity: 0.25,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setStartIndex((prev) => (prev + direction + total) % total);
        gsap.fromTo(
          container,
          { x: direction * 18, opacity: 0.25 },
          {
            x: 0,
            opacity: 1,
            duration: 0.38,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            onComplete: () => {
              setIsTransitioning(false);
            },
          }
        );
      },
    });
  };

  const handlePrev = () => changeSlide(-1);
  const handleNext = () => changeSlide(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="patient-testimonials-heading"
      className="relative w-full bg-[#30251F] text-[#F5EEE8] overflow-hidden min-h-[260px] lg:min-h-[305px] flex items-center"
    >
      {/* LEFT VISUAL AREA: Large close-up beauty/editorial portrait softly blended into the dark chocolate background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[62%] sm:w-[46%] lg:w-[36%] z-[1] overflow-hidden"
      >
        <img
          src="/media/treatment-skin-rejuvenation.jpg"
          alt=""
          loading="lazy"
          className="gsap-testimonial-bg w-full h-full object-cover object-[42%_28%] -scale-x-100 opacity-90 select-none"
        />
        {/* Smooth horizontal and vertical gradients blending the portrait into #30251F */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#30251F]/10 via-[#30251F]/55 to-[#30251F]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#30251F]/70 via-transparent to-[#30251F]/40" />
      </div>

      {/* Subtle warm radial lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] -top-16 w-80 h-80 rounded-full bg-[#E6CDB5]/8 blur-3xl z-[1]"
      />

      {/* FOREGROUND CONTENT: 3 visual zones on desktop (Left portrait space, Center heading + controls, Right 2 ivory cards) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-9 sm:py-11 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-6 items-center">
          {/* LEFT SPACER ON DESKTOP: Keeps the close-up beauty portrait on the left clearly visible */}
          <div className="hidden lg:block lg:col-span-3" aria-hidden="true" />

          {/* CENTER AREA: Heading "What Our Patients Say" + two circular prev/next buttons */}
          <div className="lg:col-span-3 flex flex-col justify-center lg:pl-2">
            <h2
              id="patient-testimonials-heading"
              className="font-heading text-[34px] sm:text-[38px] lg:text-[42px] leading-[1.06] text-[#F5EEE8] font-normal tracking-[-0.01em]"
            >
              <span className="editorial-mask-line pb-0.5">
                <span className="gsap-testimonial-heading-line block">What Our</span>
              </span>
              <span className="editorial-mask-line pb-1">
                <span className="gsap-testimonial-heading-line block">Patients Say</span>
              </span>
            </h2>

            <div className="gsap-testimonial-controls mt-5 sm:mt-6 flex items-center gap-2.5 lg:justify-center lg:pr-8">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isTransitioning}
                aria-busy={isTransitioning}
                aria-label="Previous patient testimonial"
                className="editorial-btn-lift w-9 h-9 rounded-full border border-[#E6CDB5]/50 text-[#E6CDB5] hover:border-[#E6CDB5] hover:bg-[#E6CDB5]/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E6CDB5]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isTransitioning}
                aria-busy={isTransitioning}
                aria-label="Next patient testimonial"
                className="editorial-btn-lift w-9 h-9 rounded-full bg-[#E6CDB5] text-[#211A17] hover:bg-[#dfbfa0] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F5EEE8]"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT AREA: Two compact soft-ivory testimonial cards side by side on tablet/desktop, swipeable single card on mobile */}
          <div
            className="lg:col-span-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={cardsContainerRef}
              aria-live="polite"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-stretch"
            >
              {[firstCard, secondCard].map((card, idx) => (
                <article
                  key={`${card.id}-${idx}`}
                  className={`gsap-testimonial-card ${
                    idx === 1 ? 'hidden md:flex' : 'flex'
                  } flex-col justify-between bg-[#F5EEE8] text-[#211A17] rounded-[15px] p-5 sm:p-6 min-h-[200px] sm:min-h-[212px] shadow-md`}
                >
                  <div>
                    {/* Prominent quotation mark at top-left */}
                    <span
                      aria-hidden="true"
                      className="block font-serif text-4xl leading-none text-[#30251F] select-none mb-2"
                    >
                      “
                    </span>

                    <p className="font-sans italic text-[12.5px] sm:text-[13px] text-[#211A17]/90 leading-[1.6]">
                      “{card.quote}”
                    </p>
                  </div>

                  <footer className="mt-4 pt-2.5 border-t border-[#30251F]/10">
                    <p className="font-sans text-[11.5px] font-semibold text-[#211A17]">
                      — {card.attribution}
                    </p>
                    {card.context && (
                      <p className="font-sans text-[10.5px] text-[#BA9876] font-medium mt-0.5">
                        {card.context}
                      </p>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
