import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { Image } from '../components/LuxuryImage';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import { prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

const TREATMENTS_HERO_IMAGE_SRC =
  '/assets/aistudio/WAAbfkXCglP5FqhafNVvh-kVnZ6Zh9pqqtbrkoz_0SEs1_37w2l-c2uDsvahWNcfsnJ9v5B6rbMxxQ3cLQJpsieUBOwJmKxuk-SSBmrA0lb0B4Bar1xddC_SPoMQIQviCvCOydUQmCxF70mlsVwgKvRNPUhh7L8aa98dWCTKz0webHfA6p61PV14VBnhz6gG_d1d67589.jpg';

export function TreatmentsPage() {
  const { treatments } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [heroImageLoaded, setHeroImageLoaded] = useState(() => prefersReducedMotion());

  const approvedTreatments = treatments.filter(
    (t) => t.approvalStatus === 'approved_by_clinic'
  );

  const categories = [
    'All',
    ...Array.from(new Set(approvedTreatments.map((t) => t.category))),
  ];

  const filteredTreatments =
    selectedCategory === 'All'
      ? approvedTreatments
      : approvedTreatments.filter((t) => t.category === selectedCategory);

  return (
    <>
      <SeoHead
        title="Treatments & Aesthetic Procedures"
        description="Explore Hair Transplant, Rhinoplasty, Gynecomastia Correction, Body Contouring, and Skin Rejuvenation consultations at N7 Aesthetics."
        canonicalPath="/treatments"
      />

      {/* Dark Luxury Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        {/* Seamless right-aligned editorial beauty profile background (illustrative campaign atmosphere) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[45%] select-none"
        >
          <img
            src={TREATMENTS_HERO_IMAGE_SRC}
            alt=""
            fetchPriority="high"
            decoding="async"
            sizes="(min-width: 1024px) 45vw, 100vw"
            onLoad={() => setHeroImageLoaded(true)}
            className={`h-full w-full -scale-x-100 object-cover object-[38%_34%] brightness-[0.88] contrast-[1.03] saturate-[0.94] transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
              heroImageLoaded
                ? 'opacity-25 sm:opacity-35 lg:opacity-88'
                : 'opacity-0'
            }`}
          />

          {/* Strong left-to-right dark espresso gradient blending smoothly into #211A17 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#211A17] via-[#211A17]/80 lg:via-[#211A17]/46 to-[#211A17]/20" />

          {/* Subtle top and bottom gradient blending into the section background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#211A17]/75 via-transparent to-[#30251F]/92" />
        </div>

        <div className={`${styles.containerLuxury} relative z-10`}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                TREATMENT DIRECTORY
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Signature Procedures &amp;{' '}
              <span className="italic text-[#E6CDB5]">Personalised Care.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              Every procedure at N7 Aesthetics begins with a comprehensive anatomical evaluation by{' '}
              {siteContent.doctor.name}. Explore our core surgical and aesthetic focus areas below.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Interactive Filter & Treatment Cards */}
      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          {approvedTreatments.length > 0 ? (
            <>
              {/* Interactive Category Filter Buttons */}
              <div
                role="tablist"
                aria-label="Filter treatments by category"
                className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-[#30251F]/12"
              >
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#30251F] text-[#F5EEE8]'
                          : 'bg-[#FAF5F0] text-[#30251F] border border-[#30251F]/15 hover:border-[#30251F]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <SectionReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTreatments.map((treatment) => (
                  <article
                    key={treatment.slug}
                    className={`bg-[#FAF5F0] border border-[#30251F]/12 ${styles.luxuryCard} overflow-hidden flex flex-col justify-between shadow-sm`}
                  >
                    <div>
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="block relative aspect-[4/3] overflow-hidden bg-[#30251F] group"
                      >
                        <Image
                          src={treatment.cardImage}
                          alt={treatment.imageAlt}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          fallbackLabel={treatment.shortTitle}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-[#211A17]/85 via-transparent to-transparent"
                        />
                        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                          <span className="text-xs text-[#E6CDB5] tracking-wide">
                            {treatment.category}
                          </span>
                          <span className="w-8 h-8 rounded-full bg-[#F5EEE8]/90 text-[#211A17] flex items-center justify-center">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>

                      <div className="p-6 sm:p-7 space-y-3">
                        <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17] font-medium">
                          <Link
                            href={`/treatments/${treatment.slug}`}
                            className="hover:text-[#30251F] transition-colors"
                          >
                            {treatment.title}
                          </Link>
                        </h2>

                        <p className="text-sm text-[#30251F]/80 leading-relaxed">
                          {treatment.summary}
                        </p>

                        {treatment.verificationStatus ===
                          'unconfirmed_requires_clinic_verification' && (
                          <div className="pt-2 flex items-start gap-2 text-xs text-[#30251F]/75 border-t border-[#30251F]/10">
                            <AlertCircle className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                            <span>
                              {treatment.verificationNote ||
                                'Specific modality availability subject to clinic confirmation.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 sm:px-7 pb-6 pt-3 border-t border-[#30251F]/10 flex items-center justify-between">
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#211A17] hover:text-[#30251F]"
                      >
                        <span>Procedure Overview</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/contact#book-consultation`}
                        className="text-xs text-[#30251F]/75 hover:text-[#211A17] underline underline-offset-4"
                      >
                        Inquire
                      </Link>
                    </div>
                  </article>
                ))}
              </SectionReveal>
            </>
          ) : (
            <SectionReveal className="max-w-2xl mx-auto bg-[#FAF5F0] border border-[#30251F]/12 rounded-[24px] p-8 sm:p-10 text-center space-y-4">
              <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17]">
                Personalised Aesthetic &amp; Surgical Consultations
              </h2>
              <p className="text-sm text-[#30251F]/80 leading-relaxed">
                Individual procedure guides are published as they receive final clinical approval.
                You may request a private General Aesthetic Consultation with{' '}
                {siteContent.doctor.name} directly below.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact#book-consultation"
                  className="editorial-btn-lift inline-flex items-center gap-2 bg-[#30251F] hover:bg-[#211A17] text-[#F5EEE8] text-xs font-medium px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Book Consultation</span>
                  <ArrowUpRight className="w-4 h-4 text-[#E6CDB5]" />
                </Link>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </>
  );
}
