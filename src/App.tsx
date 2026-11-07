/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { RouterProvider, useRouter } from './lib/router';
import { CmsProvider } from './context/CmsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { DoctorPage } from './pages/DoctorPage';
import { TreatmentsPage } from './pages/TreatmentsPage';
import { TreatmentDetailPage } from './pages/TreatmentDetailPage';
import { ResultsPage } from './pages/ResultsPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { ConsultationModalProvider } from './components/ConsultationModal';
import { MobileStickyCtaBar } from './components/MobileStickyCtaBar';
import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/gsap';

function AppRoutes() {
  const { pathname } = useRouter();
  const routeWrapperRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  useEffect(() => {
    const el = routeWrapperRef.current;
    if (!el) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prefersReducedMotion()) {
      ScrollTrigger.refresh();
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.36,
          ease: 'power2.out',
          clearProps: 'opacity,visibility',
          onComplete: () => {
            ScrollTrigger.refresh();
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [normalizedPath]);

  const renderPage = () => {
    if (normalizedPath === '/') return <HomePage />;
    if (normalizedPath === '/about') return <AboutPage />;
    if (normalizedPath === '/doctor') return <DoctorPage />;
    if (normalizedPath === '/treatments') return <TreatmentsPage />;
    if (normalizedPath.startsWith('/treatments/')) {
      const slug = normalizedPath.replace('/treatments/', '');
      return <TreatmentDetailPage slug={slug} />;
    }
    if (normalizedPath === '/results') return <ResultsPage />;
    if (normalizedPath === '/testimonials') return <TestimonialsPage />;
    if (normalizedPath === '/blog') return <BlogPage />;
    if (normalizedPath === '/contact') return <ContactPage />;
    if (normalizedPath === '/admin') return <AdminPage />;
    return <HomePage />;
  };

  return <div ref={routeWrapperRef}>{renderPage()}</div>;
}

export default function App() {
  return (
    <CmsProvider>
      <RouterProvider>
        <ConsultationModalProvider>
          {/*
            IMPORTANT: Do NOT apply overflow-x-hidden on this wrapper div.
            Per CSS Overflow Module Level 3, setting overflow-x: hidden on a non-root element
            forces computed overflow-y: auto, which creates a second vertical scrollbar
            whenever children animate along the Y axis. Horizontal clipping is handled
            at the document root via overflow-x: clip in index.css.
          */}
          <div className="min-h-screen flex flex-col bg-[#F5EEE8] text-[#211A17]">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-[#E6CDB5] focus:text-[#211A17] focus:px-4 focus:py-2 focus:rounded-full focus:text-xs focus:font-semibold"
            >
              Skip to main content
            </a>

            <Navbar />

            <main id="main-content" className="flex-1">
              <AppRoutes />
            </main>

            <Footer />
            <MobileStickyCtaBar />
          </div>
        </ConsultationModalProvider>
      </RouterProvider>
    </CmsProvider>
  );
}
