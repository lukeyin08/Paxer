import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { ResultsMetrics } from '@/components/results/results-metrics';

const description =
  'Paxer results as of June 2026: $12,000 in reported recoveries, 240 bills audited, and a $16K annual run-rate.';

export const metadata: Metadata = {
  title: 'Results',
  description,
  alternates: { canonical: '/results' },
  openGraph: { title: 'Results · Paxer', description, url: '/results' },
};

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <MarketingHeader />
      <main id="content" className="flex-1">
        <section className="measure py-14">
          <div>
            <h1>Results</h1>
            <p className="mt-5 max-w-[58ch] text-lg leading-snug text-muted">
              Paxer launched in December 2025. The figures below are cumulative since launch and
              current as of June 2026.
            </p>
          </div>
        </section>

        <ResultsMetrics />

        {/* Footnotes */}
        <section className="measure border-t border-rule py-8">
          <p className="max-w-[70ch] text-xs leading-relaxed text-muted">
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
