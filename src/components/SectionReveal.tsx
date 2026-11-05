import React, { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap';

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Unified GSAP + ScrollTrigger section reveal with React Strict Mode safe cleanup.
 * Never permanently hides content if JS fails or reduced motion is preferred.
 */
export function SectionReveal({ children, className = '', delay = 0 }: SectionRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: 18,
        autoAlpha: 0,
        duration: 0.72,
        delay,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
