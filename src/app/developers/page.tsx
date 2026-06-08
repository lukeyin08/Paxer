import type { Metadata } from 'next';
import Link from 'next/link';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { API_BUYERS } from '@/lib/marketing';

export const metadata: Metadata = {
  title: 'Developers — Audit API',
  description:
    'Paxer’s medical-bill audit engine as an API. Send line items, get back the errors — duplicates, cost-share mistakes, denials, balance billing, and more.',
};

const DETECTS = [
  ['Duplicate charges', 'The same service billed twice on one bill or across providers.'],
  ['Cost-share errors', 'Deductible / coinsurance / copay computed wrong against the plan.'],
  ['Denials & coordination of benefits', 'PR-22 and other reason codes that shift a denial onto the patient.'],
  ['Balance billing (NSA)', 'Out-of-network amounts billed above the allowed/protected rate.'],
  ['Unbundling', 'Codes billed separately that should be a single bundled charge (NCCI).'],
  ['Implausible charges', 'Amounts wildly out of line with what the service plausibly costs.'],
];

const CURL = `curl -X POST https://paxer.app/api/v1/audit \\
  -H "Authorization: Bearer pax_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "lineItems": [
      { "description": "CT scan, head", "cptHcpcsCode": "70450",
        "chargeAmount": 1200, "allowedAmount": 900, "planPaid": 0,
        "patientResponsibility": 900, "adjustmentCodes": ["PR-22"] }
    ]
  }'`;

const RESPONSE = `{
  "findings": [
    {
      "type": "NON_COVERED_BILLED_TO_PATIENT",
      "severity": "HIGH",
      "title": "Denial billed to you — coordination-of-benefits denial (reason code PR-22): CT scan, head",
      "explanation": "Your plan allowed $900 but paid $0, and the full $900 was passed to you under a PR-22 coordination-of-benefits denial. Denials like this are frequently reversed.",
      "recommendedNextStep": "Submit the primary plan's EOB to this insurer, or call to correct your coordination-of-benefits record so the claim reprocesses. Do not pay until it is reprocessed.",
      "estimatedRecovery": 900,
      "confidence": 0.75,
      "detector": "RULE",
      "lineItemIndex": 0
    }
  ],
  "summary": {
    "findingCount": 1,
    "estimatedRecoverable": 900
  },
  "usage": {
    "plan": "free",
    "used": 1,
    "quota": 100
  }
}`;

const ERROR_CODES: [string, string][] = [
  ['200', 'Findings returned. summary.estimatedRecoverable is capped so it never exceeds total patient responsibility.'],
  ['400', 'Invalid request body — e.g. missing or malformed lineItems. The response “error” field explains.'],
  ['401', 'Missing or invalid API key. Send it as Authorization: Bearer pax_live_… (or the x-api-key header).'],
  ['402', 'Monthly quota exceeded — this calendar month’s audit allotment is used up. Upgrade for a higher quota.'],
  ['429', 'Rate limited (120 requests/min per key). Retry after the window resets.'],
];

export default function DevelopersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="container py-20 md:py-24">
          <div className="max-w-3xl animate-fade-up">
            <Kicker className="mb-5">Audit API</Kicker>
            <h1 className="font-sans text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              The medical-bill audit engine, as an API.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Send line items from a bill or EOB; get back the billing errors — with a plain-language
              explanation and an estimated recoverable amount. The same deterministic engine that
              powers Paxer for patients, available to your product.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login?next=/app/settings">Get an API key</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:ly3569@princeton.edu?subject=Paxer%20Audit%20API">Talk to us</a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted">
              Create a key in <span className="text-ink">Settings → Developers</span> after signing in.
            </p>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-y border-rule bg-soft/40">
          <div className="container py-14">
            <Kicker className="mb-3">Who it’s for</Kicker>
            <p className="max-w-3xl text-lg text-ink">
              Built for the buyers whose incentives align with the patient — {API_BUYERS} — plus
              care-navigation and advocacy tools. Anywhere a bill needs an instant “is this correct?”
              check before someone pays it.
            </p>
            <p className="mt-3 max-w-3xl text-sm text-muted">
              We don’t sell this to health plans as the primary buyer — the aligned parties are the
              ones who win when a bill is corrected, not when a claim is denied.{' '}
              <Link href="/pricing" className="text-accent hover:underline">
                See pricing →
              </Link>
            </p>
          </div>
        </section>

        {/* What it detects */}
        <section className="container py-20">
          <Kicker className="mb-3">What it detects</Kicker>
          <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
            One call, every common billing error.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
            {DETECTS.map(([title, body]) => (
              <div key={title} className="bg-card p-6">
                <h3 className="font-sans text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Example */}
        <section className="border-t border-rule bg-soft/40">
          <div className="container grid grid-cols-1 gap-6 py-20 lg:grid-cols-2">
            <div>
              <Kicker className="mb-3">Request</Kicker>
              <pre className="overflow-x-auto rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
                {CURL}
              </pre>
            </div>
            <div>
              <Kicker className="mb-3">Response</Kicker>
              <pre className="overflow-x-auto rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
                {RESPONSE}
              </pre>
            </div>
          </div>
        </section>

        {/* Errors & limits */}
        <section className="container py-20">
          <Kicker className="mb-3">Errors &amp; limits</Kicker>
          <h2 className="max-w-2xl font-sans text-3xl font-semibold text-ink">
            Predictable status codes.
          </h2>
          <div className="mt-8 overflow-hidden rounded-lg border border-rule">
            {ERROR_CODES.map(([code, desc], i) => (
              <div
                key={code}
                className={`grid grid-cols-[3.5rem_1fr] gap-4 p-4 text-sm ${i > 0 ? 'border-t border-rule' : ''}`}
              >
                <span className="font-mono text-ink">{code}</span>
                <span className="text-muted">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            Quota is per calendar month and hard-capped — over the limit returns 402, with no
            surprise overage charges. Usage resets on the 1st. Keys are created and revoked in
            Settings → Developers.
          </p>
        </section>

        {/* Practical notes */}
        <section className="container py-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Stateless & private', 'Nothing you send is stored. No data is retained or shared, and responses contain only findings.'],
              ['Authentication', 'Bearer API keys, created and revoked in Settings → Developers. Keys are shown once and stored hashed.'],
              ['Limits & pricing', 'Free to start, rate-limited per key. For production volume or an SLA, get in touch — usage-based pricing.'],
            ].map(([title, body]) => (
              <Card key={title}>
                <CardContent className="pt-6">
                  <h3 className="font-sans text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-sans text-3xl font-semibold text-ink">
            Add bill-accuracy to your product.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login?next=/app/settings">Get an API key</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:ly3569@princeton.edu?subject=Paxer%20Audit%20API">Contact us</a>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
