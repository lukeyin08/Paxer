import { Newsreader } from 'next/font/google';

/**
 * One webfont, used for headings only: Newsreader, a text serif drawn for
 * long-form reading. Body copy and UI chrome stay on the system sans, which
 * keeps the payload to a single family and gives the page an editorial voice
 * rather than the geometric-grotesk look every template ships with.
 */
export const fontSerif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-serif',
  display: 'swap',
});
