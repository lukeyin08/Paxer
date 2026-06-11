import type { Metadata } from 'next';
import { Kicker } from '@/components/brand/kicker';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { Reveal } from '@/components/reveal';
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
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <Kicker className="mb-4">Traction</Kicker>
            <h1 className="font-sans text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              Six months in, <span className="text-gradient">it works.</span>
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-muted">
              Paxer launched in December 2025. Since then, patients have used it to find real
              errors on real bills and get real money back, and employers and platforms have
              started paying to give it to their people.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">
              Launched December 2025 · Figures as of June 2026
            </p>
          </div>
        </section>

        <ResultsMetrics />

        {/* Footnotes */}
        <section className="container pb-20">
          <Reveal>
            <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">
              Figures are cumulative since launch unless noted, and rounded. Recoveries are
              reported by users and not independently verified; past results don&rsquo;t guarantee
              any individual outcome.
            </p>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
