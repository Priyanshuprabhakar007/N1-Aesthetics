import React from 'react';
import { ArrowUpRight, ShieldCheck, CheckCircle2, FileCheck2, Lock } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

export function AboutPage() {
  const { settings } = useCms();

  return (
    <>
      <SeoHead
        title="About the Clinic, Ethics & Pre-Launch Checklist"
        description="Learn about N7 Aesthetics, our patient-first philosophy, consultation structure, and pre-launch clinical verification checklist."
        canonicalPath="/about"
      />

      <section className="bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        <div className={styles.containerLuxury}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                ABOUT N7 AESTHETICS
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Thoughtful Aesthetic Medicine,{' '}
              <span className="italic text-[#E6CDB5]">Grounded in Ethics.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              N7 Aesthetics is a plastic surgery, hair restoration, and aesthetic clinic associated
              with {settings.doctorName}. Our practice is built around anatomical harmony,
              individualised planning, and honest medical guidance.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-[#F5EEE8] py-16 lg:py-24 border-b border-[#30251F]/10">
        <div className={styles.containerLuxury}>
          <SectionReveal className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#30251F]/70 font-medium">
                OUR APPROACH
              </p>
              <h2 className={styles.sectionHeading}>
                Proportion, Safety, and Unhurried Consultation
              </h2>
              <p className="text-sm sm:text-base text-[#30251F]/85 leading-relaxed">
                Aesthetic procedures require both surgical precision and clear communication. Rather
                than offering trend-driven packages, every patient consultation at N7 Aesthetics
                evaluates underlying anatomy, tissue quality, and realistic long-term outcomes.
              </p>
              <div className="pt-3 flex flex-wrap gap-4">
                <Link
                  href="/doctor"
                  className="inline-flex items-center gap-2 bg-[#30251F] text-[#F5EEE8] hover:bg-[#211A17] text-xs font-medium px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Meet {settings.doctorName}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#E6CDB5]" />
                </Link>
                <Link
                  href="/treatments"
                  className="inline-flex items-center gap-2 border border-[#30251F]/25 hover:border-[#30251F] text-[#211A17] text-xs font-medium px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Explore Treatments</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {siteContent.whyChooseUs.items.map((item) => (
                <div
                  key={item.number}
                  className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[18px] p-7 space-y-3"
                >
                  <span className="font-heading text-2xl text-[#BA9876] font-semibold">
                    {item.number}.
                  </span>
                  <h3 className="font-secondary-heading text-lg text-[#211A17] font-medium">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#30251F]/80 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Complete Pre-Launch Verification Checklist Section */}
      <section id="verification-checklist" className="bg-[#FAF5F0] py-16 lg:py-24 border-b border-[#30251F]/10">
        <div className={styles.containerLuxury}>
          <SectionReveal className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-[#30251F]/70 font-medium">
                  DEPLOYMENT AUDIT
                </p>
                <h2 className={`${styles.sectionHeading} mt-2`}>
                  Items Requiring Clinic Verification Before Launch
                </h2>
                <p className="mt-2 text-sm text-[#30251F]/80 leading-relaxed">
                  Every unconfirmed credential, service scope, clinical image, and contact detail is
                  listed below and can be updated by authorised staff in <code className="font-mono">/admin</code>.
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-[#30251F] text-[#F5EEE8] text-xs font-medium px-5 py-3 rounded-full self-start lg:self-auto"
              >
                <Lock className="w-3.5 h-3.5 text-[#E6CDB5]" />
                <span>Open /admin CMS</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {siteContent.verificationChecklist.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F5EEE8] border border-[#30251F]/12 rounded-[18px] p-6 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#30251F]/70">
                    <span>{item.category}</span>
                    <span>Verification Required</span>
                  </div>
                  <h3 className="font-secondary-heading text-base font-medium text-[#211A17]">
                    {item.item}
                  </h3>
                  <p className="text-xs text-[#30251F]/80 leading-relaxed">
                    <strong>Current State:</strong> {item.currentPlaceholderState}
                  </p>
                  <p className="text-xs text-[#211A17] leading-relaxed">
                    <strong>Action Before Launch:</strong> {item.requiredActionBeforeLaunch}
                  </p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Ethical Content & Consent Policy */}
      <section id="ethics-policy" className="bg-[#F5EEE8] py-16 lg:py-20">
        <div className={styles.containerLuxury}>
          <SectionReveal className="bg-[#211A17] text-[#F5EEE8] rounded-[24px] p-8 sm:p-12 border border-[#E6CDB5]/15">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs text-[#E6CDB5]">
                  <ShieldCheck className="w-4 h-4 text-[#BA9876]" />
                  <span className="uppercase tracking-[0.2em]">Medical Communication Standards</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl text-[#F5EEE8]">
                  Zero Fabricated Claims or Unconsented Patient Media
                </h2>
                <p className="text-sm text-[#F5EEE8]/80 leading-relaxed">
                  {siteContent.resultsGallery.consentAndCmsExplanation}
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <Link
                  href="/contact#book-consultation"
                  className="inline-flex items-center gap-2 bg-[#E6CDB5] text-[#211A17] text-xs font-medium px-6 py-3.5 rounded-full"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Schedule Consultation</span>
                </Link>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
