import Link from 'next/link';

/**
 * Three landing-page figures, set at body scale in a plain definition list.
 * No cards, no oversized display numerals.
 */
export function StatShowcase() {
  return (
    <dl className="container grid grid-cols-1 gap-x-12 gap-y-8 py-12 md:grid-cols-3">
      <div>
        <dt className="font-semibold text-ink">80% of bills may contain errors</dt>
        <dd className="mt-1 text-sm leading-relaxed text-muted">
          Industry estimates for complex, itemized hospital bills.
        </dd>
      </div>

      <div>
        <dt className="font-semibold text-ink">$12K reported back by users</dt>
        <dd className="mt-1 text-sm leading-relaxed text-muted">
          Recoveries reported since launch.{' '}
          <Link href="/results" className="text-accent underline">
            See the results
          </Link>
          .
        </dd>
      </div>

      <div>
        <dt className="font-semibold text-ink">You keep 100%</dt>
        <dd className="mt-1 text-sm leading-relaxed text-muted">
          A flat subscription. Paxer never takes a cut of your recovery.
        </dd>
      </div>
    </dl>
  );
}
