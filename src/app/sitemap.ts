import type { MetadataRoute } from 'next';

const SITE_URL = process.env.AUTH_URL || 'https://paxer.health';

// Public, indexable routes only (the app is auth-gated and excluded in robots).
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/how-it-works', '/developers', '/pricing', '/login', '/privacy', '/terms'].map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.5,
  }));
}
