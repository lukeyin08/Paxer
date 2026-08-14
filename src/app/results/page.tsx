import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { ResultsMetrics } from '@/components/results/results-metrics';

const description =
  'Six months after launch: $12K in reported recoveries, 240 bills audited, a paying employer and API partner, and a $16K annual run-rate.';

export const metadata: Metadata = {
  title: 'Results',
  description,
  alternates: { canonical: '/results' },
  openGraph: { title: 'Results · Paxer', description, url: '/results' },
};

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-ink">Six months in, it works.</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              Paxer launched in December 2025. Since then, patients have used it to find real errors
              on real bills and get real money back, and employers and platforms have started paying
              to give it to their people.
            </p>
            <p className="mt-3 text-sm text-muted">
              Launched December 2025 · Figures as of June 2026
            </p>
          </div>
        </section>

        <ResultsMetrics />

        {/* Footnotes */}
        <section className="container border-t border-rule py-8">
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Figures are cumulative since launch unless noted, and rounded. Recoveries are reported
            by users and not independently verified; past results don&rsquo;t guarantee any
            individual outcome.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
