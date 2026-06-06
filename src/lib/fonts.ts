import { Spectral, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

// Display / headings / wordmark (Section 5)
export const fontSerif = Spectral({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

// Body / UI
export const fontSans = Hanken_Grotesk({
  subsets: ['latin'],
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
