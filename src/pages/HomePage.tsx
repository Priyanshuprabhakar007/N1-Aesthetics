import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
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
import {
  HERO_AUTOPLAY_INTERVAL_MS,
  HERO_CROSSFADE_DURATION_SEC,
  HERO_SLIDES,
  computeSlideAnnotationGeometry,
  getApprovedHeroSlides,
  type ComputedSlideAnnotationGeometry,
  type HeroSlideConfig,
} from '../lib/heroSlides';
import styles from '../styles/luxury.module.css';

interface FineLinePointerOverlayProps {
  slide: HeroSlideConfig;
  geometry: ComputedSlideAnnotationGeometry;
  reducedMotion: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

function FineLinePointerOverlay({
  slide,
  geometry,
  reducedMotion,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: FineLinePointerOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotGroupRef = useRef<SVGGElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pathEl = pathRef.current;
    const dotEl = dotGroupRef.current;
    const labelEl = labelRef.current;

    if (!pathEl) return;

    if (reducedMotion) {
      gsap.set(pathEl, { clearProps: 'strokeDasharray,strokeDashoffset,opacity,visibility' });
      if (dotEl) gsap.set(dotEl, { clearProps: 'transform,opacity,visibility' });
      if (labelEl) gsap.set(labelEl, { clearProps: 'transform,opacity,visibility' });
      return;
    }

    const totalLength =
      typeof pathEl.getTotalLength === 'function' ? Math.max(1, pathEl.getTotalLength()) : 260;

    const ctx = gsap.context(() => {
      if (labelEl) {
        gsap.fromTo(
          labelEl,
          { y: 5, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.52,
            ease: 'power3.out',
            delay: 0.14,
            clearProps: 'transform,opacity,visibility',
          }
        );
      }

      gsap.fromTo(
        pathEl,
        {
          strokeDasharray: totalLength,
          strokeDashoffset: totalLength,
          autoAlpha: 0.35,
        },
        {
          strokeDashoffset: 0,
          autoAlpha: 1,
          duration: 0.64,
          ease: 'power2.out',
          delay: 0.2,
          clearProps: 'strokeDasharray,strokeDashoffset,opacity,visibility',
        }
      );

      if (dotEl) {
        gsap.fromTo(
          dotEl,
          { scale: 0.5, autoAlpha: 0, transformOrigin: 'center center' },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.42,
            ease: 'power2.out',
            delay: 0.48,
            clearProps: 'transform,opacity,visibility',
          }
        );
      }
    });

    return () => ctx.revert();
  }, [slide.id, reducedMotion]);

  if (!geometry.showFacialPointer) {
    return null;
  }

  const isLeftAligned = geometry.labelAlign === 'left';

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      aria-hidden="false"
    >
      {/* Unified pixel-space SVG canvas containing BOTH the single continuous <path> connector and the hotspot dot */}
      <svg
        viewBox={`0 0 ${geometry.containerWidth} ${geometry.containerHeight}`}
        width={geometry.containerWidth}
        height={geometry.containerHeight}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d={geometry.svgPathD}
          fill="none"
          stroke="#E0C4AD"
          strokeOpacity="0.82"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g ref={dotGroupRef}>
          {/* Subtle 8.5px diameter champagne outline ring */}
          <circle
            cx={geometry.hotspotX}
            cy={geometry.hotspotY}
            r="4.25"
            fill="rgba(224, 196, 173, 0.08)"
            stroke="#E0C4AD"
            strokeOpacity="0.48"
            strokeWidth="0.85"
          />
          {/* Tiny 3.2px diameter warm champagne center dot */}
          <circle
            cx={geometry.hotspotX}
            cy={geometry.hotspotY}
            r="1.6"
            fill="#E0C4AD"
          />
        </g>
      </svg>

      {/* Editorial treatment callout anchored at the exact start coordinate (labelX, labelY) of the SVG path */}
      <div
        ref={labelRef}
        style={{
          left: `${geometry.labelX}px`,
          top: `${geometry.labelY}px`,
        }}
        className={`pointer-events-auto absolute -translate-y-1/2 ${
          isLeftAligned
            ? '-translate-x-full pr-3.5 text-right'
            : 'pl-3.5 text-left'
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link
          href={slide.route}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={`${slide.eyebrow.replace('·', '')} — Explore ${slide.heading}`}
          className="group inline-block rounded-sm py-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0C4AD]"
        >
          <span className="block font-sans text-[10px] lg:text-[10.5px] uppercase tracking-[0.24em] text-[#E0C4AD] drop-shadow-[0_1px_8px_rgba(18,13,11,0.88)] transition-colors duration-300 group-hover:text-[#F5F0E9]">
            {slide.eyebrow}
          </span>
          <span
            className={`mt-0.5 inline-flex items-center gap-1.5 font-heading text-[22px] lg:text-[26px] font-light tracking-[0.01em] text-[#F5F0E9] leading-tight drop-shadow-[0_2px_12px_rgba(18,13,11,0.92)] transition-colors duration-300 group-hover:text-[#E0C4AD] ${
              isLeftAligned ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span>{slide.heading}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#E0C4AD]/80 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}

export function HomePage() {
  const { settings, treatments } = useCms();
  const heroRef = useRef<HTMLElement>(null);

  const activeSlides = useMemo(() => {
    const approved = getApprovedHeroSlides(HERO_SLIDES, treatments);
    return approved.length > 0 ? approved : [HERO_SLIDES[0]];
  }, [treatments]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoverOrFocusPaused, setIsHoverOrFocusPaused] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [heroDimensions, setHeroDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth || 1440,
        height: Math.max(660, Math.round((window.innerHeight || 900) * 0.92)),
      };
    }
    return { width: 1440, height: 828 };
  });

  const safeIndex = currentIndex < activeSlides.length ? currentIndex : 0;
  const activeSlide = activeSlides[safeIndex] || activeSlides[0];

  // Track hero container dimensions via ResizeObserver so hotspot & connector stay image-anchored on resize
  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setHeroDimensions((prev) => {
          const nextW = Math.round(rect.width);
          const nextH = Math.round(rect.height);
          if (prev.width === nextW && prev.height === nextH) return prev;
          return { width: nextW, height: nextH };
        });
      }
    };

    updateDimensions();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(el);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const annotationGeometry = useMemo(
    () =>
      computeSlideAnnotationGeometry(
        activeSlide,
        heroDimensions.width,
        heroDimensions.height
      ),
    [activeSlide, heroDimensions.width, heroDimensions.height]
  );

  const goToSlide = useCallback(
    (index: number) => {
      if (activeSlides.length <= 1) return;
      const normalized = ((index % activeSlides.length) + activeSlides.length) % activeSlides.length;
      setCurrentIndex(normalized);
    },
    [activeSlides.length]
  );

  const goToNextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const goToPrevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Listen for document visibility and prefers-reduced-motion changes
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const handleVisibility = () => {
      setIsDocumentHidden(document.visibilityState === 'hidden');
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      setReducedMotion(mediaQuery.matches);
    };

    handleVisibility();
    handleMotionChange();

    document.addEventListener('visibilitychange', handleVisibility);
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Preload active and next slide images to prevent white flashes during transitions
  useEffect(() => {
    if (typeof window === 'undefined' || activeSlides.length <= 1) return;
    const nextIndex = (safeIndex + 1) % activeSlides.length;
    const nextSlide = activeSlides[nextIndex];
    if (!nextSlide?.imageSrc) return;

    const img = new window.Image();
    img.src = nextSlide.imageSrc;
  }, [safeIndex, activeSlides]);

  // Autoplay timer (every 5.5s when visible, not hovered/focused, and reduced-motion is off)
  useEffect(() => {
    if (
      reducedMotion ||
      isHoverOrFocusPaused ||
      isDocumentHidden ||
      activeSlides.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, HERO_AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion, isHoverOrFocusPaused, isDocumentHidden, activeSlides.length]);

  // Initial Hero Typography & Controls Entrance Sequence (GSAP Timeline)
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

        tl.from(
          '.gsap-hero-stage',
          {
            scale: 1.035,
            autoAlpha: 0,
            duration: 1.35,
            transformOrigin: '52% 40%',
            clearProps: 'transform,opacity,visibility',
          },
          0
        );

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

        tl.from(
          '.gsap-hero-tagline',
          {
            y: 14,
            autoAlpha: 0,
            duration: 0.82,
            clearProps: 'transform,opacity,visibility',
          },
          1.25
        );
      },
      heroEl
    );

    return () => mm.revert();
  }, []);

  const handleHeroKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrevSlide();
    }
  };

  return (
    <>
      <SeoHead
        title="Plastic & Cosmetic Surgery · Hair Restoration · Aesthetic Care"
        description="N7 Aesthetics — A private atelier for those who seek subtlety — not transformation. Plastic surgery and aesthetic care associated with Dr. Navjot Singh."
        canonicalPath="/"
      />

      {/* (1) FULL-BLEED EDITORIAL HERO — CINEMATIC 4-SLIDE BEAUTY SLIDESHOW */}
      <section
        ref={heroRef}
        aria-roledescription="carousel"
        aria-label="N7 Aesthetics Featured Aesthetic Procedures"
        onKeyDown={handleHeroKeyDown}
        className={styles.heroSection}
      >
        {/* Crossfading full-bleed photographic slide layers */}
        <div className="gsap-hero-stage pointer-events-none absolute inset-0 z-[1] bg-[#211A17]">
          {activeSlides.map((slide, index) => {
            const isActive = index === safeIndex;
            const useFallback = Boolean(failedImageIds[slide.id] && slide.fallbackImageSrc);
            const resolvedSrc = useFallback ? slide.fallbackImageSrc! : slide.imageSrc;
            const slideObjPos = slide.objectPosition[annotationGeometry.viewport];

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                style={{
                  transitionDuration: reducedMotion ? '0ms' : `${HERO_CROSSFADE_DURATION_SEC * 1000}ms`,
                }}
                className={`absolute inset-0 transition-opacity ease-out ${
                  isActive ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
                }`}
              >
                <img
                  src={resolvedSrc}
                  alt={slide.imageAlt}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (slide.fallbackImageSrc && !failedImageIds[slide.id]) {
                      setFailedImageIds((prev) => ({ ...prev, [slide.id]: true }));
                    }
                  }}
                  style={{
                    objectPosition: `${slideObjPos.x * 100}% ${slideObjPos.y * 100}%`,
                    transformOrigin: `${slide.imageAnnotation.hotspotU * 100}% ${slide.imageAnnotation.hotspotV * 100}%`,
                    transitionDuration: reducedMotion ? '0ms' : `${HERO_AUTOPLAY_INTERVAL_MS}ms`,
                    transform:
                      !reducedMotion && isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                  className={`h-full w-full object-cover select-none transition-transform ease-out will-change-transform ${slide.objectPositionClass}`}
                />
                {/* Subtle per-slide atmospheric grading keeping the face luminous and the edges dark */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 ${slide.atmosphereOverlayClass}`}
                />
              </div>
            );
          })}
        </div>

        {/* Subtle bottom-only readability vignette — keeps the model's face completely luminous and unobstructed */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] z-[3] bg-gradient-to-t from-[#1D1613]/78 via-[#1D1613]/26 to-transparent"
        />

        {/* SINGLE CONTINUOUS SVG CONNECTOR + IMAGE-ANCHORED HOTSPOT OVERLAY */}
        <FineLinePointerOverlay
          slide={activeSlide}
          geometry={annotationGeometry}
          reducedMotion={reducedMotion}
          onMouseEnter={() => setIsHoverOrFocusPaused(true)}
          onMouseLeave={() => setIsHoverOrFocusPaused(false)}
          onFocus={() => setIsHoverOrFocusPaused(true)}
          onBlur={() => setIsHoverOrFocusPaused(false)}
        />

        {/* FOREGROUND CONTENT: Bottom-left headline + CTAs & lower-right editorial atelier sentence + slide controls */}
        <div className="relative z-10 w-full h-full min-h-[660px] lg:min-h-[max(720px,92svh)] flex flex-col justify-end px-5 sm:px-8 lg:px-12 xl:px-16 pt-28 pb-10 sm:pb-12 lg:pb-14">
          <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Bottom-Left Quadrant: Natural / Proportion + CTAs */}
            <div className="max-w-[620px]">
              {/* Compact text-only treatment annotation when facial pointer is hidden (mobile or narrow viewports) */}
              {!annotationGeometry.showFacialPointer && (
                <div
                  className="gsap-hero-mobile-badge mb-5"
                  onTouchStart={() => setIsHoverOrFocusPaused(true)}
                  onTouchEnd={() => setIsHoverOrFocusPaused(false)}
                >
                  <Link
                    href={activeSlide.route}
                    aria-label={`${activeSlide.eyebrow.replace('·', '')} — Explore ${activeSlide.heading}`}
                    className="inline-flex items-center gap-2.5 border-b border-[#E0C4AD]/45 pb-1.5 text-[#F5F0E9]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E0C4AD]" aria-hidden="true" />
                    <span className="uppercase tracking-[0.2em] text-[10px] text-[#E0C4AD]">
                      {activeSlide.eyebrow}
                    </span>
                    <span className="text-[#E0C4AD]/45" aria-hidden="true">
                      —
                    </span>
                    <span className="font-heading text-lg font-light tracking-[0.01em] text-[#F5F0E9]">
                      {activeSlide.heading}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#E0C4AD]/80" />
                  </Link>
                </div>
              )}

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

              {/* 0.90s: Book Consultation (desktop/tablet only) & View Procedures reveal sequentially */}
              <div className="mt-5 sm:mt-6 md:mt-8 flex flex-wrap items-center gap-5 sm:gap-7">
                <div className="gsap-hero-cta hidden md:block">
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

            {/* Lower-Right Side: Editorial atelier sentence + refined luxury slide controls */}
            <div
              className="gsap-hero-tagline flex flex-col lg:items-end gap-5"
              onMouseEnter={() => setIsHoverOrFocusPaused(true)}
              onMouseLeave={() => setIsHoverOrFocusPaused(false)}
              onFocusCapture={() => setIsHoverOrFocusPaused(true)}
              onBlurCapture={() => setIsHoverOrFocusPaused(false)}
            >
              <p className="text-[13px] sm:text-[14px] text-[#F5F0E9]/82 font-light leading-[1.6] tracking-[0.01em] max-w-[30ch] lg:text-right">
                A private atelier for those who seek
                <br />
                subtlety — not transformation.
              </p>

              {/* Minimal champagne/ivory slide indicators & prev/next controls */}
              {activeSlides.length > 1 && (
                <div
                  role="group"
                  aria-label="Hero slideshow controls"
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    {activeSlides.map((slide, idx) => {
                      const isCurrent = idx === safeIndex;
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => goToSlide(idx)}
                          aria-label={`Slide ${slide.slideNumber}: ${slide.heading}`}
                          aria-current={isCurrent ? 'true' : undefined}
                          className={`group flex items-center gap-1.5 py-1.5 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5] ${
                            isCurrent
                              ? 'text-[#E6CDB5]'
                              : 'text-[#F5F0E9]/50 hover:text-[#F5F0E9]/85'
                          }`}
                        >
                          <span className="font-sans text-[10px] tracking-[0.2em]">
                            {slide.slideNumber}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`block h-[1px] transition-all duration-500 ${
                              isCurrent
                                ? 'w-7 bg-[#E6CDB5]'
                                : 'w-2.5 bg-[#F5F0E9]/30 group-hover:bg-[#F5F0E9]/60'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 pl-1 border-l border-[#E6CDB5]/20">
                    <button
                      type="button"
                      onClick={goToPrevSlide}
                      aria-label="Previous hero slide"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#E6CDB5]/30 text-[#F5F0E9]/80 hover:border-[#E6CDB5] hover:text-[#E6CDB5] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextSlide}
                      aria-label="Next hero slide"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#E6CDB5]/30 text-[#F5F0E9]/80 hover:border-[#E6CDB5] hover:text-[#E6CDB5] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
