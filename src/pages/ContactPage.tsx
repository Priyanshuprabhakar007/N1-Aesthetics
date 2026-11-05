import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldAlert, Instagram, ArrowUpRight } from 'lucide-react';
import { siteContent } from '../content/site';
import { BookingSection } from '../components/BookingSection';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

export function ContactPage() {
  const { contact } = siteContent;

  return (
    <>
      <SeoHead
        title="Contact & Book Consultation"
        description="Request a plastic surgery, hair restoration, or aesthetic consultation with Dr. Navjot Singh at N7 Aesthetics."
        canonicalPath="/contact"
      />

      {/* Dark Luxury Header */}
      <section className="bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-22 border-b border-[#E6CDB5]/15">
        <div className={styles.containerLuxury}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                APPOINTMENTS &amp; COORDINATION
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Book Your Private{' '}
              <span className="italic text-[#E6CDB5]">Consultation.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              Begin with an unhurried, one-on-one evaluation with {siteContent.doctor.name}. Use
              the appointment request form below or review clinic coordination placeholders.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Two-Column Appointment Form & Contact Panel */}
      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          <SectionReveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 5 Cols: Contact Panel with Clear Placeholders */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#211A17] text-[#F5EEE8] rounded-[24px] p-7 sm:p-9 space-y-6 border border-[#E6CDB5]/15">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[#E6CDB5]/75">
                    N7 AESTHETICS
                  </span>
                  <h2 className="font-heading text-3xl text-[#F5EEE8] mt-1">
                    Clinic Coordination Details
                  </h2>
                </div>

                <div className="rounded-2xl bg-[#30251F] border border-[#BA9876]/40 p-4 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-[#E6CDB5] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#E6CDB5]/90 leading-relaxed">
                    {contact.verificationBanner}
                  </p>
                </div>

                <ul className="space-y-5 text-sm">
                  <li className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Clinic Address
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-0.5 block">
                        {contact.addressPlaceholder}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <Phone className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Reception Telephone
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-0.5 block">
                        {contact.phonePlaceholder}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <Mail className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Coordination Email
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-0.5 block">
                        {contact.emailPlaceholder}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <Clock className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Consultation Schedule
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-0.5 block">
                        {contact.hoursPlaceholder}
                      </span>
                    </div>
                  </li>
                </ul>

                <div className="pt-4 border-t border-[#E6CDB5]/15">
                  <a
                    href={contact.instagramUrlPlaceholder}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-[#E6CDB5] hover:underline"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{contact.instagramHandlePlaceholder}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Elegant Appointment Form */}
            <div className="lg:col-span-7">
              <BookingSection />
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
