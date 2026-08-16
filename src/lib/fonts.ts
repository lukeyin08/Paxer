import { Space_Grotesk } from 'next/font/google';

/**
 * One family for the whole site, the way the reference design does it: a
 * geometric grotesk with enough character in the letterforms to carry a very
 * large, very tight headline without looking like a default UI font.
 */
export const fontSans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
