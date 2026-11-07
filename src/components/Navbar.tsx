import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ChevronDown, X, Shield } from 'lucide-react';
import { siteContent } from '../content/site';
import { useCms } from '../context/CmsContext';
import { Link, useRouter } from '../lib/router';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import { useConsultationModal } from './ConsultationModal';

const LEFT_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Treatments', href: '/treatments', hasDropdown: true },
  { label: 'Results', href: '/results' },
  { label: 'Resources', href: '/blog' },
];

export function Navbar() {
  const { pathname } = useRouter();
  const { treatments, role } = useCms();
  const { openConsultationForm } = useConsultationModal();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [treatmentsDropdownOpen, setTreatmentsDropdownOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Phase 3: 0.20s Navbar logo and navigation reveal with a soft upward fade
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-nav-reveal', {
        y: 12,
        autoAlpha: 0,
        duration: 0.82,
        delay: 0.2,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      });
    }, headerEl);

    return () => ctx.revert();
  }, []);

  // Animate Treatments dropdown menu when opened
  useEffect(() => {
    const panel = dropdownPanelRef.current;
    if (!treatmentsDropdownOpen || !panel || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel,
        { y: 8, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.26,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        }
      );
    }, panel);

    return () => ctx.revert();
  }, [treatmentsDropdownOpen]);

  // Animate Mobile/Site Navigation Drawer when opened
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!menuDrawerOpen || !drawer || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        drawer,
        { y: -10, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.32,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility',
        }
      );
      gsap.from('.gsap-drawer-item', {
        y: 10,
        autoAlpha: 0,
        duration: 0.36,
        stagger: 0.03,
        delay: 0.05,
        ease: 'power2.out',
        clearProps: 'transform,opacity,visibility',
      });
    }, drawer);

    return () => ctx.revert();
  }, [menuDrawerOpen]);

  useEffect(() => {
    setMenuDrawerOpen(false);
    setTreatmentsDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuDrawerOpen(false);
        setTreatmentsDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTreatmentsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isHeroOverlayPage = pathname === '/';

  return (
    <header
      ref={headerRef}
      className={`${
        isHeroOverlayPage ? 'fixed top-0 inset-x-0' : 'sticky top-0'
      } z-50 transition-all duration-300 ${
        isScrolled || menuDrawerOpen || !isHeroOverlayPage
          ? 'bg-[#211A17]/92 backdrop-blur-md border-b border-[#E6CDB5]/12'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="relative w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-[74px] lg:h-[86px] flex items-center justify-between">
        {/* LEFT: Navigation links Home, About, Treatments, Results, Resources */}
        <nav
          aria-label="Primary Navigation"
          className="gsap-nav-reveal hidden lg:flex items-center gap-7 xl:gap-8 z-10"
        >
          {LEFT_NAV_LINKS.map((item) => {
            const active = isActive(item.href);

            if (item.hasDropdown) {
              return (
                <div
                  key={item.href}
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={() => setTreatmentsDropdownOpen(true)}
                  onMouseLeave={() => setTreatmentsDropdownOpen(false)}
                >
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={item.href}
                      data-active={active ? 'true' : 'false'}
                      className={`editorial-nav-link text-[13px] tracking-[0.03em] transition-colors duration-300 whitespace-nowrap shrink-0 py-1 ${
                        active
                          ? 'text-[#F5F0E9] font-normal'
                          : 'text-[#F5F0E9]/80 hover:text-[#F5F0E9] font-light'
                      }`}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      aria-label="Toggle treatments menu"
                      aria-expanded={treatmentsDropdownOpen}
                      onClick={() => setTreatmentsDropdownOpen((prev) => !prev)}
                      className="p-0.5 text-[#F5F0E9]/75 hover:text-[#F5F0E9] focus-visible:outline-2 focus-visible:outline-[#E6CDB5] rounded cursor-pointer transition-transform duration-300"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          treatmentsDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {treatmentsDropdownOpen && (
                    <div
                      ref={dropdownPanelRef}
                      role="menu"
                      aria-label="Treatments Submenu"
                      className="absolute left-0 top-full pt-3 w-64 z-50"
                    >
                      <div className="bg-[#211A17]/98 backdrop-blur-xl border border-[#E6CDB5]/20 rounded-[14px] p-2.5 shadow-2xl">
                        {treatments
                          .filter((t) => t.approvalStatus === 'approved_by_clinic')
                          .map((treatment) => (
                            <Link
                              key={treatment.slug}
                              href={`/treatments/${treatment.slug}`}
                              role="menuitem"
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs text-[#F5F0E9]/85 hover:bg-[#30251F] hover:text-[#E6CDB5] transition-colors duration-250 group"
                            >
                              <span className="whitespace-nowrap truncate">
                                {treatment.shortTitle}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#BA9876] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                          ))}
                        <Link
                          href="/treatments"
                          role="menuitem"
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs text-[#F5F0E9]/85 hover:bg-[#30251F] hover:text-[#E6CDB5] transition-colors duration-250 group"
                        >
                          <span className="whitespace-nowrap truncate">All Procedures</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#BA9876] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                        <div className="my-1.5 border-t border-[#E6CDB5]/12" />
                        <Link
                          href="/doctor"
                          role="menuitem"
                          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-[#E6CDB5] hover:bg-[#30251F] transition-colors duration-250 font-medium group"
                        >
                          <span>Dr. Navjot Singh Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? 'true' : 'false'}
                className={`editorial-nav-link text-[13px] tracking-[0.03em] transition-colors duration-300 whitespace-nowrap shrink-0 py-1 ${
                  active
                    ? 'text-[#F5F0E9] font-normal'
                    : 'text-[#F5F0E9]/80 hover:text-[#F5F0E9] font-light'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile spacer on left so centered brand stays balanced on small screens */}
        <div className="lg:hidden w-8" aria-hidden="true" />

        {/* CENTER: N7 AESTHETICS in refined editorial typography */}
        <div className="gsap-nav-reveal lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-10">
          <Link
            href="/"
            aria-label="N7 Aesthetics — Home"
            className="inline-block font-serif text-[15px] sm:text-[17px] lg:text-[19px] tracking-[0.28em] uppercase text-[#F5F0E9] hover:text-[#E6CDB5] transition-colors duration-300 font-normal whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6CDB5]"
          >
            N7 AESTHETICS
          </Link>
        </div>

        {/* RIGHT: Book Consultation text CTA (with 2px hover upward lift) and minimalist hamburger icon */}
        <div className="gsap-nav-reveal flex items-center gap-5 sm:gap-7 z-10 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMenuDrawerOpen(false);
              setTreatmentsDropdownOpen(false);
              openConsultationForm();
            }}
            className="editorial-nav-link editorial-btn-lift hidden sm:inline-flex items-center text-[13px] tracking-[0.03em] text-[#F5F0E9]/90 hover:text-[#E6CDB5] font-light whitespace-nowrap py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6CDB5] cursor-pointer"
          >
            Book Consultation
          </button>

          <button
            type="button"
            aria-label={menuDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuDrawerOpen}
            aria-controls="editorial-nav-drawer"
            onClick={() => setMenuDrawerOpen((prev) => !prev)}
            className="inline-flex items-center justify-center w-9 h-9 text-[#F5F0E9]/90 hover:text-[#E6CDB5] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#E6CDB5] cursor-pointer"
          >
            {menuDrawerOpen ? (
              <X className="w-5 h-5 stroke-[1.5]" />
            ) : (
              /* Minimalist two-line editorial hamburger icon */
              <span className="flex flex-col items-end justify-center gap-[5px] w-5" aria-hidden="true">
                <span className="block w-5 h-[1.25px] bg-current transition-transform duration-300" />
                <span className="block w-3.5 h-[1.25px] bg-current transition-transform duration-300" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Accessible Navigation Drawer with smooth GSAP fade and slide transition */}
      {menuDrawerOpen && (
        <nav
          ref={drawerRef}
          id="editorial-nav-drawer"
          aria-label="Site Navigation Drawer"
          className="bg-[#211A17]/98 backdrop-blur-xl border-t border-[#E6CDB5]/15 px-5 sm:px-8 lg:px-16 py-6 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {siteContent.navigation.map((item) => (
                <li key={item.href} className="gsap-drawer-item">
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between py-3 text-base border-b border-[#E6CDB5]/10 transition-colors duration-250 group ${
                      isActive(item.href)
                        ? 'text-[#E6CDB5] font-medium'
                        : 'text-[#F5F0E9]/90 hover:text-[#E6CDB5]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#BA9876] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
              <li className="gsap-drawer-item">
                <Link
                  href="/doctor"
                  className={`flex items-center justify-between py-3 text-base border-b border-[#E6CDB5]/10 transition-colors duration-250 group ${
                    isActive('/doctor')
                      ? 'text-[#E6CDB5] font-medium'
                      : 'text-[#F5F0E9]/90 hover:text-[#E6CDB5]'
                  }`}
                >
                  <span>Dr. Navjot Singh Profile</span>
                  <ArrowUpRight className="w-4 h-4 text-[#BA9876] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
              <li className="gsap-drawer-item">
                <Link
                  href="/testimonials"
                  className={`flex items-center justify-between py-3 text-base border-b border-[#E6CDB5]/10 transition-colors duration-250 group ${
                    isActive('/testimonials')
                      ? 'text-[#E6CDB5] font-medium'
                      : 'text-[#F5F0E9]/90 hover:text-[#E6CDB5]'
                  }`}
                >
                  <span>Patient Reflections</span>
                  <ArrowUpRight className="w-4 h-4 text-[#BA9876] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
              <li className="gsap-drawer-item sm:col-span-2">
                <Link
                  href="/admin"
                  className={`flex items-center justify-between py-3 text-sm border-b border-[#E6CDB5]/10 transition-colors duration-250 group ${
                    isActive('/admin')
                      ? 'text-[#E6CDB5] font-medium'
                      : 'text-[#E6CDB5]/75 hover:text-[#E6CDB5]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#BA9876]" />
                    <span>
                      Clinic Admin CMS {role === 'admin' || role === 'editor' ? `(${role})` : ''}
                    </span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#BA9876] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
            </ul>

            <div className="gsap-drawer-item pt-2 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuDrawerOpen(false);
                  openConsultationForm();
                }}
                className="editorial-btn-lift w-full inline-flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#211A17] font-medium py-3.5 px-6 rounded-full text-sm cursor-pointer"
              >
                <span>Book Consultation</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
