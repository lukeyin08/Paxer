import { formatUsd } from '@/lib/utils';

const LINES = [
  { desc: 'Office visit, established', code: '99213', amount: 30 },
  { desc: 'MRI, lumbar spine', code: '72148', amount: 720, flagged: true },
  { desc: 'Physical therapy, 30 min', code: '97110', amount: 95 },
];

/**
 * Illustrative hero visual — a sample EOB with one error Paxer caught (a
 * cost-share overcharge), set as a plain table with the finding written out
 * underneath it. Labelled as an example.
 */
export function HeroBillDemo() {
  return (
    <div className="w-full max-w-lg border border-rule p-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2">
        <span className="font-semibold text-ink">Riverside Medical Center</span>
        <span className="text-sm text-muted">EOB</span>
      </div>

      <table className="mt-3 w-full border-collapse text-sm">
        <caption className="sr-only">Example explanation of benefits</caption>
        <tbody>
          {LINES.map((l) => (
            <tr key={l.code} className="border-b border-rule">
              <td className="py-2 pr-4 text-ink">
                {l.desc} <span className="font-mono text-xs text-muted">{l.code}</span>
              </td>
              <td className="py-2 text-right tabular-nums text-ink">
                {formatUsd(l.amount)}
                {l.flagged && <span className="ml-2 text-muted">(flagged)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 border-l-2 border-ink pl-4 text-sm leading-relaxed">
        <p className="font-semibold text-ink">MRI, lumbar spine: overcharged</p>
        <p className="mt-1 text-muted">
          You were billed at 60% coinsurance. Your plan says 20%. You were charged {formatUsd(720)};
          your correct share is {formatUsd(240)}.
        </p>
        <p className="mt-2 text-ink">Overcharged by {formatUsd(480)}.</p>
      </div>

      <p className="mt-4 text-sm text-muted">Illustrative example, not a real bill.</p>
    </div>
  );
}
