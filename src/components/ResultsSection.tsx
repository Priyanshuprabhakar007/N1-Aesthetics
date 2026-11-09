import React, { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { siteContent } from '../content/site';
import { Link } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';

export function ResultsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { heading, description, ctaLabel, disclaimer, items } = siteContent.expectedOutcomes;

  // Masked heading & CTA reveal + staggered comparison card entrance
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

      tl.from(
        '.gsap-results-disclaimer',
        {
          opacity: 0,
          y: 8,
          duration: 0.6,
          clearProps: 'transform,opacity,visibility',
        },
        0.4
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="expected-outcomes-heading"
      className="w-full bg-[#F5EEE8] border-b border-[#30251F]/12 py-10 sm:py-14"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10">
        {/* Desktop layout: Left introductory column (~23%) and Right 4-card gallery (~77%) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-0">
          {/* LEFT INTRODUCTORY COLUMN (~23%) */}
          <div className="w-full lg:w-[23%] lg:border-r lg:border-[#30251F]/14 lg:pr-8 flex flex-col justify-center shrink-0">
            <h2
              id="expected-outcomes-heading"
              className="font-heading text-[36px] sm:text-[40px] lg:text-[42px] leading-[1.06] tracking-[-0.015em] text-[#211A17] font-normal"
            >
              <span className="editorial-mask-line pb-1">
                <span className="gsap-results-heading block">{heading}</span>
              </span>
            </h2>

            <p className="gsap-results-intro mt-3 font-sans text-xs sm:text-[13px] text-[#30251F]/85 leading-[1.6] max-w-[28ch]">
              {description}
            </p>

            <div className="gsap-results-intro mt-6">
              <Link
                href="/results"
                className="editorial-btn-lift inline-flex items-center gap-1.5 bg-[#E6CDB5] hover:bg-[#dcc0a4] text-[#211A17] text-xs font-medium px-5 py-2.5 rounded-full transition-colors whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17] group"
              >
                <span>{ctaLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT GALLERY (~77%):
              Desktop (xl): 4 equal-size comparison cards side by side
              Tablet (md): 2x2 grid
              Mobile: Horizontal swipeable carousel with snap */}
          <div className="w-full lg:w-[77%] lg:pl-8">
            <div className="no-scrollbar flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-1 px-1">
              {items.map((card) => (
                <div
                  key={card.id}
                  className="gsap-results-card shrink-0 w-[84vw] xs:w-[310px] md:w-auto snap-start flex flex-col"
                >
                  <Link
                    href={`/treatments/${card.treatmentSlug}`}
                    aria-label={`${card.categoryTitle} — Illustrative conceptual comparison preview (Before and Expected After)`}
                    className="editorial-btn-lift group relative block rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17]"
                  >
                    {/* Top Row: Category Title + Illustrative indicator badge */}
                    <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
                      <span className="font-heading text-sm sm:text-base text-[#211A17] font-medium tracking-tight group-hover:text-[#BA9876] transition-colors">
                        {card.categoryTitle}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded bg-[#30251F]/8 text-[#30251F]/70 border border-[#30251F]/10">
                        ILLUSTRATIVE
                      </span>
                    </div>

                    {/* Comparison Pair Card */}
                    <div className="relative rounded-[16px] overflow-hidden bg-[#FAF5F0] border border-[#30251F]/12 shadow-xs group-hover:border-[#BA9876]/50 group-hover:shadow-md transition-all duration-300">
                      <img
                        src={card.pairImage}
                        alt={card.alt}
                        loading="lazy"
                        className="w-full h-auto object-cover select-none"
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Centered Disclaimer Pill spanning across horizontal hairline rule */}
        <div className="gsap-results-disclaimer relative mt-10 sm:mt-12 pt-3">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#30251F]/12" aria-hidden="true" />
          <div className="relative flex justify-center">
            <div className="bg-[#EFE7E0] border border-[#30251F]/14 rounded-full px-5 sm:px-7 py-1.5 sm:py-2 shadow-xs max-w-[92%] sm:max-w-none">
              <p className="font-serif italic text-xs sm:text-[13px] text-[#30251F]/85 text-center tracking-normal">
                {disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
