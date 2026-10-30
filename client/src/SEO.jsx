import { useEffect } from 'react';

const SITE_URL = 'https://mtm-ent.org';
const PAGE_METADATA = {
  '/': {
    title: 'MTM Enterprises | 3D Printing, Software, Websites & Tutoring',
    description: 'MTM Enterprises creates custom 3D prints, software applications, responsive websites, and personalized programming tutoring. Bring your ideas to life.',
    type: 'website',
  },
  '/about': {
    title: 'Meet Michael Mayhew | About MTM Enterprises',
    description: 'Meet Michael Mayhew, founder of MTM Enterprises. Discover his background in software engineering, education, custom 3D printing, and creative technology.',
    type: 'profile',
  },
  '/admin': {
    title: 'MTM Enterprises | Administration',
    description: 'Private MTM Enterprises administration.',
    type: 'website',
    noIndex: true,
  },
};

function upsertMeta(attribute, name, content) {
  let node = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

export default function SEO({ path = '/' }) {
  useEffect(() => {
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
    const meta = PAGE_METADATA[normalizedPath] || PAGE_METADATA['/'];
    const canonicalUrl = SITE_URL + (normalizedPath === '/' ? '/' : normalizedPath);
    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'robots', meta.noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:type', meta.type);
    upsertMeta('property', 'og:site_name', 'MTM Enterprises');
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', `${SITE_URL}/mtm-social-preview.jpg`);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', `${SITE_URL}/mtm-social-preview.jpg`);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const previous = document.getElementById('mtm-seo-jsonld');
    previous?.remove();
    if (!meta.noIndex) {
      const script = document.createElement('script');
      script.id = 'mtm-seo-jsonld';
      script.type = 'application/ld+json';
      const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'MTM Enterprises',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/mtm-logo-wide.webp`,
        description: 'Custom 3D printing, software development, website design, and programming tutoring.',
      };
      const webpage = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: meta.title,
        description: meta.description,
        url: canonicalUrl,
        isPartOf: { '@type': 'WebSite', url: `${SITE_URL}/`, name: 'MTM Enterprises' },
        about: { '@id': `${SITE_URL}/#organization` },
      };
      script.textContent = JSON.stringify([organization, webpage]);
      document.head.appendChild(script);
    }
  }, [path]);
  return null;
}
