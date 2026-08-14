// Illustrative case findings (not a real patient). Kept distinct from the other
// examples on the site (the hero EOB and the /how-it-works worked example) so we
// never show the same bill twice. The amounts sum to the recoverable total in
// the footer row, so the numbers stay consistent.
const FINDINGS = [
  { title: 'Out-of-network anesthesia', tag: 'Balance bill', amount: '$620' },
  { title: 'Unbundled supply kit', tag: 'Unbundling', amount: '$540' },
  { title: 'Duplicate lab panel', tag: 'Duplicate', amount: '$190' },
  { title: 'Upcoded follow-up visit', tag: 'Upcoding', amount: '$150' },
];

/**
 * Landing-page showcase: what a finished case looks like, rendered as a plain
 * table rather than a mocked-up browser window.
 */
export function ProductShowcase() {
  return (
    <section className="container py-14">
      <h2 className="text-2xl font-bold text-ink">Every finding, every dollar, in one place.</h2>
      <p className="mt-2 max-w-2xl text-muted">
        An example case: an outpatient surgery bill after the audit finished. Illustrative only, not
        a real patient.
      </p>

      <table className="mt-6 w-full max-w-2xl border-collapse text-sm">
        <caption className="sr-only">Example findings on one outpatient surgery bill</caption>
        <thead>
          <tr className="border-b border-ink text-left">
            <th scope="col" className="py-2 pr-4 font-semibold text-ink">
              Finding
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold text-ink">
              Type
            </th>
            <th scope="col" className="py-2 text-right font-semibold text-ink">
              Recoverable
            </th>
          </tr>
        </thead>
        <tbody>
          {FINDINGS.map((f) => (
            <tr key={f.title} className="border-b border-rule">
              <td className="py-2 pr-4 text-ink">{f.title}</td>
              <td className="py-2 pr-4 text-muted">{f.tag}</td>
              <td className="py-2 text-right tabular-nums text-ink">{f.amount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 pr-4 font-semibold text-ink" colSpan={2}>
              Estimated recoverable
            </td>
            <td className="py-2 text-right font-semibold tabular-nums text-ink">$1,500</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Paxer then drafts a dispute letter citing each finding, ready for you to review and send.
      </p>
    </section>
  );
}
