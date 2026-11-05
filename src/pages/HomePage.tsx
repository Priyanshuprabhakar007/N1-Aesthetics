import React, { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { TrustStripIcon } from '../components/ClinicIcons';
import { DoctorSection } from '../components/DoctorSection';
import { SignatureTreatments } from '../components/SignatureTreatments';
import { WhyChooseSection } from '../components/WhyChooseSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { ResultsSection } from '../components/ResultsSection';
import { BookingSection } from '../components/BookingSection';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

export function HomePage() {
  const { settings } = useCms();
  const heroRef = useRef<HTMLElement>(null);

  // PHASE 3 — CINEMATIC HERO SEQUENCE (GSAP Timeline + matchMedia)
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
      },
      (context) => {
        const { isMobile } = context.conditions as { isDesktop: boolean; isMobile: boolean };
        const timeScale = isMobile ? 1.25 : 1;

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
        });
        tl.timeScale(timeScale);

        // 0.00s: Hero image begins a subtle cinematic reveal (opacity 0 -> 1, scale 1.055 -> 1 over 1.4s)
        tl.from(
          '.gsap-hero-image',
          {
            scale: 1.055,
            autoAlpha: 0,
            duration: 1.4,
            transformOrigin: '52% 40%',
            clearProps: 'transform,opacity,visibility',
          },
          0
        );

        // 0.35s: The word "Natural" reveals vertically from a clipped text wrapper
        tl.from(
          '.gsap-hero-line-1',
          {
            yPercent: 108,
            autoAlpha: 0,
            duration: 0.9,
            clearProps: 'transform,opacity,visibility',
          },
          0.35
        );

        // 0.55s: The word "Proportion" reveals with a slightly slower masked upward animation
        tl.from(
          '.gsap-hero-line-2',
          {
            yPercent: 108,
            autoAlpha: 0,
            duration: 1.05,
            clearProps: 'transform,opacity,visibility',
          },
          0.55
        );

        // 0.90s: Book Consultation and View Procedures buttons reveal sequentially
        tl.from(
          '.gsap-hero-cta',
          {
            y: 15,
            autoAlpha: 0,
            duration: 0.72,
            stagger: 0.12,
            clearProps: 'transform,opacity,visibility',
          },
          0.9
        );

        // 1.15s: The Rhinoplasty annotation frame draws its outline, followed by the label appearing
        tl.fromTo(
          '.gsap-rhinoplasty-rect',
          {
            strokeDasharray: 480,
            strokeDashoffset: 480,
          },
          {
            strokeDashoffset: 0,
            duration: 0.72,
            ease: 'power2.inOut',
          },
          1.15
        );

        tl.from(
          '.gsap-rhinoplasty-label',
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            y: -4,
            autoAlpha: 0,
            duration: 0.52,
            ease: 'power3.out',
            clearProps: 'clipPath,transform,opacity,visibility',
          },
          1.48
        );

        // Mobile compact badge reveal
        tl.from(
          '.gsap-hero-mobile-badge',
          {
            y: 10,
            autoAlpha: 0,
            duration: 0.6,
            clearProps: 'transform,opacity,visibility',
          },
          0.3
        );

        // 1.35s: The small editorial tagline on the right gently fades into position
        tl.from(
          '.gsap-hero-tagline',
          {
            y: 14,
            autoAlpha: 0,
            duration: 0.82,
            clearProps: 'transform,opacity,visibility',
          },
          1.35
        );
      },
      heroEl
    );

    return () => mm.revert();
  }, []);

  return (
    <>
      <SeoHead
        title="Plastic & Cosmetic Surgery · Hair Restoration · Aesthetic Care"
        description="N7 Aesthetics — A private atelier for those who seek subtlety — not transformation. Plastic surgery and aesthetic care associated with Dr. Navjot Singh."
        canonicalPath="/"
      />

      {/* (1) FULL-BLEED EDITORIAL HERO — NATURAL PROPORTION */}
      <section ref={heroRef} className={styles.heroSection}>
        {/* 0.00s: Single full-bleed hero photograph covering the entire hero area */}
        <div className="gsap-hero-image pointer-events-none absolute inset-0 z-[1] will-change-transform">
          <img
            src={siteContent.hero.portraitImage}
            alt={siteContent.hero.portraitAlt}
            fetchPriority="high"
            decoding="sync"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[64%_center] sm:object-[58%_center] lg:object-[center_20%] select-none"
          />
        </div>

        {/* Subtle bottom-only readability vignette — keeps the model's face completely luminous and unobstructed */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] z-[2] bg-gradient-to-t from-[#1D1613]/70 via-[#1D1613]/22 to-transparent"
        />

        {/* 1.15s: RHINOPLASTY ANNOTATION FRAME + LABEL */}
        <div className="hidden sm:block absolute z-20 sm:left-[50%] sm:top-[41%] lg:left-[49.5%] lg:top-[41%]">
          <Link
            href={siteContent.hero.defaultFloatingCard.href}
            aria-label={`${siteContent.hero.defaultFloatingCard.label} — ${siteContent.hero.defaultFloatingCard.procedureName}`}
            className="block w-[118px] lg:w-[136px] group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6CDB5]"
          >
            {/* Thin white outlined rectangular frame placed over the nose and lower cheek — animated stroke draw */}
            <div className="relative h-[88px] lg:h-[104px] w-full bg-transparent">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                aria-hidden="true"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="calc(100% - 1px)"
                  height="calc(100% - 1px)"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.82)"
                  strokeWidth="1"
                  className="gsap-rhinoplasty-rect transition-colors duration-300 group-hover:stroke-white"
                />
              </svg>
            </div>

            {/* Small solid ivory treatment label attached directly beneath the outlined region */}
            <div className="gsap-rhinoplasty-label bg-[#F5F0E9] px-3 py-2 text-[#211A17] transition-colors duration-300 group-hover:bg-[#FFFFFF]">
              <span className="block text-[9.5px] uppercase tracking-[0.14em] text-[#211A17]/60 leading-tight">
                {siteContent.hero.defaultFloatingCard.label}
              </span>
              <span className="block font-sans text-[12.5px] lg:text-[13px] font-medium text-[#211A17] leading-snug mt-0.5">
                {siteContent.hero.defaultFloatingCard.procedureName}
              </span>
            </div>
          </Link>
        </div>

        {/* FOREGROUND CONTENT: Bottom-left headline + CTAs & lower-right editorial atelier sentence */}
        <div className="relative z-10 w-full h-full min-h-[660px] lg:min-h-[max(720px,92svh)] flex flex-col justify-end px-5 sm:px-8 lg:px-12 xl:px-16 pt-28 pb-10 sm:pb-12 lg:pb-14">
          <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Bottom-Left Quadrant: Natural / Proportion + CTAs */}
            <div className="max-w-[620px]">
              {/* Mobile-friendly compact Rhinoplasty callout on small screens (<640px) so the face remains uncovered */}
              <div className="gsap-hero-mobile-badge sm:hidden mb-5">
                <Link
                  href={siteContent.hero.defaultFloatingCard.href}
                  className="inline-flex items-center gap-2.5 bg-[#F5F0E9] text-[#211A17] px-3 py-1.5 text-xs"
                >
                  <span className="uppercase tracking-[0.14em] text-[10px] text-[#211A17]/65">
                    {siteContent.hero.defaultFloatingCard.label}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#211A17]/35" aria-hidden="true" />
                  <span className="font-medium">{siteContent.hero.defaultFloatingCard.procedureName}</span>
                </Link>
              </div>

              {/* 0.35s & 0.55s: Clipped vertical text reveal for Natural / Proportion */}
              <h1 className={styles.heroHeadline}>
                <span className="editorial-mask-line pb-1">
                  <span className="gsap-hero-line-1 block text-[#F5F0E9] font-light will-change-transform">
                    {siteContent.hero.headlineLine1}
                  </span>
                </span>
                <span className="editorial-mask-line pb-2 -mt-1">
                  <span className="gsap-hero-line-2 block italic text-[#E6CDB5] font-light mt-0.5 will-change-transform">
                    {siteContent.hero.headlineItalicLine2}
                  </span>
                </span>
              </h1>

              {/* 0.90s: Book Consultation & View Procedures reveal sequentially */}
              <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-5 sm:gap-7">
                <div className="gsap-hero-cta">
                  <Link
                    href={siteContent.hero.primaryCta.href}
                    className="editorial-btn-lift inline-flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F0E9] text-[#211A17] font-normal text-xs sm:text-[13px] tracking-[0.03em] px-6 sm:px-7 py-3.5 rounded-full whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
                  >
                    <span>{siteContent.hero.primaryCta.label}</span>
                  </Link>
                </div>

                <div className="gsap-hero-cta">
                  <Link
                    href={siteContent.hero.secondaryCta.href}
                    className="editorial-nav-link inline-flex items-center gap-2 text-xs sm:text-[13px] tracking-[0.03em] text-[#F5F0E9]/90 hover:text-[#E6CDB5] font-light transition-colors duration-300 whitespace-nowrap py-1 border-b border-[#F5F0E9]/35 hover:border-transparent"
                  >
                    <span>{siteContent.hero.secondaryCta.label}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 1.35s: Lower-Right Side small editorial atelier sentence */}
            <p className="gsap-hero-tagline text-[13px] sm:text-[14px] text-[#F5F0E9]/82 font-light leading-[1.6] tracking-[0.01em] max-w-[30ch] lg:text-right">
              A private atelier for those who seek
              <br />
              subtlety — not transformation.
            </p>
          </div>
        </div>
      </section>

      {/* (2) IVORY TRUST VALUE STRIP (No fake numbers or unverifiable claims) */}
      <section
        aria-label="Clinical Commitments"
        className="bg-[#F5EEE8] border-b border-[#30251F]/12 py-6 sm:py-8"
      >
        <div className={styles.containerLuxury}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0 lg:divide-x lg:divide-[#30251F]/12">
            {siteContent.trustStrip.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 lg:px-7 first:lg:pl-0 last:lg:pr-0"
              >
                <div className="text-[#30251F] shrink-0">
                  <TrustStripIcon iconKey={item.iconKey} className="w-9 h-9 sm:w-10 sm:h-10" />
                </div>
                <div>
                  <h2 className="font-sans text-sm font-semibold text-[#211A17] leading-snug">
                    {item.title}
                  </h2>
                  <p className="text-xs text-[#30251F]/80 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* (3) SECTION 1: MEET DR. NAVJOT SINGH (Full-width horizontal 3-column section) */}
      <DoctorSection />

      {/* (4) SECTION 2: OUR SIGNATURE TREATMENTS (Separate full-width horizontal section directly below) */}
      <SignatureTreatments />

      {/* (5) SECTION 1 — WHY CHOOSE N7 AESTHETICS? (Compact centered heading + 4 minimalist icon columns with vertical dividers) */}
      <WhyChooseSection />

      {/* (6) SECTION 2 — PATIENT TESTIMONIALS (Full-width dark chocolate band with left portrait & 2 ivory review cards immediately below Why Choose) */}
      <TestimonialsSection />

      {/* (7) REAL RESULTS (Compact full-width horizontal results gallery) */}
      <ResultsSection />

      {/* (8) CONSULTATION FORM + CONTACT COORDINATION SECTION */}
      <section className="bg-[#F5EEE8] py-14 sm:py-20 lg:py-24">
        <div className={styles.containerLuxury}>
          <SectionReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 5 Cols: Contact Coordination Strip */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                <div className="rounded-[24px] bg-[#FAF5F0] border border-[#30251F]/12 p-6 sm:p-8 h-full flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30251F]/10">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.22em] text-[#30251F]/70 font-medium">
                        CLINIC COORDINATION
                      </span>
                      <h3 className="font-heading text-2xl text-[#211A17] mt-0.5">
                        Location, Phone &amp; Hours {settings.isPhoneConfirmed ? '' : '(Placeholders)'}
                      </h3>
                    </div>
                    <Link
                      href="/contact"
                      className="editorial-dark-link inline-flex items-center gap-1.5 text-xs font-medium text-[#30251F] hover:text-[#211A17] whitespace-nowrap"
                    >
                      <span>Contact Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#211A17]">Clinic Address</p>
                        <p className="text-[#30251F]/75 mt-0.5">{settings.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#211A17]">Reception Phone</p>
                        <p className="text-[#30251F]/75 mt-0.5">{settings.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#211A17]">Hours</p>
                        <p className="text-[#30251F]/75 mt-0.5">{settings.hours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: Responsive Consultation Form */}
              <div className="lg:col-span-7">
                <BookingSection compact />
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
