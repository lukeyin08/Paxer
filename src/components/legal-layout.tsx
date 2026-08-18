import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { SiteFooter } from '@/components/site-footer';

/** Shared shell for the legal pages (Privacy, Terms). */
export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <div className="measure flex items-center justify-between py-5">
          {/* Wordmark already links to "/" — no outer <Link> (would nest <a>). */}
          <Wordmark size="sm" />
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link href="/privacy" className="px-2 py-2 underline hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="px-2 py-2 underline hover:text-ink">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main id="content" className="measure py-12">
        <div>
          <h1>{title}</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {lastUpdated}</p>
        </div>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2>{heading}</h2>
      <div className="flex flex-col gap-2 text-muted">{children}</div>
    </section>
  );
}
