import Link from 'next/link';

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-rule bg-card px-8 py-10">
      {children}
    </div>
  );
}

const NUMBER_CLS =
  'font-sans text-5xl font-semibold leading-none tracking-tight text-ink md:text-6xl';

/**
 * Three landing-page stats. No iconography — the figures are the focal point.
 */
export function StatShowcase() {
  return (
    <div className="container grid grid-cols-1 gap-6 py-16 md:grid-cols-3">
      <StatCard>
        <p className={NUMBER_CLS}>80%</p>
        <p className="mt-6 font-sans text-lg font-semibold text-ink">
          of bills may contain errors
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Industry estimates for complex, itemized hospital bills.
        </p>
      </StatCard>

      <StatCard>
        <p className={NUMBER_CLS}>$12K</p>
        <p className="mt-6 font-sans text-lg font-semibold text-ink">reported back by users</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Recoveries reported since launch.{' '}
          <Link href="/results" className="text-accent hover:underline">
            See the results &rarr;
          </Link>
        </p>
      </StatCard>

      <StatCard>
        <p className={NUMBER_CLS}>100%</p>
        <p className="mt-6 font-sans text-lg font-semibold text-ink">you keep</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          A flat subscription. Paxer never takes a cut of your recovery.
        </p>
      </StatCard>
    </div>
  );
}
