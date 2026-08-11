const HEADLINE = [
  {
    value: '$12,000',
    label: 'reported recoveries',
    sub: 'Money users report getting back after disputing with Paxer.',
  },
  {
    value: '240',
    label: 'free audits completed',
    sub: 'Bills run through the audit engine by patients.',
  },
  { value: '44', label: 'Net Promoter Score', sub: 'From in-product surveys of active users.' },
  {
    value: '58%',
    label: 'organic or referral signups',
    sub: 'Most users arrive without paid acquisition.',
  },
];

const NUMBER_CLS =
  'font-sans text-4xl font-semibold leading-none tracking-tight text-ink md:text-5xl';

function StatCard({
  stat,
  accent = false,
}: {
  stat: { value: string; label: string; sub: string };
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border px-7 py-8 ${
        accent ? 'border-accent/25 bg-accent/[0.05]' : 'border-rule bg-card'
      }`}
    >
      <p className={NUMBER_CLS}>{stat.value}</p>
      <p className="mt-4 font-sans text-base font-semibold text-ink">{stat.label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{stat.sub}</p>
    </div>
  );
}

/** Revenue bar, sized to its share of the total. */
function RevenueBar({ label, amount, pct }: { label: string; amount: string; pct: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono font-semibold text-ink">{amount}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ResultsMetrics() {
  return (
    <>
      {/* Headline numbers */}
      <section className="border-y border-rule bg-soft/40">
        <div className="container grid grid-cols-1 gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE.map((s, i) => (
            <StatCard key={s.label} stat={s} accent={i === 0} />
          ))}
        </div>
      </section>

      {/* Revenue */}
      <section className="container py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="kicker mb-3">Revenue</p>
            <h2 className="max-w-xl font-sans text-3xl font-semibold text-ink">
              $16K annual run-rate, six months in.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              Business revenue leads, and the consumer subscription compounds underneath it. All of
              it is flat-fee: Paxer never takes a percentage of what anyone recovers.
            </p>
          </div>
          <div className="flex flex-col gap-6 rounded-xl border border-rule bg-card p-8">
            <RevenueBar label="Employer & API partners" amount="$13K ARR" pct={100} />
            <RevenueBar label="Paxer Plus subscriptions" amount="$3K ARR" pct={23} />
            <p className="text-xs leading-relaxed text-muted">
              Bar lengths are proportional to annualized recurring revenue.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
