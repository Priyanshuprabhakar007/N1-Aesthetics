import React from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { Image } from '../components/LuxuryImage';
import { BookingSection } from '../components/BookingSection';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

interface TreatmentDetailPageProps {
  slug: string;
}

export function TreatmentDetailPage({ slug }: TreatmentDetailPageProps) {
  const { treatments } = useCms();
  const treatment =
    treatments.find((t) => t.slug === slug) ||
    siteContent.treatments.find((t) => t.slug === slug);

  if (!treatment) {
    return (
      <section className="bg-[#F5EEE8] py-24">
        <div className={`${styles.containerLuxury} text-center max-w-xl space-y-5`}>
          <h1 className={styles.sectionHeading}>Treatment Page Not Found</h1>
          <p className="text-sm text-[#30251F]/80">
            The requested procedure guide could not be found. Explore our complete list of signature
            treatments below.
          </p>
          <Link
            href="/treatments"
            className="inline-flex items-center gap-2 bg-[#30251F] text-[#F5EEE8] text-xs font-medium px-6 py-3.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Treatments</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SeoHead
        title={`${treatment.title} Consultation & Overview`}
        description={`${treatment.summary} Learn about consultation focus, candidacy, and recovery planning with Dr. Navjot Singh at N7 Aesthetics.`}
        canonicalPath={`/treatments/${treatment.slug}`}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-14 lg:py-20 border-b border-[#E6CDB5]/15">
        <div className={styles.containerLuxury}>
          <div className="mb-6">
            <Link
              href="/treatments"
              className="inline-flex items-center gap-2 text-xs text-[#E6CDB5]/85 hover:text-[#E6CDB5] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Treatments</span>
              <span aria-hidden="true">·</span>
              <span>{treatment.category}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h1 className={styles.heroHeadline}>{treatment.title}</h1>
              <p className="text-base sm:text-lg text-[#F5EEE8]/85 leading-relaxed font-light max-w-2xl">
                {treatment.summary}
              </p>

              {treatment.verificationStatus === 'unconfirmed_requires_clinic_verification' && (
                <div className="rounded-2xl bg-[#211A17]/80 border border-[#BA9876]/45 p-4 flex items-start gap-3 max-w-xl">
                  <AlertCircle className="w-4 h-4 text-[#E6CDB5] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#E6CDB5]/90 leading-relaxed">
                    {treatment.verificationNote ||
                      'Specific protocol availability for this category is tagged for clinic confirmation.'}
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-4">
                <a
                  href="#book-consultation"
                  className="inline-flex items-center gap-2 bg-[#E6CDB5] hover:bg-[#dfbfa0] text-[#211A17] text-sm font-medium px-7 py-3.5 rounded-full transition-colors"
                >
                  <span>Schedule {treatment.shortTitle} Consultation</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <Link
                  href="/results"
                  className="inline-flex items-center gap-2 border border-[#E6CDB5]/35 hover:border-[#E6CDB5] text-[#F5EEE8] text-sm px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Clinical Results Policy</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="max-w-[360px] mx-auto aspect-[4/5] rounded-[22px] overflow-hidden border border-[#E6CDB5]/20">
                <Image
                  src={treatment.cardImage}
                  alt={treatment.imageAlt}
                  priority
                  sizes="(max-width: 1024px) 90vw, 360px"
                  fallbackLabel={treatment.shortTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-[#E6CDB5]/60">
                Illustrative concept graphic · Not an actual patient outcome photo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Details & Consultation Booking */}
      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left 7 Cols: Overview, Consultation Focus, Candidacy, Recovery, FAQs */}
            <SectionReveal className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <h2 className={styles.sectionHeading}>Clinical Overview</h2>
                <p className="text-sm sm:text-base text-[#30251F]/85 leading-relaxed">
                  {treatment.overview}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-6 space-y-3">
                  <h3 className="font-secondary-heading text-lg text-[#211A17] font-medium">
                    Consultation Focus
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#30251F]/85">
                    {treatment.consultationFocus.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-6 space-y-3">
                  <h3 className="font-secondary-heading text-lg text-[#211A17] font-medium">
                    Candidacy Considerations
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#30251F]/85">
                    {treatment.candidacyConsiderations.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-6 sm:p-7 space-y-2">
                <h3 className="font-secondary-heading text-lg text-[#211A17] font-medium">
                  Recovery &amp; Aftercare Planning
                </h3>
                <p className="text-sm text-[#30251F]/85 leading-relaxed">
                  {treatment.recoveryOverview}
                </p>
              </div>

              {treatment.faqs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-heading text-2xl sm:text-3xl text-[#211A17]">
                    Common Patient Questions
                  </h3>
                  <div className="space-y-4">
                    {treatment.faqs.map((faq) => (
                      <div
                        key={faq.question}
                        className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-6 space-y-2"
                      >
                        <h4 className="font-sans text-sm font-semibold text-[#211A17] flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#BA9876] shrink-0" />
                          <span>{faq.question}</span>
                        </h4>
                        <p className="text-sm text-[#30251F]/80 leading-relaxed pl-6">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionReveal>

            {/* Right 5 Cols: Pre-Selected Consultation Booking Form */}
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <BookingSection preselectedTreatment={treatment.slug} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
