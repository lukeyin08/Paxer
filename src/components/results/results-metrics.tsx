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
  { label: 'Employer & API partners', amount: '$13K' },
  { label: 'Paxer Plus subscriptions', amount: '$3K' },
];

/**
 * The figures in ruled compartments rather than a bare list — the same
 * cell-and-hairline structure as the nav bar, so each number reads as its own
 * unit instead of running into the next.
 */
export function ResultsMetrics() {
  return (
    <>
      <section className="measure border-t border-rule py-12">
        <h2>Since launch</h2>
        <ul className="mt-8 grid grid-cols-1 border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
          {HEADLINE.map((s) => (
            <li
              key={s.label}
              className="border-b border-rule py-6 sm:px-6 sm:first:pl-0 lg:border-r lg:last:border-r-0 lg:last:pr-0"
            >
              <p className="text-[2rem] font-bold tabular-nums leading-none tracking-[-0.03em] text-ink">
                {s.value}
              </p>
              <p className="mt-3 font-semibold text-ink">{s.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.sub}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="measure border-t border-rule py-12">
        <h2>Revenue</h2>
        <p className="mt-3 max-w-[58ch] leading-relaxed text-muted">
          Annual run-rate is $16K. Most of that comes from business customers; the consumer
          subscription is the smaller share. All pricing is flat-fee, so Paxer never takes a
          percentage of what anyone recovers.
        </p>

        <table className="mt-8 w-full border-collapse text-sm">
          <caption className="sr-only">Annualized recurring revenue by source</caption>
          <thead>
            <tr className="border-y border-ink text-left">
              <th scope="col" className="py-3 pr-4 font-semibold text-ink">
                Source
              </th>
              <th scope="col" className="py-3 text-right font-semibold text-ink">
                ARR
              </th>
            </tr>
          </thead>
          <tbody>
            {REVENUE.map((r) => (
              <tr key={r.label} className="border-b border-rule">
                <td className="py-3 pr-4 text-ink">{r.label}</td>
                <td className="py-3 text-right font-mono tabular-nums text-ink">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
