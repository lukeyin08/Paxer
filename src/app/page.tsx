import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SiteFooter } from '@/components/site-footer';

// Four error types Paxer hunts (Section 1 / one-pager).
const ERROR_TYPES = [
  {
    title: 'Duplicate & unbundled charges',
    body: 'The same service billed twice, or one procedure split into separately billed parts to inflate the total.',
  },
  {
    title: 'Cost-share miscalculations',
    body: 'Your deductible, coinsurance, and out-of-pocket max recomputed from your real plan, then checked against what you were charged.',
  },
  {
    title: 'Balance billing & surprise bills',
    body: 'Out-of-network and emergency charges billed above your in-network cost-share, a likely No Surprises Act violation.',
  },
  {
    title: 'Upcoding & overruns',
    body: 'Higher-intensity codes than the service described, and charges above the regional benchmark for the same code.',
  },
];

// Three submission channels (Section 7 / one-pager "how it works").
const CHANNELS = [
  {
    step: '01',
    title: 'Add your bill',
    body: 'Upload a medical bill or EOB, connect your insurer, or enter line items by hand. Paxer reads the document and extracts every charge.',
  },
  {
    step: '02',
    title: 'See the findings',
    body: 'The audit engine flags errors with the evidence and the math behind each one, plus an estimate of what may be recoverable.',
  },
  {
    step: '03',
    title: 'Recover your money',
    body: 'Paxer drafts the dispute letter or appeal. You review and approve. Paxer tracks deadlines until the money comes back.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="container flex h-16 items-center justify-between">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login?demo=1">View the demo</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-20 md:py-28">
          <div className="max-w-3xl animate-fade-up">
            <Kicker className="mb-5">Patient-side medical billing advocate</Kicker>
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink md:text-6xl">
              The only advocate on the patient&rsquo;s side of the bill.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Most tools fight insurance denials for the hospital, where the recovered dollars flow
              back to the provider. Paxer audits the bills and EOBs you actually receive, finds the
              errors everyone else is content to leave in place, and helps you recover your own
              money.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login?demo=1">View the demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Start a case</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stat blocks */}
        <section className="border-y border-rule bg-soft/40">
          <div className="container grid grid-cols-1 gap-8 py-12 sm:grid-cols-3">
            <StatBlock
              label="Of bills contain errors"
              value="80%"
              hint="Industry estimates put error rates on complex medical bills this high."
            />
            <StatBlock
              label="Average error size"
              value="$1,300"
              hint="Typical recoverable amount Paxer surfaces on a single audited case."
            />
            <StatBlock
              label="You keep"
              value="75%"
              hint="Paxer takes a share only of dollars actually returned to you."
            />
          </div>
        </section>

        {/* Error types */}
        <section className="container py-20">
          <Kicker className="mb-3">What Paxer finds</Kicker>
          <h2 className="max-w-2xl font-serif text-3xl font-semibold text-ink">
            Four kinds of error, hiding in plain sight.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
            {ERROR_TYPES.map((e) => (
              <div key={e.title} className="bg-card p-8">
                <h3 className="font-serif text-xl font-semibold text-ink">{e.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-rule bg-soft/40">
          <div className="container py-20">
            <Kicker className="mb-3">How it works</Kicker>
            <h2 className="max-w-2xl font-serif text-3xl font-semibold text-ink">
              From a confusing bill to money back, in three steps.
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {CHANNELS.map((c) => (
                <Card key={c.step}>
                  <CardContent className="pt-6">
                    <span className="font-mono text-sm text-accent">{c.step}</span>
                    <h3 className="mt-3 font-serif text-xl font-semibold text-ink">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold text-ink md:text-4xl">
            See what your bill is hiding.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Walk the full loop on a seeded demo case. No sign-up required.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/login?demo=1">View the demo</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
