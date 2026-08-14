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

const REVENUE = [
  { label: 'Employer & API partners', amount: '$13K ARR' },
  { label: 'Paxer Plus subscriptions', amount: '$3K ARR' },
];

export function ResultsMetrics() {
  return (
    <>
      {/* Headline numbers */}
      <section className="container border-t border-rule py-12">
        <dl className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE.map((s) => (
            <div key={s.label}>
              <dt className="font-semibold text-ink">
                <span className="tabular-nums">{s.value}</span> {s.label}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{s.sub}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Revenue */}
      <section className="container border-t border-rule py-14">
        <h2 className="text-2xl font-bold text-ink">Revenue</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Annual run-rate is $16K. Most of that comes from business customers; the consumer
          subscription is the smaller share. All pricing is flat-fee, so Paxer never takes a
          percentage of what anyone recovers.
        </p>

        <table className="mt-6 w-full max-w-md border-collapse text-sm">
          <caption className="sr-only">Annualized recurring revenue by source</caption>
          <thead>
            <tr className="border-b border-ink text-left">
              <th scope="col" className="py-2 pr-4 font-semibold text-ink">
                Source
              </th>
              <th scope="col" className="py-2 text-right font-semibold text-ink">
                ARR
              </th>
            </tr>
          </thead>
          <tbody>
            {REVENUE.map((r) => (
              <tr key={r.label} className="border-b border-rule">
                <td className="py-2 pr-4 text-ink">{r.label}</td>
                <td className="py-2 text-right tabular-nums text-ink">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
