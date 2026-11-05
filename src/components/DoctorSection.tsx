import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';

const APPROVED_DOCTOR_PORTRAIT = '/images/dr-navjot-singh-premium.png';

const DOCTOR_HIGHLIGHTS = [
  {
    id: 'personalised-consultations',
    title: 'Personalised Consultations',
    subtitle: 'Individual Anatomical Assessment',
    icon: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        className="w-8 h-8 text-[#30251F] shrink-0"
        aria-hidden="true"
      >
        <circle cx="18" cy="14" r="7" />
        <path
          d="m15.5 14 1.8 1.8 3.5-3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 20.2 11.5 29l6.5-3.2L24.5 29 22 20.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'patient-centred-approach',
    title: 'Patient-Centred Approach',
    subtitle: 'Dedicated One-on-One Care',
    icon: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        className="w-8 h-8 text-[#30251F] shrink-0"
        aria-hidden="true"
      >
        <circle cx="18" cy="12.5" r="4.2" />
        <path
          d="M10.5 27.5c0-4.2 3.4-7.2 7.5-7.2s7.5 3 7.5 7.2"
          strokeLinecap="round"
        />
        <circle cx="9.5" cy="15" r="2.8" />
        <path
          d="M4.5 26c0-3 2.1-5.3 5-5.7"
          strokeLinecap="round"
        />
        <circle cx="26.5" cy="15" r="2.8" />
        <path
          d="M31.5 26c0-3-2.1-5.3-5-5.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'treatment-planning-safety',
    title: 'Treatment Planning & Safety',
    subtitle: 'Evidence-Based Clinical Protocols',
    icon: (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        className="w-8 h-8 text-[#30251F] shrink-0"
        aria-hidden="true"
      >
        <path
          d="M18 5.5 8.5 9.5v8.2c0 6.8 4.1 12.2 9.5 14.5 5.4-2.3 9.5-7.7 9.5-14.5V9.5L18 5.5Z"
          strokeLinejoin="round"
        />
        <path
          d="m14.2 18.2 2.6 2.6 5.2-5.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function DoctorSection() {
  const { settings } = useCms();
  const [imageError, setImageError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const portraitSrc =
    !settings.doctorPortraitUrl ||
    settings.doctorPortraitUrl.includes('NcUyALnbrKfnL1') ||
    settings.doctorPortraitUrl.includes('doctor-portrait') ||
    settings.doctorPortraitUrl === '/images/dr-navjot-singh.png' ||
    settings.doctorPortraitUrl.includes('ChatGPT_Image')
      ? APPROVED_DOCTOR_PORTRAIT
      : settings.doctorPortraitUrl;

  // Subtle vertical image reveal on scroll (0.8s duration, gentle opacity + translation, no zoom on face)
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

      // 1. Gentle vertical opacity + translation reveal (0.8s, zero zoom)
      tl.from(
        '.gsap-doctor-portrait',
        {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
          clearProps: 'transform,opacity,visibility',
        },
        0
      );

      // 2. Staggered masked text reveal for "Meet" and "Dr. Navjot Singh"
      tl.from(
        '.gsap-doctor-heading-line',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: 0.62,
          stagger: 0.08,
          clearProps: 'transform,opacity,visibility',
        },
        0.08
      );

      // 3. Biography & CTA fade upward naturally
      tl.from(
        '.gsap-doctor-bio',
        {
          y: 14,
          autoAlpha: 0,
          duration: 0.6,
          stagger: 0.07,
          clearProps: 'transform,opacity,visibility',
        },
        0.18
      );

      // 4. Trust indicators reveal sequentially from top to bottom
      tl.from(
        '.gsap-doctor-highlight',
        {
          y: 12,
          autoAlpha: 0,
          duration: 0.56,
          stagger: 0.08,
          clearProps: 'transform,opacity,visibility',
        },
        0.22
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="meet-doctor-heading"
      className="w-full bg-[#F5EEE8] border-b border-[#30251F]/12 overflow-hidden"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 pt-8 md:pt-10 xl:pt-6 pb-8 md:pb-0">
        {/* Desktop >= 1200px (xl): Approved three-column horizontal layout (Left Portrait / Center Bio / Right Highlights) */}
        <div className="flex flex-col xl:flex-row xl:items-stretch gap-8 xl:gap-0">
          {/* Top/Main group for Mobile stack, Tablet 2-column & Desktop Left + Center */}
          <div className="w-full xl:w-[75%] grid grid-cols-1 md:grid-cols-12 gap-7 md:gap-8 xl:gap-10 items-end">
            {/* LEFT COLUMN: Uploaded portrait of Dr. Navjot Singh with its own integrated warm beige arch, bottom-aligned with the section */}
            <div className="md:col-span-5 xl:col-span-6 flex justify-center md:justify-start self-end">
              <div className="gsap-doctor-portrait relative w-[280px] sm:w-[300px] md:w-[290px] lg:w-[320px] xl:w-[345px] h-[345px] sm:h-[365px] md:h-[355px] lg:h-[375px] xl:h-[390px] bg-transparent flex items-end justify-center overflow-hidden">
                {!imageError && portraitSrc ? (
                  <img
                    src={portraitSrc}
                    alt="Dr. Navjot Singh — Plastic & Cosmetic Surgeon at N7 Aesthetics"
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-[center_top] select-none block"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <p className="font-heading text-2xl text-[#211A17] mt-1 font-medium">
                      {settings.doctorName}
                    </p>
                    <p className="text-xs text-[#30251F]/80 mt-0.5">
                      Plastic &amp; Cosmetic Surgeon
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER COLUMN: Meet Dr. Navjot Singh + Plastic & Cosmetic Surgeon + Biography + Button */}
            <div className="md:col-span-7 xl:col-span-6 self-center md:py-8 xl:py-10 xl:pr-6">
              <span className="editorial-mask-line">
                <span className="gsap-doctor-heading-line block font-heading text-xl sm:text-2xl text-[#30251F] leading-tight">
                  Meet
                </span>
              </span>
              <h2
                id="meet-doctor-heading"
                className="font-heading text-[34px] sm:text-[40px] lg:text-[44px] leading-[1.06] text-[#211A17] font-medium mt-0.5"
              >
                <span className="editorial-mask-line pb-1">
                  <span className="gsap-doctor-heading-line block">
                    {settings.doctorName}
                  </span>
                </span>
              </h2>
              <p className="gsap-doctor-bio mt-2 text-sm sm:text-[15px] font-semibold text-[#211A17]">
                {settings.doctorRole || 'Plastic & Cosmetic Surgeon'}
              </p>

              <p className="gsap-doctor-bio mt-3.5 text-xs sm:text-[13.5px] text-[#30251F]/85 leading-[1.65] max-w-[46ch]">
                {settings.doctorShortIntro}
              </p>

              <div className="gsap-doctor-bio mt-5 sm:mt-6">
                <Link
                  href="/doctor"
                  className="editorial-btn-lift inline-flex items-center gap-2 bg-[#E6CDB5] hover:bg-[#dcc0a4] text-[#211A17] text-xs sm:text-[13px] font-medium px-6 py-3 rounded-full whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17] group"
                >
                  <span>Know More About Dr. Singh</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (25%): Three vertically stacked trust indicators */}
          <div className="w-full xl:w-[25%] xl:self-center border-t xl:border-t-0 xl:border-l border-[#30251F]/14 pt-6 md:py-6 xl:pt-0 xl:pl-8 xl:my-6">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 divide-y md:divide-y-0 md:divide-x xl:divide-x-0 xl:divide-y divide-[#30251F]/12">
              {DOCTOR_HIGHLIGHTS.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 md:py-2 md:px-4 md:first:pl-0 md:last:pr-0 xl:px-0 xl:py-3.5 xl:first:pt-1 xl:last:pb-1"
                >
                  <div className="gsap-doctor-highlight flex items-center gap-4">
                    {item.icon}
                    <div className="min-w-0">
                      <h3 className="font-sans text-[13px] sm:text-[13.5px] font-semibold text-[#211A17] leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-[11.5px] text-[#30251F]/75 leading-snug mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
