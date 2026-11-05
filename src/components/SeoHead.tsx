import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
}

/**
 * Updates per-page <title>, meta description, OpenGraph, canonical URL,
 * and embeds strictly verified MedicalClinic / Physician Schema.org JSON-LD
 * (no invented ratings, review counts, or unverified phone/address).
 */
export function SeoHead({ title, description, canonicalPath }: SeoHeadProps) {
  useEffect(() => {
    const fullTitle = `${title} | N7 Aesthetics — Dr. Navjot Singh`;
    document.title = fullTitle;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        if (selector.includes('property="')) {
          const prop = selector.split('property="')[1]?.split('"')[0];
          if (prop) el.setAttribute('property', prop);
        } else if (selector.includes('name="')) {
          const name = selector.split('name="')[1]?.split('"')[0];
          if (name) el.setAttribute('name', name);
        } else if (selector.includes('rel="canonical"')) {
          el.setAttribute('rel', 'canonical');
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://n7aesthetics.example';
    const canonicalUrl = `${origin}${canonicalPath === '/' ? '' : canonicalPath}`;

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);

    // Verified-only Schema.org JSON-LD (never includes fake ratings, reviews, or unverified address/phone)
    const schemaId = 'n7-verified-schema-jsonld';
    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: 'N7 Aesthetics',
      url: canonicalUrl,
      description:
        'Plastic surgery, hair restoration, and aesthetic clinic associated with Dr. Navjot Singh.',
      medicalSpecialty: 'PlasticSurgery',
      employee: {
        '@type': 'Physician',
        name: 'Dr. Navjot Singh',
        medicalSpecialty: 'PlasticSurgery',
      },
    };

    scriptEl.textContent = JSON.stringify(schemaData);
  }, [title, description, canonicalPath]);

  return null;
}
