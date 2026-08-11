import { Card, CardContent } from '@/components/ui/card';
import { formatUsd } from '@/lib/utils';

type Line = { desc: string; charge: number; note: string };
type Finding = { title: string; body: string; amount: number };

/**
 * The how-it-works centerpiece: the bill on the left, the findings that answer
 * it on the right. Data stays in the page (single source of truth).
 */
export function WorkedExample({
  lines,
  findings,
}: {
  lines: Line[];
  findings: Finding[];
}) {
  const totalBilled = lines.reduce((s, l) => s + l.charge, 0);
  const totalFound = findings.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* The bill */}
      <Card>
        <CardContent className="pt-6">
          <p className="kicker mb-4">The bill</p>
          <div className="flex flex-col divide-y divide-rule">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-ink">
                  {l.desc}
                  {l.note && (
                    <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-warning">
                      {l.note}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-muted">{formatUsd(l.charge)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 text-sm font-semibold">
              <span className="text-ink">Total billed</span>
              <span className="tabular-nums text-ink">{formatUsd(totalBilled)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The findings */}
      <Card>
        <CardContent className="pt-6">
          <p className="kicker mb-4">What Paxer finds</p>
          <div className="flex flex-col gap-4">
            {findings.map((f) => (
              <div key={f.title} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{f.title}</p>
                  <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
                <span className="shrink-0 tabular-nums font-semibold text-success">
                  {formatUsd(f.amount)}
                </span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-rule pt-4 text-sm font-semibold">
              <span className="text-ink">Estimated recoverable</span>
              <span className="tabular-nums text-lg text-success">{formatUsd(totalFound)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
