import type { LineItem } from '@/lib/db/schema';
import { Money } from '@/components/brand/money';
import { ConfidenceBadge } from '@/components/brand/confidence-badge';
import { formatDate } from '@/lib/utils';

/** Renders a case's line items as a table. Low-confidence rows show a badge. */
export function LineItemsTable({ items }: { items: LineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No line items yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-rule">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-rule bg-soft/40 text-left">
          <tr className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
            <th className="p-3 font-normal">Description</th>
            <th className="p-3 font-normal">Code</th>
            <th className="p-3 font-normal">Date</th>
            <th className="p-3 text-right font-normal">Charge</th>
            <th className="p-3 text-right font-normal">Allowed</th>
            <th className="p-3 text-right font-normal">Plan paid</th>
            <th className="p-3 text-right font-normal">You owe</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-rule last:border-0">
              <td className="p-3">
                <span className="text-ink">{it.description}</span>
                {it.sourceConfidence < 0.8 && (
                  <ConfidenceBadge confidence={it.sourceConfidence} className="ml-2" />
                )}
              </td>
              <td className="p-3 font-mono text-xs text-muted">{it.cptHcpcsCode ?? '—'}</td>
              <td className="p-3 text-muted">{formatDate(it.dateOfService)}</td>
              <td className="p-3 text-right">
                <Money amount={it.chargeAmount === null ? null : Number(it.chargeAmount)} cents />
              </td>
              <td className="p-3 text-right">
                <Money amount={it.allowedAmount === null ? null : Number(it.allowedAmount)} cents />
              </td>
              <td className="p-3 text-right">
                <Money amount={it.planPaid === null ? null : Number(it.planPaid)} cents />
              </td>
              <td className="p-3 text-right font-medium">
                <Money
                  amount={
                    it.patientResponsibility === null ? null : Number(it.patientResponsibility)
                  }
                  cents
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
