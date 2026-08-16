import { formatUsd } from '@/lib/utils';

const LINES = [
  { desc: 'Office visit, established', code: '99213', amount: 30 },
  { desc: 'MRI, lumbar spine', code: '72148', amount: 720, flagged: true },
  { desc: 'Physical therapy, 30 min', code: '97110', amount: 95 },
];

/**
 * Illustrative hero visual — a sample EOB with one error Paxer caught (a
 * cost-share overcharge).
 *
 * Set as a statement, not a card: hard ink border on the page ground rather
 * than a white panel floating above it, a black header strip matching the nav
 * bar, and every figure in tabular mono so the columns line up the way they do
 * on a real printed EOB. Labelled as an example.
 */
export function HeroBillDemo() {
  return (
    <figure className="w-full border border-ink">
      <figcaption className="flex items-center justify-between gap-4 bg-ink px-5 py-2.5 text-paper">
        <span className="text-xs font-bold uppercase tracking-[0.1em]">
          Riverside Medical Center
        </span>
        <span className="font-mono text-xs text-paper/60">EOB</span>
      </figcaption>

      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Example explanation of benefits</caption>
        <tbody>
          {LINES.map((l) => (
            <tr key={l.code} className="border-b border-rule">
              <td className="py-3 pl-5 pr-4">
                <span className="text-ink">{l.desc}</span>{' '}
                <span className="font-mono text-xs text-muted">{l.code}</span>
                {l.flagged && (
                  <span className="ml-3 bg-accent px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-accent-foreground">
                    Flagged
                  </span>
                )}
              </td>
              <td className="py-3 pr-5 text-right font-mono tabular-nums text-ink">
                {formatUsd(l.amount, { cents: true })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink">
            <td className="py-3 pl-5 pr-4 font-semibold text-ink">Overcharged by</td>
            <td className="py-3 pr-5 text-right font-mono font-semibold tabular-nums text-ink">
              {formatUsd(480, { cents: true })}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="border-t border-rule px-5 py-3 text-sm text-muted">
        Billed at 60% coinsurance; your plan says 20%. Example, not a real bill.
      </p>
    </figure>
  );
}
