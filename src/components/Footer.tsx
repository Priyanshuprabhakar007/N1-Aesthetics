import React, { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Instagram,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  MessageCircle,
  Lock,
} from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

export function Footer() {
  const { settings, treatments } = useCms();
  const footerRef = useRef<HTMLElement>(null);
  const currentYear = new Date().getFullYear();
  const cleanDigitsPhone = settings.phone.replace(/[^0-9+]/g, '');
  const cleanDigitsWhatsapp = settings.whatsappNumber.replace(/[^0-9]/g, '');

  // PHASE 9 — FOOTER: Natural reveal without pinning or scroll trapping
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-footer-col', {
        y: 16,
        autoAlpha: 0,
        duration: 0.72,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: {
          trigger: footerEl,
          start: 'top 88%',
          once: true,
        },
      });
    }, footerEl);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#211A17] text-[#F5EEE8] border-t border-[#E6CDB5]/15">
      <div className={`${styles.containerLuxury} pt-16 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:py-16 lg:py-20`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#E6CDB5]/15">
          {/* Column 1: Brand & Ethical Commitment */}
          <div className="gsap-footer-col lg:col-span-4 space-y-5">
            <Link href="/" aria-label="N7 Aesthetics Home" className="inline-block">
              <img
                src={siteContent.brand.logos.gold}
                alt="N7 Aesthetics"
                width={150}
                height={62}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-[#F5EEE8]/75 leading-relaxed max-w-sm">
              Plastic surgery, hair restoration, and aesthetic care associated with{' '}
              <span className="text-[#E6CDB5]">{settings.doctorName}</span>. Grounded in anatomical
              proportion, patient safety, and transparent medical consultation.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <a
                href={siteContent.contact.instagramUrlPlaceholder}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="N7 Aesthetics on Instagram (placeholder link)"
                className="editorial-btn-lift inline-flex items-center gap-2 text-xs text-[#E6CDB5] opacity-85 hover:opacity-100 border border-[#E6CDB5]/25 hover:border-[#E6CDB5] px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap group"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{siteContent.contact.instagramHandlePlaceholder}</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="gsap-footer-col lg:col-span-2 space-y-4">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#BA9876] font-sans font-medium">
              Navigation
            </h2>
            <ul className="space-y-2.5 text-sm text-[#F5EEE8]/80">
              <li>
                <Link href="/" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  About the Clinic
                </Link>
              </li>
              <li>
                <Link href="/doctor" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  {settings.doctorName}
                </Link>
              </li>
              <li>
                <Link href="/results" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  Expected Outcomes
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  Patient Reflections
                </Link>
              </li>
              <li>
                <Link href="/blog" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  Clinical Resources
                </Link>
              </li>
              <li>
                <Link href="/contact" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
                  Contact &amp; Booking
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="editorial-footer-link hover:text-[#E6CDB5] transition-colors inline-flex items-center gap-1.5 text-[#E6CDB5]/90"
                >
                  <Lock className="w-3 h-3 text-[#BA9876]" />
                  <span>Admin CMS Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Signature Treatments (Only clinic-approved treatments shown publicly) */}
          <div className="gsap-footer-col lg:col-span-3 space-y-4">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#BA9876] font-sans font-medium">
              Signature Treatments
            </h2>
            <ul className="space-y-2.5 text-sm text-[#F5EEE8]/80">
              {treatments
                .filter((treatment) => treatment.approvalStatus === 'approved_by_clinic')
                .map((treatment) => (
                  <li key={treatment.slug}>
                    <Link
                      href={`/treatments/${treatment.slug}`}
                      className="editorial-footer-link hover:text-[#E6CDB5] transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{treatment.shortTitle}</span>
                    </Link>
                  </li>
                ))}
              <li>
                <Link
                  href="/contact#book-consultation"
                  className="editorial-footer-link hover:text-[#E6CDB5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>General Aesthetic Consultation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Editable Contact Placeholders & Confirmed Phone CTAs */}
          <div className="gsap-footer-col lg:col-span-3 space-y-4">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#BA9876] font-sans font-medium">
              Clinic Contact {settings.isPhoneConfirmed ? '' : '(Placeholders)'}
            </h2>
            <ul className="space-y-3 text-xs text-[#F5EEE8]/75 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#BA9876] shrink-0 mt-0.5" />
                <span>{settings.email}</span>
              </li>
            </ul>

            {settings.isPhoneConfirmed && cleanDigitsPhone.length >= 7 ? (
              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={`tel:${cleanDigitsPhone}`}
                  className="editorial-btn-lift inline-flex items-center gap-1.5 text-xs bg-[#E6CDB5] text-[#211A17] font-medium px-3.5 py-2 rounded-full transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Clinic</span>
                </a>
                {cleanDigitsWhatsapp.length >= 7 && (
                  <a
                    href={`https://wa.me/${cleanDigitsWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-btn-lift inline-flex items-center gap-1.5 text-xs border border-[#E6CDB5]/40 text-[#E6CDB5] px-3.5 py-2 rounded-full transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-[#E6CDB5]/60 pt-1 border-t border-[#E6CDB5]/10">
                {siteContent.contact.verificationBanner}
              </p>
            )}
          </div>
        </div>

        {/* Medical Disclaimer & Legal Links */}
        <div className="gsap-footer-col pt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-xs text-[#F5EEE8]/60">
          <div className="space-y-1.5 max-w-3xl">
            <p className="flex items-center gap-1.5 text-[#E6CDB5]/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BA9876] shrink-0" />
              <span>
                Medical Disclaimer: Information on this website is educational and does not substitute
                an in-person consultation with a qualified surgeon.
              </span>
            </p>
            <p>
              © {currentYear} {siteContent.brand.name}. Associated with {settings.doctorName}. All
              illustrative beauty assets are marked for layout demonstration only.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link href="/about#ethics-policy" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
              Clinical Ethics Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/about#verification-checklist" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
              Pre-Launch Checklist
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/contact#privacy-notice" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
              Privacy &amp; Consent
            </Link>
            <span aria-hidden="true">·</span>
            <a href="/sitemap.xml" className="editorial-footer-link hover:text-[#E6CDB5] transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
