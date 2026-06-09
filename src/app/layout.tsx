import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { fontSans, fontMono } from '@/lib/fonts';
import './globals.css';

const SITE_URL = process.env.AUTH_URL || 'https://paxer.app';
const TITLE = 'Paxer — the advocate on the patient’s side of the bill';
const DESCRIPTION =
  'Paxer audits your medical bills and EOBs, finds billing errors — overcharges, duplicates, denials, surprise bills — and drafts the dispute letters to get your money back. Your first audit is free.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Keyword-rich default for search; sub-pages append "· Paxer" via the template.
  title: {
    default: 'Paxer — Find & Dispute Medical Bill Errors',
    template: '%s · Paxer',
  },
  description: DESCRIPTION,
  applicationName: 'Paxer',
  keywords: [
    'medical bill audit',
    'dispute medical bill',
    'medical billing errors',
    'EOB review',
    'appeal a medical bill',
    'surprise medical bill',
    'No Surprises Act',
    'lower medical bill',
    'overcharged medical bill',
    'medical bill help',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Paxer',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Applies the saved theme (default: dark, the brand default) before first paint
// so there's no flash of the wrong theme. Light is opt-in via the toggle.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

// Structured data (schema.org) so search engines understand the brand + site.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Paxer',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: DESCRIPTION,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'ly3569@princeton.edu',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Paxer',
      description: DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'Paxer',
      url: SITE_URL,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '12',
        priceCurrency: 'USD',
        offerCount: 2,
        description:
          'First medical-bill audit free; Paxer Plus is a flat monthly subscription for unlimited audits and dispute letters — no contingency fee.',
      },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body
        // Browser extensions (Grammarly, etc.) inject attributes onto <body>
        // before React hydrates; suppress that one-level attribute mismatch.
        suppressHydrationWarning
        className={cn(
          fontSans.variable,
          fontMono.variable,
          'min-h-screen bg-paper text-ink',
        )}
      >
        {children}
      </body>
    </html>
  );
}
