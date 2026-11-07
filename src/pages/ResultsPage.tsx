import React, { useState } from 'react';
import { ShieldCheck, ArrowUpRight, Camera, Lock } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { Image } from '../components/LuxuryImage';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import { prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

const RESULTS_HERO_IMAGE_SRC =
  '/assets/aistudio/4lcTsp6VIpbhCKmmB-e0q2KcuRpd75pZkNWAmOcI8jD-zdjC48Y97WtBMjjvm1JZJHDDftLJyUxm-SwQva6AJ2IQIopiCkL7ovEp_XSQa3PJo6ommu-WveBNRVNvsfBbmqo4QmGpVuNZwF8Er1Dc6lWQp8XneS90uMwmAtl3f_0Zt_47H9LWfBaoKCe2tyrQ_539a367c.jpg';

export function ResultsPage() {
  const { consentedResults } = useCms();
  const [selectedSlug, setSelectedSlug] = useState<string>('all');
  const [heroImageLoaded, setHeroImageLoaded] = useState(() => prefersReducedMotion());

  const categories = [
    { slug: 'all', title: 'All Categories' },
    ...siteContent.resultsGallery.placeholderCategories.map((c) => ({
      slug: c.slug,
      title: c.title.replace(' Archive', ''),
    })),
  ];

  const visiblePlaceholders =
    selectedSlug === 'all'
      ? siteContent.resultsGallery.placeholderCategories
      : siteContent.resultsGallery.placeholderCategories.filter((c) => c.slug === selectedSlug);

  return (
    <>
      <SeoHead
        title="Real Patient Results & Image Consent Policy"
        description="Clinical outcome gallery for N7 Aesthetics. Consented before-and-after patient photography is published strictly with documented patient authorization."
        canonicalPath="/results"
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        {/* Decorative right-aligned sculptural photography atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[45%] select-none"
        >
          <img
            src={RESULTS_HERO_IMAGE_SRC}
            alt=""
            fetchPriority="high"
            decoding="async"
            sizes="(min-width: 1024px) 45vw, 100vw"
            onLoad={() => setHeroImageLoaded(true)}
            className={`h-full w-full object-cover object-[78%_52%] brightness-[0.84] contrast-[1.04] saturate-[0.86] sepia-[0.06] transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
              heroImageLoaded
                ? 'opacity-25 sm:opacity-35 lg:opacity-85'
                : 'opacity-0'
            }`}
          />

          {/* Strong left-to-right dark espresso gradient keeping the left half uncluttered */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#211A17] via-[#211A17]/82 lg:via-[#211A17]/50 to-[#211A17]/22" />

          {/* Subtle top and bottom gradient blending into the section background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#211A17]/78 via-transparent to-[#30251F]/92" />

          {/* Warm chocolate-brown tonal wash */}
          <div className="absolute inset-0 bg-[#261C17]/24 mix-blend-multiply" />
        </div>

        <div className={`${styles.containerLuxury} relative z-10`}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                {siteContent.resultsGallery.eyebrow}
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Clinical Results &amp;{' '}
              <span className="italic text-[#E6CDB5]">Ethical Photography.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              {siteContent.resultsGallery.ethicalPolicyNote}
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          {/* Editorial Explanation of Image Consent & Content Management */}
          <div className="mb-10 rounded-[22px] bg-[#211A17] text-[#F5EEE8] p-6 sm:p-8 border border-[#E6CDB5]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs text-[#E6CDB5]">
                <ShieldCheck className="w-4 h-4 text-[#BA9876]" />
                <span className="uppercase tracking-[0.2em]">
                  Image Consent &amp; CMS Governance
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#F5EEE8]/85 leading-relaxed">
                {siteContent.resultsGallery.consentAndCmsExplanation}
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-[#E6CDB5] text-[#211A17] text-xs font-medium px-5 py-3 rounded-full whitespace-nowrap self-start lg:self-auto"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verify Cases in /admin</span>
            </Link>
          </div>

          {/* Filter Bar */}
          <div
            role="tablist"
            aria-label="Filter clinical archive categories"
            className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-[#30251F]/12"
          >
            {categories.map((cat) => {
              const active = selectedSlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedSlug(cat.slug)}
                  className={`px-5 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#30251F] text-[#F5EEE8]'
                      : 'bg-[#FAF5F0] text-[#30251F] border border-[#30251F]/15 hover:border-[#30251F]'
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>

          {consentedResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {consentedResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4 aspect-[16/9]">
                    <div className="rounded-xl overflow-hidden bg-[#30251F]">
                      <Image
                        src={item.beforeImage}
                        alt={`Pre-procedure — ${item.treatmentTitle}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden bg-[#30251F]">
                      <Image
                        src={item.afterImage}
                        alt={`Post-procedure — ${item.treatmentTitle}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#BA9876] font-medium">
                      Consented Case · Ref: {item.consentReference}
                    </span>
                    <h2 className="font-heading text-2xl text-[#211A17] mt-1">
                      {item.treatmentTitle}
                    </h2>
                    <p className="text-sm text-[#30251F]/80 mt-1">{item.clinicalNotes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SectionReveal className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visiblePlaceholders.map((cat) => (
              <div
                key={cat.slug}
                className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-6 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="grid grid-cols-2 gap-4 aspect-[16/9]">
                  <div className="rounded-2xl bg-[#EDE3D9] border border-dashed border-[#30251F]/25 flex flex-col items-center justify-center p-4 text-center">
                    <Camera className="w-5 h-5 text-[#BA9876] mb-2" />
                    <span className="text-[11px] uppercase tracking-widest text-[#30251F]/65">
                      Pre-Procedure
                    </span>
                    <span className="mt-1 text-xs font-medium text-[#211A17]">
                      {siteContent.resultsGallery.placeholderBadgeText}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#EDE3D9] border border-dashed border-[#30251F]/25 flex flex-col items-center justify-center p-4 text-center">
                    <Camera className="w-5 h-5 text-[#BA9876] mb-2" />
                    <span className="text-[11px] uppercase tracking-widest text-[#30251F]/65">
                      Post-Procedure
                    </span>
                    <span className="mt-1 text-xs font-medium text-[#211A17]">
                      {siteContent.resultsGallery.placeholderBadgeText}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs text-[#30251F] font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#BA9876] shrink-0" />
                    <span>{siteContent.resultsGallery.placeholderBadgeText}</span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17]">{cat.title}</h2>
                  <p className="text-sm text-[#30251F]/80 leading-relaxed">{cat.description}</p>
                </div>

                <div className="pt-4 border-t border-[#30251F]/10 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/treatments/${cat.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#211A17] hover:text-[#30251F]"
                  >
                    <span>Explore {cat.title.replace(' Archive', '')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/contact#book-consultation"
                    className="text-xs text-[#30251F]/75 hover:text-[#211A17] underline underline-offset-4"
                  >
                    Request In-Clinic Portfolio Review
                  </Link>
                </div>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
