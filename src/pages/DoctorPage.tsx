import React from 'react';
import { ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { siteContent } from '../content/site';
import { Link } from '../lib/router';
import { DoctorPortraitFrame } from '../components/DoctorPortraitFrame';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

export function DoctorPage() {
  const { doctor } = siteContent;

  return (
    <>
      <SeoHead
        title={`${doctor.name} — ${doctor.roleTitle}`}
        description={`Profile of ${doctor.name}, ${doctor.roleTitle} at N7 Aesthetics. Focused on anatomical harmony, ethical surgical planning, and personalised patient care.`}
        canonicalPath="/doctor"
      />

      {/* Profile Hero */}
      <section className="bg-[#F5EEE8] py-16 lg:py-24 border-b border-[#30251F]/12">
        <div className={styles.containerLuxury}>
          <SectionReveal className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 5 Cols: Reserved Portrait Frame (/public/media/doctor-portrait.jpg) */}
            <div className="lg:col-span-5">
              <DoctorPortraitFrame className="max-w-[420px]" />
            </div>

            {/* Right 7 Cols: Bio & Surgical Philosophy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.28em] text-[#30251F]/70 font-medium">
                  SURGEON PROFILE
                </span>
                <span className="h-px w-16 bg-[#30251F]/25" aria-hidden="true" />
              </div>

              <div>
                <h1 className={styles.heroHeadline}>{doctor.name}</h1>
                <p className="mt-2 text-lg font-secondary-heading text-[#30251F]">
                  {doctor.roleTitle} · N7 Aesthetics
                </p>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#30251F]/85 leading-relaxed">
                {doctor.extendedBio.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Unverified Credentials Disclosure Card */}
              <div className="rounded-[18px] bg-[#FAF5F0] border border-[#BA9876]/45 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#211A17]">
                  <ShieldAlert className="w-4 h-4 text-[#BA9876] shrink-0" />
                  <span>Credentials Verification Status</span>
                </div>
                <p className="text-xs text-[#30251F]/80 leading-relaxed">
                  {doctor.unverifiedCredentialsNotice}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#30251F]/10">
                  {doctor.verificationFields.map((field) => (
                    <div key={field.label} className="text-xs">
                      <span className="block text-[11px] text-[#30251F]/65">{field.label}</span>
                      <span className="font-medium text-[#211A17]">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/contact#book-consultation"
                  className="inline-flex items-center gap-2 bg-[#30251F] hover:bg-[#211A17] text-[#F5EEE8] text-sm font-medium px-7 py-4 rounded-full transition-colors"
                >
                  <span>Book Consultation with Dr. Singh</span>
                  <ArrowUpRight className="w-4 h-4 text-[#E6CDB5]" />
                </Link>
                <Link
                  href="/treatments"
                  className="inline-flex items-center gap-2 border border-[#30251F]/25 hover:border-[#30251F] text-[#211A17] text-sm font-medium px-6 py-4 rounded-full transition-colors"
                >
                  <span>View Procedures</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Clinical Philosophy Pillars */}
      <section className="bg-[#FAF5F0] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          <SectionReveal>
            <div className="max-w-2xl mb-10">
              <p className="text-xs uppercase tracking-[0.24em] text-[#30251F]/70 font-medium">
                CLINICAL PRINCIPLES
              </p>
              <h2 className={`${styles.sectionHeading} mt-2`}>
                How Consultations &amp; Surgical Planning Work
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {doctor.philosophyPoints.map((pt) => (
                <div
                  key={pt.title}
                  className="bg-[#F5EEE8] border border-[#30251F]/12 rounded-[18px] p-7 space-y-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#BA9876]" />
                  <h3 className="font-secondary-heading text-lg text-[#211A17] font-medium">
                    {pt.title}
                  </h3>
                  <p className="text-sm text-[#30251F]/80 leading-relaxed">{pt.detail}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
