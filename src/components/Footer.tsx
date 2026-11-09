import React, { useEffect, useRef } from 'react';
import { MapPin, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link } from '../lib/router';
import { resolveWhatsappCtaState } from '../lib/mobileCta';
import { WhatsAppIcon } from './WhatsAppIcon';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

const DEFAULT_CLINIC_ADDRESS = '1849, Sector 80, Mohali, Punjab 160062, India';

export function Footer() {
  const { settings, treatments } = useCms();
  const footerRef = useRef<HTMLElement>(null);
  const currentYear = 2026;

  const whatsappState = resolveWhatsappCtaState(settings);

  // Use confirmed CMS address if available and valid; otherwise default to verified clinic location
  const displayAddress =
    settings.address && !settings.address.includes('[') && settings.address.trim().length > 0
      ? settings.address.trim()
      : DEFAULT_CLINIC_ADDRESS;

  // Filter approved public treatments only
  const approvedTreatments = treatments.filter(
    (treatment) => treatment.approvalStatus === 'approved_by_clinic'
  );

  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-footer-col', {
        y: 14,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: {
          trigger: footerEl,
          start: 'top 90%',
          once: true,
        },
      });
    }, footerEl);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-[#211915] text-[#F4EAE2] border-t border-[#D4AD8F]/15"
      role="contentinfo"
    >
      <div
        className={`${styles.containerLuxury} pt-14 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:py-16`}
      >
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#D4AD8F]/15">
          {/* SECTION 1 — BRAND */}
          <div className="gsap-footer-col lg:col-span-4 space-y-4">
            <Link href="/" aria-label="N7 Aesthetics Home" className="inline-block">
              <img
                src={siteContent.brand.logos.gold}
                alt="N7 Aesthetics"
                width={140}
                height={58}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-[#BCA99B] leading-relaxed max-w-sm">
              Refined aesthetic care guided by thoughtful consultation and individualised planning.
            </p>
          </div>

          {/* SECTION 2 — EXPLORE */}
          <div className="gsap-footer-col lg:col-span-2 space-y-3.5">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#D4AD8F] font-sans font-medium">
              Explore
            </h2>
            <ul className="space-y-2 text-sm text-[#BCA99B]">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/treatments"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  Treatments
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  Expected Outcomes
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* SECTION 3 — SIGNATURE TREATMENTS (Approved treatments only) */}
          <div className="gsap-footer-col lg:col-span-3 space-y-3.5">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#D4AD8F] font-sans font-medium">
              Signature Treatments
            </h2>
            <ul className="space-y-2 text-sm text-[#BCA99B]">
              {approvedTreatments.map((treatment) => (
                <li key={treatment.slug}>
                  <Link
                    href={`/treatments/${treatment.slug}`}
                    className="hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4 inline-flex items-center gap-1.5"
                  >
                    <span>{treatment.shortTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 4 — VISIT & CONNECT */}
          <div className="gsap-footer-col lg:col-span-3 space-y-3.5">
            <h2 className="text-xs uppercase tracking-[0.22em] text-[#D4AD8F] font-sans font-medium">
              Visit &amp; Connect
            </h2>
            <ul className="space-y-3 text-xs text-[#BCA99B] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AD8F] shrink-0 mt-0.5" />
                <span>{displayAddress}</span>
              </li>

              {/* Verified WhatsApp link if confirmed in CMS settings */}
              {whatsappState.isAvailable && whatsappState.href && (
                <li className="pt-1">
                  <a
                    href={whatsappState.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with N7 Aesthetics on WhatsApp"
                    className="inline-flex items-center gap-2 text-xs text-[#D4AD8F] hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4 group"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#D4AD8F] shrink-0" />
                    <span>Chat With Us on WhatsApp</span>
                    <ArrowUpRight className="w-3 h-3 text-[#D4AD8F] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Legal & Medical Disclaimer */}
        <div className="gsap-footer-col pt-8 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-[#BCA99B]/80">
          <div className="space-y-1 max-w-2xl">
            <p className="flex items-center gap-1.5 text-[#D4AD8F]/90">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AD8F] shrink-0" />
              <span>
                Medical Disclaimer: Information on this website is educational and does not
                substitute an in-person consultation with a qualified medical specialist.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 shrink-0 text-xs">
            <Link
              href="/about#ethics-policy"
              className="text-[#BCA99B] hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
            >
              Clinical Ethics Policy
            </Link>
            <span className="text-[#D4AD8F]/40" aria-hidden="true">
              ·
            </span>
            <Link
              href="/contact#privacy-notice"
              className="text-[#BCA99B] hover:text-[#F4EAE2] transition-colors hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* BOTTOM FOOTER: Separate Bottom Row with Thin Divider */}
        <div className="gsap-footer-col pt-6 border-t border-[#D4AD8F]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#BCA99B] text-center sm:text-left">
          {/* LEFT */}
          <p>© {currentYear} N7 Aesthetics. All rights reserved.</p>

          {/* RIGHT: Designer Credit */}
          <p>
            Designed by{' '}
            <a
              href="https://www.digiexplodeai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AD8F] hover:underline underline-offset-4 transition-colors font-medium"
            >
              Digiexplode AI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
