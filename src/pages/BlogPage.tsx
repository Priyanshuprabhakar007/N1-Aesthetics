import React, { useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { siteContent } from '../content/site';
import { Link } from '../lib/router';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import { prefersReducedMotion } from '../lib/gsap';
import styles from '../styles/luxury.module.css';

const RESOURCES_HERO_IMAGE_SRC =
  '/assets/aistudio/OFaG9oHggGVQf58SANTnYgaE0k0yNSPeVepyUQC63f9KmFAxAwLHnE1eHu9Rf_DdloImIqFkpdKEMo6r-YsLYj7MI-8aSjgVqQCKmYmZzMdlPKjaqeNVxz3H4nJJ9GZ1GUWdoz5JdF-1fyIhajsD7Yq-kuayvxKPWQGEINzLF2neCvo2ZlVM1Sbs_7-9MfCa_988c1439.jpg';

export function BlogPage() {
  const { resourcesBlog } = siteContent;
  const [heroImageLoaded, setHeroImageLoaded] = useState(() => prefersReducedMotion());

  return (
    <>
      <SeoHead
        title="Clinical Resources & Patient Education Guides"
        description="Educational articles on plastic surgery consultation preparation, rhinoplasty healing, and natural hairline design principles from N7 Aesthetics."
        canonicalPath="/blog"
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        {/* Seamless right-aligned editorial still-life background (open book, ivory paper & fountain pen on travertine) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[45%] select-none"
        >
          <img
            src={RESOURCES_HERO_IMAGE_SRC}
            alt=""
            fetchPriority="high"
            decoding="async"
            sizes="(min-width: 1024px) 45vw, 100vw"
            onLoad={() => setHeroImageLoaded(true)}
            className={`h-full w-full object-cover object-[28%_64%] brightness-[0.80] contrast-[1.04] saturate-[0.86] sepia-[0.08] transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
              heroImageLoaded
                ? 'opacity-25 sm:opacity-35 lg:opacity-84'
                : 'opacity-0'
            }`}
          />

          {/* Strong left-to-right dark espresso gradient blending smoothly into #211A17 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#211A17] via-[#211A17]/82 lg:via-[#211A17]/48 to-[#211A17]/55" />

          {/* Subtle top and bottom gradient blending into the section background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#211A17]/78 via-transparent to-[#30251F]/92" />

          {/* Warm espresso/taupe color-grading wash */}
          <div className="absolute inset-0 bg-[#261C17]/28 mix-blend-multiply" />
        </div>

        <div className={`${styles.containerLuxury} relative z-10`}>
          <SectionReveal className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-[#E6CDB5]/80 font-medium">
                {resourcesBlog.eyebrow}
              </span>
              <span className="h-px w-20 bg-[#E6CDB5]/30" aria-hidden="true" />
            </div>
            <h1 className={styles.heroHeadline}>
              Patient Education &amp;{' '}
              <span className="italic text-[#E6CDB5]">Clinical Guides.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#F5EEE8]/80 leading-relaxed font-light">
              {resourcesBlog.intro}
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-[#F5EEE8] py-16 lg:py-24">
        <div className={styles.containerLuxury}>
          <SectionReveal className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {resourcesBlog.articles.map((article) => (
              <article
                key={article.slug}
                className="bg-[#FAF5F0] border border-[#30251F]/12 rounded-[22px] p-7 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Unboxed metadata with typographic separators */}
                  <div className="flex items-center gap-2 text-xs text-[#30251F]/70">
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readingTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>Educational Guide</span>
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl text-[#211A17] leading-snug">
                    {article.title}
                  </h2>

                  <p className="text-sm text-[#30251F]/80 leading-relaxed">{article.excerpt}</p>

                  <div className="pt-3 border-t border-[#30251F]/10 space-y-2.5">
                    <p className="text-xs font-semibold text-[#211A17] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#BA9876]" />
                      <span>Key Clinical Takeaways</span>
                    </p>
                    <ul className="space-y-2 text-xs text-[#30251F]/80 leading-relaxed">
                      {article.keyTakeaways.map((takeaway) => (
                        <li key={takeaway} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#BA9876] shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#30251F]/10 flex items-center justify-between">
                  <Link
                    href="/contact#book-consultation"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#211A17] hover:text-[#30251F]"
                  >
                    <span>Discuss in Consultation</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/treatments"
                    className="text-xs text-[#30251F]/70 hover:text-[#211A17]"
                  >
                    Related Procedures
                  </Link>
                </div>
              </article>
            ))}
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
