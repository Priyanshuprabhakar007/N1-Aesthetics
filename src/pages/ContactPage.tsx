import React from 'react';
import { MapPin, Clock, Instagram, ArrowUpRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { siteContent } from '../content/site';
import { BookingSection } from '../components/BookingSection';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import { resolveWhatsappCtaState } from '../lib/mobileCta';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ClinicMapEmbed } from '../components/ClinicMapEmbed';
import styles from '../styles/luxury.module.css';

export function ContactPage() {
  const { contact } = siteContent;
  const { settings } = useCms();
  const whatsappState = resolveWhatsappCtaState(settings);

  const displayAddress = settings.address || contact.addressPlaceholder;
  const displayHours = settings.hours || contact.hoursPlaceholder;

  return (
    <>
      <SeoHead
        title="Contact & Book Consultation | N7 Aesthetics"
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
              the appointment request form below or connect directly for clinic coordination.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Two-Column Appointment Form & Contact Panel */}
      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          <SectionReveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 5 Cols: Clinic Coordination Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#211A17] text-[#F5EEE8] rounded-[24px] p-7 sm:p-9 space-y-6 border border-[#E6CDB5]/15 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[#E6CDB5]/75">
                    CLINIC COORDINATION
                  </span>
                  <h2 className="font-heading text-3xl text-[#F5EEE8] mt-1">
                    Location &amp; Consultation Hours
                  </h2>
                </div>

                <ul className="space-y-6 text-sm">
                  <li className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Clinic Address
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-1 block leading-relaxed">
                        {displayAddress}
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <Clock className="w-5 h-5 text-[#BA9876] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[#E6CDB5]/70">
                        Consultation Schedule
                      </span>
                      <span className="text-[#F5EEE8]/90 mt-1 block leading-relaxed">
                        {displayHours}
                      </span>
                    </div>
                  </li>
                </ul>

                {/* Refined Google Maps Embed (Light Mode Roadmap with Red Pin & Get Directions) */}
                <div className="pt-1">
                  <ClinicMapEmbed address={displayAddress} variant="dark" />
                </div>

                {/* Prominent, premium WhatsApp CTA */}
                <div className="pt-2">
                  {whatsappState.isAvailable && whatsappState.href ? (
                    <a
                      href={whatsappState.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat With Us on WhatsApp"
                      className="editorial-btn-lift w-full inline-flex items-center justify-center gap-2.5 bg-[#205C46] hover:bg-[#1A4B39] active:bg-[#163E2F] text-[#FFFFFF] font-medium text-sm px-6 py-4 rounded-[16px] shadow-sm transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6CDB5]"
                    >
                      <WhatsAppIcon className="w-5 h-5 text-[#FFFFFF] shrink-0" />
                      <span>Chat With Us on WhatsApp</span>
                      <ArrowUpRight className="w-4 h-4 text-[#FFFFFF] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ) : (
                    <div
                      aria-disabled="true"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#205C46]/50 text-[#FFFFFF]/80 text-xs sm:text-sm px-5 py-3.5 rounded-[16px] cursor-not-allowed select-none text-center"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-[#FFFFFF]/80 shrink-0" />
                      <span>Chat With Us on WhatsApp (Pending Confirmation)</span>
                    </div>
                  )}
                </div>

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
