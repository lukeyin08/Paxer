import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';
import { CodeDemo } from '@/components/developers/code-demo';
import { API_BUYERS } from '@/lib/marketing';
import { API_PLANS } from '@/lib/billing/plans';

const description =
  'Paxer’s medical bill audit engine as an API. Send line items, get back the errors: duplicates, cost-share mistakes, denials, balance billing, and unbundling.';

export const metadata: Metadata = {
  title: 'Developers',
  description,
  alternates: { canonical: '/developers' },
  openGraph: { title: 'Developers · Paxer', description, url: '/developers' },
};

const DETECTS = [
  ['Duplicate charges', 'The same service billed twice on one bill or across providers.'],
  ['Cost-share errors', 'Deductible / coinsurance / copay computed wrong against the plan.'],
  [
    'Denials & coordination of benefits',
    'PR-22 and other reason codes that shift a denial onto the patient.',
  ],
  ['Balance billing (NSA)', 'Out-of-network amounts billed above the allowed/protected rate.'],
  ['Unbundling', 'Codes billed separately that should be a single bundled charge (NCCI).'],
  ['Implausible charges', 'Amounts wildly out of line with what the service plausibly costs.'],
];

const CURL = `curl -X POST https://paxer.app/api/v1/audit \\
  -H "Authorization: Bearer pax_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "lineItems": [
      { "description": "Echocardiogram, complete", "cptHcpcsCode": "93306",
        "chargeAmount": 980, "allowedAmount": 710, "planPaid": 0,
        "patientResponsibility": 710, "adjustmentCodes": ["PR-22"] }
    ]
  }'`;

const RESPONSE = `{
  "findings": [
    {
      "type": "NON_COVERED_BILLED_TO_PATIENT",
      "severity": "HIGH",
      "title": "Denial billed to you: coordination-of-benefits denial (reason code PR-22), echocardiogram",
      "explanation": "Your plan allowed $710 but paid $0, and the full $710 was passed to you under a PR-22 coordination-of-benefits denial. Denials like this are frequently reversed.",
      "recommendedNextStep": "Submit the primary plan's EOB to this insurer, or call to correct your coordination-of-benefits record so the claim reprocesses. Consider waiting to pay until it has been reprocessed.",
      "estimatedRecovery": 710,
      "confidence": 0.75,
      "detector": "RULE",
      "lineItemIndex": 0
    }
  ],
  "summary": {
    "findingCount": 1,
    "estimatedRecoverable": 710
  },
  "usage": {
    "plan": "free",
    "used": 1,
    "quota": ${API_PLANS.free.monthlyQuota}
  }
}`;

const ERROR_CODES: [string, string][] = [
  [
    '200',
    'Findings returned. summary.estimatedRecoverable is capped so it never exceeds total patient responsibility.',
  ],
  [
    '400',
    'Invalid request body, e.g. missing or malformed lineItems. The response "error" field explains.',
  ],
  [
    '401',
    'Missing or invalid API key. Send it as Authorization: Bearer pax_live_... (or the x-api-key header).',
  ],
  [
    '402',
    'Monthly quota exceeded. This calendar month’s audit allotment is used up. Upgrade for a higher quota.',
  ],
  ['429', 'Rate limited (120 requests/min per key). Retry after the window resets.'],
];

export default function DevelopersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="measure py-12 md:py-16">
          <div className="max-w-3xl">
            <h1>Medical bill audit API</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              Send the line items from a bill or EOB, get back the billing errors with an
              explanation and an estimated recoverable amount.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login?next=/app/settings">Get an API key</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:hello@paxer.app?subject=Paxer%20Audit%20API">Talk to us</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="measure border-t border-rule py-12">
          <div>
            <h2>Who it’s for</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink">
              Built for {API_BUYERS}, plus care-navigation and advocacy tools. Anywhere a bill needs
              checking before someone pays it.
            </p>
            <p className="mt-3 max-w-3xl text-sm text-muted">
              We don’t sell this to health plans as the primary buyer, since a health plan benefits
              when a claim is denied.{' '}
              <Link href="/pricing" className="link">
                See pricing
              </Link>
              .
            </p>
          </div>
        </section>

        {/* What it detects */}
        <section className="measure border-t border-rule py-14">
          <h2>What it detects</h2>
          <dl className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
            {DETECTS.map(([title, body]) => (
              <div key={title}>
                <dt className="font-semibold text-ink">{title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Example request & response */}
        <CodeDemo request={CURL} response={RESPONSE} />

        {/* Errors & limits */}
        <section className="measure border-t border-rule py-14">
          <h2>Status codes</h2>
          <table className="mt-6 w-full border-collapse text-sm">
            <caption className="sr-only">Audit API status codes</caption>
            <tbody>
              {ERROR_CODES.map(([code, desc]) => (
                <tr key={code} className="border-b border-rule align-baseline">
                  <th
                    scope="row"
                    className="w-16 py-2 pr-4 text-left font-mono font-normal text-ink"
                  >
                    {code}
                  </th>
                  <td className="py-2 leading-relaxed text-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            Quota is per calendar month and hard-capped, so over the limit returns 402, with no
            surprise overage charges. Usage resets on the 1st. Keys are created and revoked in
            Settings → Developers.
          </p>
        </section>

        {/* CTA */}
        <section className="measure border-t border-rule py-14">
          <h2>Get an API key</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login?next=/app/settings">Get an API key</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:hello@paxer.app?subject=Paxer%20Audit%20API">Contact us</a>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
