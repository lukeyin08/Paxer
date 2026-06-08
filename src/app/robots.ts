import type { MetadataRoute } from 'next';

const SITE_URL = process.env.AUTH_URL || 'https://paxer.health';

// Allow the public marketing/legal pages; keep the authenticated app out of
// search indexes (it's behind login and holds personal data).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/api/', '/onboarding'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
