import React, { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap';

interface FeatureColumn {
  id: string;
  heading: string;
  description: string;
  icon: React.ReactNode;
}

const WHY_CHOOSE_FEATURES: FeatureColumn[] = [
  {
    id: 'patient-centred-care',
    heading: 'Patient-Centred Care',
    description: 'Personalised guidance based on your goals, comfort and anatomy.',
    icon: (
      /* Elegant outlined shield with star */
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        className="w-9 h-9 text-[#211A17]"
        aria-hidden="true"
      >
        <path
          d="M18 4.75 7.75 9v8.5c0 7.2 4.35 12.85 10.25 15.25 5.9-2.4 10.25-8.05 10.25-15.25V9L18 4.75Z"
          strokeLinejoin="round"
        />
        <path
          d="m18 11.2 1.65 3.35 3.7.54-2.68 2.61.63 3.68L18 19.64l-3.3 1.74.63-3.68-2.68-2.61 3.7-.54L18 11.2Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'advanced-care',
    heading: 'Advanced Care',
    description: 'Thoughtful treatment planning with attention to safety.',
    icon: (
      /* Minimalist outlined medical layers / precision symbol */
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        className="w-9 h-9 text-[#211A17]"
        aria-hidden="true"
      >
        <path
          d="M18 6.5 6.5 12.25 18 18l11.5-5.75L18 6.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 18 18 23.75 29.5 18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 23.75 18 29.5l11.5-5.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'natural-looking-outcomes',
    heading: 'Natural-Looking Outcomes',
    description: 'An approach that respects your individual features.',
    icon: (
      /* Minimalist outlined lotus */
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        className="w-9 h-9 text-[#211A17]"
        aria-hidden="true"
      >
        <path
          d="M18 8c-3.4 4.2-4.8 9-4.8 13.2 0 2.8 2.1 4.8 4.8 4.8s4.8-2 4.8-4.8C22.8 17 21.4 12.2 18 8Z"
          strokeLinejoin="round"
        />
        <path
          d="M13.4 13.8c-4.4 1.3-7.6 5.1-7.6 8.9 0 2.4 3.3 3.8 8.2 3.3M22.6 13.8c4.4 1.3 7.6 5.1 7.6 8.9 0 2.4-3.3 3.8-8.2 3.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 28.5c3.5 1.3 15.5 1.3 19 0"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'personalised-consultation',
    heading: 'Personalised Consultation',
    description: 'Time to understand your concerns and discuss your options.',
    icon: (
      /* Minimalist outlined person / head-and-shoulders silhouette */
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        className="w-9 h-9 text-[#211A17]"
        aria-hidden="true"
      >
        <circle cx="18" cy="12.25" r="4.75" />
        <path
          d="M8.5 28.5c0-5 4.2-8.75 9.5-8.75s9.5 3.75 9.5 8.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 28.5h19"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function WhyChooseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // PHASE 6 — WHY CHOOSE N7: Vertical heading reveal, left-to-right icons, center-expanding dividers, subtle text offset
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

      // 1. Center heading appears through a vertical text reveal
      tl.from(
        '.gsap-why-heading',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: 0.72,
          clearProps: 'transform,opacity,visibility',
        },
        0
      );

      // 2. Divider lines expand vertically from their center
      tl.from(
        '.gsap-why-divider',
        {
          scaleY: 0,
          autoAlpha: 0,
          transformOrigin: 'center center',
          duration: 0.7,
          stagger: 0.09,
          clearProps: 'transform,opacity,visibility',
        },
        0.14
      );

      // 3. Four minimalist feature icons reveal from left to right (no bounce or dramatic scaling)
      tl.from(
        '.gsap-why-icon',
        {
          y: 8,
          autoAlpha: 0,
          duration: 0.58,
          stagger: 0.09,
          clearProps: 'transform,opacity,visibility',
        },
        0.16
      );

      // 4. Feature text fades in with a very subtle offset
      tl.from(
        '.gsap-why-copy',
        {
          y: 10,
          autoAlpha: 0,
          duration: 0.62,
          stagger: 0.09,
          clearProps: 'transform,opacity,visibility',
        },
        0.24
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="why-choose-n7-heading"
      className="w-full bg-[#F5EEE8] py-9 sm:py-11 lg:py-12"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10">
        {/* Centered Heading with vertical text reveal */}
        <h2
          id="why-choose-n7-heading"
          className="font-heading text-[32px] sm:text-[38px] lg:text-[44px] font-normal text-[#211A17] text-center leading-[1.1] tracking-[-0.015em] mb-7 sm:mb-9"
        >
          <span className="editorial-mask-line pb-1">
            <span className="gsap-why-heading block">
              Why Choose N7 Aesthetics?
            </span>
          </span>
        </h2>

        {/* Four equal-width columns in a single horizontal row on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-9 sm:gap-x-6 lg:gap-0">
          {WHY_CHOOSE_FEATURES.map((feature, index) => (
            <div
              key={feature.id}
              className="relative px-2 sm:px-4 lg:px-7 flex flex-col items-center text-center"
            >
              {/* Delicate vertical divider on desktop that expands from its center */}
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="gsap-why-divider hidden lg:block absolute left-0 top-1 bottom-1 w-px bg-[#30251F]/15 origin-center"
                />
              )}

              <div className="flex flex-col items-center text-center">
                <div className="gsap-why-icon mb-3 flex items-center justify-center">
                  {feature.icon}
                </div>

                <div className="gsap-why-copy">
                  <h3 className="font-sans text-[16px] sm:text-[17px] font-semibold text-[#211A17] leading-snug">
                    {feature.heading}
                  </h3>

                  <p className="mt-1.5 font-sans text-[12.5px] sm:text-[13.5px] text-[#30251F]/85 leading-[1.55] max-w-[26ch]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
