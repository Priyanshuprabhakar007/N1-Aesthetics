import React, { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { Image } from './LuxuryImage';
import { gsap, prefersReducedMotion } from '../lib/gsap';

const ORDERED_SIGNATURE_SLUGS = [
  'hair-transplant',
  'rhinoplasty',
  'gynecomastia-correction',
  'body-contouring',
  'skin-rejuvenation',
];

const FALLBACK_PHOTO_BY_SLUG: Record<string, string> = {
  'hair-transplant':
    '/assets/aistudio/8FK6v_tEi3eMvKGVWR3WMgpyDNLf6VWzPIpjcGDk_JipouMhKymEyBEK3bayWd61CJ2s39RtQZKgvNT9eXxnbR9AuHyYXBm3pDT3kFTMO5IcwBRbYlN2NxcC0t6mxtE6yb1U_JzdmIqxPS8cTTZ1qVl3fa8eGoRGr6D4ASIB6J9oqYee4t4a2qcBiuVn8mfb_77244af0.jpg',
  rhinoplasty:
    '/assets/aistudio/HYXaJIOuTeFoptEJwejKPyHC-6cV7t14B0UBgJJSPkG9XB6HSsR8Pn7-XTD7mw7TJjv-3E622YIR8OT9SzNTBUijGMWYYQYa8xmJW3to5_8vn5QcCS5nI2UvWBevDK5HUcWcv-MtIwDtasisVlaedHmbtstcoTOXC3AlEE99M5vyj1-0McNT-8BzaBLgtrrs_a9c1bf80.jpg',
  'gynecomastia-correction': '/media/treatment-gynecomastia.jpg',
  'body-contouring': '/media/treatment-body-contouring.jpg',
  'skin-rejuvenation': '/media/treatment-skin-rejuvenation.jpg',
};

const DISPLAY_LINES_BY_SLUG: Record<string, [string, string?]> = {
  'hair-transplant': ['Hair', 'Transplant'],
  rhinoplasty: ['Rhinoplasty'],
  'gynecomastia-correction': ['Gynecomastia', 'Correction'],
  'body-contouring': ['Body', 'Contouring'],
  'skin-rejuvenation': ['Skin', 'Rejuvenation'],
};

export function SignatureTreatments() {
  const { treatments } = useCms();
  const sectionRef = useRef<HTMLElement>(null);

  // Preserve the exact 5 signature treatments order matching the target design
  const signatureTreatments = ORDERED_SIGNATURE_SLUGS.map((slug) => {
    const fromCms = treatments.find((t) => t.slug === slug);
    const fromStatic = siteContent.treatments.find((t) => t.slug === slug);
    const item = fromCms || fromStatic;
    if (!item) return null;

    const photoSrc =
      !item.cardImage || item.cardImage.endsWith('.svg')
        ? FALLBACK_PHOTO_BY_SLUG[slug] || item.cardImage
        : item.cardImage;

    return {
      ...item,
      cardImage: photoSrc,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  // PHASE 5 — SIGNATURE TREATMENT CARDS: Coordinated staggered clipping masks + 1.07 -> 1 image settle
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

      // Heading masked upward reveal + View All link
      tl.from(
        '.gsap-treatments-heading',
        {
          yPercent: 105,
          autoAlpha: 0,
          duration: 0.72,
          clearProps: 'transform,opacity,visibility',
        },
        0
      );

      tl.from(
        '.gsap-treatments-cta',
        {
          y: 12,
          autoAlpha: 0,
          duration: 0.65,
          clearProps: 'transform,opacity,visibility',
        },
        0.1
      );

      // Staggered clipping masks on the 5 treatment cards (0.10s stagger)
      tl.from(
        '.gsap-treatment-card',
        {
          clipPath: 'inset(18% 0% 0% 0% round 15px)',
          y: 18,
          autoAlpha: 0,
          duration: 0.82,
          stagger: 0.1,
          clearProps: 'clipPath,transform,opacity,visibility',
        },
        0.12
      );

      // Inner image softly scales down from 1.07 to 1 as its mask opens
      tl.from(
        '.gsap-treatment-image-scale',
        {
          scale: 1.07,
          duration: 0.98,
          stagger: 0.1,
          clearProps: 'transform',
        },
        0.12
      );
    }, sectionEl);

    return () => ctx.revert();
  }, [signatureTreatments.length]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="signature-treatments-heading"
      className="w-full bg-[#F5EEE8] border-b border-[#30251F]/10 py-10 sm:py-12 lg:py-14"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <h2
            id="signature-treatments-heading"
            className="font-heading text-[32px] sm:text-[38px] lg:text-[42px] leading-[1.1] tracking-[-0.015em] text-[#211A17] font-normal"
          >
            <span className="editorial-mask-line pb-1">
              <span className="gsap-treatments-heading block">
                Our Signature Treatments
              </span>
            </span>
          </h2>

          <Link
            href="/treatments"
            className="gsap-treatments-cta editorial-dark-link inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-[#211A17] hover:text-[#30251F] transition-colors duration-300 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#211A17] group"
          >
            <span>View All Treatments</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* TREATMENT GRID:
            - Staggered clipping masks (0.10s stagger)
            - Image scales 1.07 -> 1 on reveal
            - On hover: image scales to 1.045 over 0.6s (.treatment-card-image)
            - On hover: circular arrow shifts diagonally by 3px (.treatment-card-arrow) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {signatureTreatments.map((treatment) => {
            const labelLines = DISPLAY_LINES_BY_SLUG[treatment.slug];

            return (
              <div key={treatment.slug} className="gsap-treatment-card">
                <Link
                  href={`/treatments/${treatment.slug}`}
                  aria-label={treatment.title}
                  className="group relative block h-[230px] sm:h-[255px] xl:h-[275px] w-full rounded-[15px] overflow-hidden bg-[#30251F] shadow-xs hover:shadow-md transition-shadow duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211A17]"
                >
                  <div className="gsap-treatment-image-scale w-full h-full">
                    <Image
                      src={treatment.cardImage}
                      alt={treatment.imageAlt}
                      sizes="(max-width: 640px) 46vw, (max-width: 1199px) 31vw, 260px"
                      fallbackLabel={treatment.shortTitle}
                      className="treatment-card-image w-full h-full object-cover"
                    />
                  </div>

                  {/* Subtle dark gradient near the bottom of each image for crisp readability */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A130F]/90 via-[#1A130F]/25 to-transparent"
                  />

                  {/* Bottom overlay: White treatment name bottom-left, small outlined circular arrow bottom-right */}
                  <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 flex items-end justify-between gap-2.5">
                    <h3 className="font-sans text-[13px] sm:text-[14.5px] font-medium text-[#FFFFFF] leading-[1.25] tracking-[0.01em]">
                      {labelLines ? (
                        <>
                          <span className="block">{labelLines[0]}</span>
                          {labelLines[1] && <span className="block">{labelLines[1]}</span>}
                        </>
                      ) : (
                        treatment.shortTitle
                      )}
                    </h3>

                    <span
                      aria-hidden="true"
                      className="treatment-card-arrow w-7 h-7 rounded-full border border-white/75 group-hover:bg-[#E6CDB5] group-hover:border-[#E6CDB5] group-hover:text-[#211A17] text-white flex items-center justify-center shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
