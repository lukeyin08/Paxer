import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { fontSerif, fontSans, fontMono } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paxer — the advocate on the patient’s side of the bill',
  description:
    'Paxer audits the medical bills and EOBs you actually receive, finds the errors, and helps you recover your own money.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          fontSerif.variable,
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
