import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import { SiteFooter } from '@/components/site-footer';
import { ThemeToggle } from '@/components/theme-toggle';

/** Shared shell for the legal pages (Privacy, Terms). */
export function LegalLayout({
  title,
  kicker,
  lastUpdated,
  children,
}: {
  title: string;
  kicker: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="container flex items-center justify-between py-5">
          {/* Wordmark already links to "/" — no outer <Link> (would nest <a>). */}
          <Wordmark size="sm" />
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/privacy" className="hover:text-ink hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink hover:underline">
              Terms
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        <Kicker className="mb-2">{kicker}</Kicker>
        <h1 className="font-sans text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {lastUpdated}</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-sans text-lg font-semibold">{heading}</h2>
      <div className="flex flex-col gap-2 text-muted">{children}</div>
    </section>
  );
}
