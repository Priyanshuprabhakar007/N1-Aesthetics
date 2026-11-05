import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { siteContent } from '../content/site';
import { Link } from '../lib/router';
import { TestimonialCarousel } from '../components/TestimonialCarousel';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

export function TestimonialsPage() {
  return (
    <>
      <SeoHead
        title="Patient Reflections & Consent Policy"
        description="Consented patient reflections at N7 Aesthetics. We publish verified patient stories strictly with documented consent and never fabricate testimonials."
        canonicalPath="/testimonials"
      />

      <section className="bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        <div className={styles.containerLuxury}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                {siteContent.testimonialsSection.eyebrow}
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Authentic Patient{' '}
              <span className="italic text-[#E6CDB5]">Reflections.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              {siteContent.testimonialsSection.emptyStateBody}
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={`${styles.containerLuxury} space-y-12`}>
          <SectionReveal>
            <TestimonialCarousel />
          </SectionReveal>

          <SectionReveal className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs text-[#30251F] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#BA9876]" />
                <span>Why This Section Shows an Empty State</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17]">
                Zero Fabricated Reviews or Star Scores
              </h2>
              <p className="text-sm text-[#30251F]/80 leading-relaxed">
                Many medical templates pre-fill websites with fictional quotes or unverified star
                ratings. At N7 Aesthetics, this carousel remains in a neutral state until verified,
                consented patient reflections are added to{' '}
                <code className="text-[#211A17] font-mono text-xs">
                  src/content/site.ts
                </code>
                .
              </p>
            </div>

            <Link
              href="/contact#book-consultation"
              className="inline-flex items-center gap-2 bg-[#30251F] hover:bg-[#211A17] text-[#F5EEE8] text-xs font-medium px-6 py-4 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <span>Schedule a Personal Consultation</span>
              <ArrowUpRight className="w-4 h-4 text-[#E6CDB5]" />
            </Link>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
