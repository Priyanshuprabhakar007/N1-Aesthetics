import React, { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';

interface ComparisonSlot {
  id: string;
  categoryTitle: string;
  treatmentSlug: string;
  beforeImage: string;
  afterImage: string;
  isVerifiedOutcome: boolean;
}

const DEFAULT_DEVELOPMENT_SLOTS: ComparisonSlot[] = [
  {
    id: 'slot-hair-restoration',
    categoryTitle: 'Hair Restoration',
    treatmentSlug: 'hair-transplant',
    beforeImage:
      '/assets/aistudio/8FK6v_tEi3eMvKGVWR3WMgpyDNLf6VWzPIpjcGDk_JipouMhKymEyBEK3bayWd61CJ2s39RtQZKgvNT9eXxnbR9AuHyYXBm3pDT3kFTMO5IcwBRbYlN2NxcC0t6mxtE6yb1U_JzdmIqxPS8cTTZ1qVl3fa8eGoRGr6D4ASIB6J9oqYee4t4a2qcBiuVn8mfb_77244af0.jpg',
    afterImage:
      '/assets/aistudio/8FK6v_tEi3eMvKGVWR3WMgpyDNLf6VWzPIpjcGDk_JipouMhKymEyBEK3bayWd61CJ2s39RtQZKgvNT9eXxnbR9AuHyYXBm3pDT3kFTMO5IcwBRbYlN2NxcC0t6mxtE6yb1U_JzdmIqxPS8cTTZ1qVl3fa8eGoRGr6D4ASIB6J9oqYee4t4a2qcBiuVn8mfb_77244af0.jpg',
    isVerifiedOutcome: false,
  },
  {
    id: 'slot-rhinoplasty',
    categoryTitle: 'Rhinoplasty',
    treatmentSlug: 'rhinoplasty',
    beforeImage:
      '/assets/aistudio/HYXaJIOuTeFoptEJwejKPyHC-6cV7t14B0UBgJJSPkG9XB6HSsR8Pn7-XTD7mw7TJjv-3E622YIR8OT9SzNTBUijGMWYYQYa8xmJW3to5_8vn5QcCS5nI2UvWBevDK5HUcWcv-MtIwDtasisVlaedHmbtstcoTOXC3AlEE99M5vyj1-0McNT-8BzaBLgtrrs_a9c1bf80.jpg',
    afterImage:
      '/assets/aistudio/HYXaJIOuTeFoptEJwejKPyHC-6cV7t14B0UBgJJSPkG9XB6HSsR8Pn7-XTD7mw7TJjv-3E622YIR8OT9SzNTBUijGMWYYQYa8xmJW3to5_8vn5QcCS5nI2UvWBevDK5HUcWcv-MtIwDtasisVlaedHmbtstcoTOXC3AlEE99M5vyj1-0McNT-8BzaBLgtrrs_a9c1bf80.jpg',
    isVerifiedOutcome: false,
  },
  {
    id: 'slot-chest-contouring',
    categoryTitle: 'Chest Contouring',
    treatmentSlug: 'gynecomastia-correction',
    beforeImage: '/media/treatment-gynecomastia.jpg',
    afterImage: '/media/treatment-gynecomastia.jpg',
    isVerifiedOutcome: false,
  },
  {
    id: 'slot-body-contouring',
    categoryTitle: 'Body Contouring',
    treatmentSlug: 'body-contouring',
    beforeImage: '/media/treatment-body-contouring.jpg',
    afterImage: '/media/treatment-body-contouring.jpg',
    isVerifiedOutcome: false,
  },
];

export function ResultsSection() {
  const { consentedResults } = useCms();
  const sectionRef = useRef<HTMLElement>(null);

  // Merge any verified consented results from CMS into the 4 gallery slots
  const galleryCards: ComparisonSlot[] = DEFAULT_DEVELOPMENT_SLOTS.map((slot, index) => {
    const matched =
      consentedResults.find((r) => r.treatmentSlug === slot.treatmentSlug && r.consentVerified) ||
      consentedResults[index];

    if (matched && matched.consentVerified && matched.beforeImage && matched.afterImage) {
      return {
        id: matched.id,
        categoryTitle: matched.treatmentTitle || slot.categoryTitle,
        treatmentSlug: matched.treatmentSlug || slot.treatmentSlug,
        beforeImage: matched.beforeImage,
        afterImage: matched.afterImage,
        isVerifiedOutcome: true,
      };
    }

    return slot;
  });

  // PHASE 8 — REAL RESULTS: Masked heading & CTA reveal + left-to-right staggered comparison cards
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 84%',
          once: true,
        },
      });

      tl.from(
        '.gsap-results-heading',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: 0.72,
          clearProps: 'transform,opacity,visibility',
        },
        0
      );

      tl.from(
        '.gsap-results-intro',
        {
          y: 12,
          autoAlpha: 0,
          duration: 0.65,
          stagger: 0.08,
          clearProps: 'transform,opacity,visibility',
        },
        0.12
      );

      tl.from(
        '.gsap-results-card',
        {
          x: 16,
          y: 12,
          autoAlpha: 0,
          duration: 0.75,
          stagger: 0.1,
          clearProps: 'transform,opacity,visibility',
        },
        0.16
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="real-results-heading"
      className="w-full bg-[#F5EEE8] border-b border-[#30251F]/12 py-8 sm:py-10"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10">
        {/* Desktop layout: Left introductory column (~23%) and Right 4-card gallery (~77%) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-7 lg:gap-0">
          {/* LEFT INTRODUCTORY COLUMN (~23%) */}
          <div className="w-full lg:w-[23%] lg:border-r lg:border-[#30251F]/14 lg:pr-7 flex flex-col justify-center shrink-0">
            <h2
              id="real-results-heading"
              className="font-heading text-[36px] sm:text-[40px] lg:text-[42px] leading-[1.06] tracking-[-0.015em] text-[#211A17] font-normal"
            >
              <span className="editorial-mask-line pb-1">
                <span className="gsap-results-heading block">Real Results</span>
              </span>
            </h2>

            <p className="gsap-results-intro mt-2.5 font-sans text-xs sm:text-[13px] text-[#30251F]/85 leading-[1.55] max-w-[26ch]">
              Explore documented patient outcomes from procedures performed at N7 Aesthetics.
            </p>

            <div className="gsap-results-intro mt-5">
              <Link
                href="/results"
                className="editorial-btn-lift inline-flex items-center gap-1.5 bg-[#E6CDB5] hover:bg-[#dcc0a4] text-[#211A17] text-xs font-medium px-5 py-2.5 rounded-full transition-colors whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17] group"
              >
                <span>View More Results</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT GALLERY (~77%):
              Desktop (xl): 4 equal-size comparison cards side by side
              Tablet (md): 2x2 grid
              Mobile: Horizontal swipeable carousel (no-scrollbar) */}
          <div className="w-full lg:w-[77%] lg:pl-7">
            <div className="no-scrollbar flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-1 px-1">
              {galleryCards.map((card) => (
                <div
                  key={card.id}
                  className="gsap-results-card shrink-0 w-[82vw] xs:w-[300px] md:w-auto snap-start"
                >
                  <Link
                    href="/results"
                    aria-label={`${card.categoryTitle} — ${
                      card.isVerifiedOutcome
                        ? 'Verified clinical before and after comparison'
                        : 'Development placeholder awaiting verified clinical pair'
                    }`}
                    className="editorial-btn-lift group relative block rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17]"
                  >
                    {/* Unverified development state badge so placeholder images are never mistaken for surgical change */}
                    {!card.isVerifiedOutcome && (
                      <span className="sr-only">
                        Unpublished development placeholder for {card.categoryTitle}
                      </span>
                    )}

                    {/* Two side-by-side photo panels — clinical photos remain unaltered and un-distorted */}
                    <div className="grid grid-cols-2 gap-1.5 h-[195px] sm:h-[210px] w-full">
                      {/* Left Panel: BEFORE */}
                      <div className="relative h-full w-full rounded-[12px] overflow-hidden bg-[#D8C8B8] border border-transparent group-hover:border-[#BA9876]/45 transition-colors duration-300">
                        <img
                          src={card.beforeImage}
                          alt={
                            card.isVerifiedOutcome
                              ? `Before ${card.categoryTitle}`
                              : `${card.categoryTitle} placeholder panel (Before)`
                          }
                          loading="lazy"
                          className="w-full h-full object-cover object-center select-none"
                        />
                        {/* Small dark translucent label bar at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-7 bg-[#211A17]/75 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="font-sans text-[11px] font-medium text-[#F5EEE8] tracking-[0.02em]">
                            Before
                          </span>
                        </div>
                      </div>

                      {/* Right Panel: AFTER */}
                      <div className="relative h-full w-full rounded-[12px] overflow-hidden bg-[#D8C8B8] border border-transparent group-hover:border-[#BA9876]/45 transition-colors duration-300">
                        <img
                          src={card.afterImage}
                          alt={
                            card.isVerifiedOutcome
                              ? `After ${card.categoryTitle}`
                              : `${card.categoryTitle} placeholder panel (After)`
                          }
                          loading="lazy"
                          className="w-full h-full object-cover object-center select-none"
                        />
                        {/* Small dark translucent label bar at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-7 bg-[#211A17]/75 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="font-sans text-[11px] font-medium text-[#F5EEE8] tracking-[0.02em]">
                            After
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
