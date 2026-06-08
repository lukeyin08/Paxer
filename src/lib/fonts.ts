import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

// Single typeface for display + body + the wordmark — a clean, modern lockup
// that matches the Paxer logo (Section 5). Headings are differentiated by
// weight, size, and tight tracking rather than a separate serif family.
export const fontSans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

// Labels / kickers / numeric tags
export const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
