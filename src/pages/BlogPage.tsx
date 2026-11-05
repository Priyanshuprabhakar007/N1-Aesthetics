import React from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { siteContent } from '../content/site';
import { Link } from '../lib/router';
import { SectionReveal } from '../components/SectionReveal';
import { SeoHead } from '../components/SeoHead';
import styles from '../styles/luxury.module.css';

export function BlogPage() {
  const { resourcesBlog } = siteContent;

  return (
    <>
      <SeoHead
        title="Clinical Resources & Patient Education Guides"
        description="Educational articles on plastic surgery consultation preparation, rhinoplasty healing, and natural hairline design principles from N7 Aesthetics."
        canonicalPath="/blog"
      />

      <section className="bg-gradient-to-b from-[#211A17] to-[#30251F] text-[#F5EEE8] py-16 lg:py-24 border-b border-[#E6CDB5]/15">
        <div className={styles.containerLuxury}>
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
