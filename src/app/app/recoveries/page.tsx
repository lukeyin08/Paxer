import { requireUser } from '@/lib/auth/session';
import { getRecoveriesForUser, sumRecoveries } from '@/lib/recoveries/repo';
import { getDisputeForUser } from '@/lib/disputes/repo';
import { defaultFeeRate } from '@/lib/audit/fees';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { Money } from '@/components/brand/money';
import { EmptyState } from '@/components/brand/empty-state';
import { StatusPill } from '@/components/brand/status-pill';
import { Card, CardContent } from '@/components/ui/card';
import { Disclaimer } from '@/components/brand/disclaimer';
import { formatUsd, formatDate } from '@/lib/utils';
import { RecordRecoveryForm } from './record-form';

export default async function RecoveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ disputeId?: string }>;
}) {
  const user = await requireUser();
  const { disputeId } = await searchParams;
  const rows = await getRecoveriesForUser(user.id);
  const totals = sumRecoveries(rows);
  const feeRate = defaultFeeRate();

  // If arriving from a dispute, prefill a record form.
  let recordContext: { caseId: string; disputeId: string; defaultAmount: number } | null = null;
  if (disputeId) {
    const detail = await getDisputeForUser(user.id, disputeId);
    if (detail) {
      const defaultAmount = detail.findings.reduce(
        (s, f) => s + Number(f.estimatedRecovery ?? 0),
        0,
      );
      recordContext = { caseId: detail.dispute.caseId, disputeId, defaultAmount };
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <Kicker className="mb-2">Recoveries</Kicker>
        <h1 className="font-serif text-3xl font-semibold">Recoveries &amp; fees</h1>
      </div>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatBlock label="Recovered" value={<Money amount={totals.totalRecovered} />} />
        <StatBlock label="You kept" value={<Money amount={totals.netToPatient} />} />
        <StatBlock label={`Fees (${Math.round(feeRate * 100)}%)`} value={<Money amount={totals.totalFees} />} />
        <StatBlock label="Recoveries" value={totals.count} />
      </section>

      {recordContext && (
        <RecordRecoveryForm
          caseId={recordContext.caseId}
          disputeId={recordContext.disputeId}
          defaultAmount={recordContext.defaultAmount}
          feeRate={feeRate}
        />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-xl font-semibold">History</h2>
        {rows.length === 0 ? (
          <EmptyState
            title="No recoveries yet"
            description="When a dispute is won, log the amount returned here. Paxer computes the success fee and shows what you keep."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map(({ recovery, caseTitle }) => (
              <Card key={recovery.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{caseTitle}</p>
                    <p className="text-sm text-muted">
                      {formatDate(recovery.recoveredAt)} · {recovery.kind.replace(/_/g, ' ')}
                      {recovery.notes ? ` · ${recovery.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="kicker">Recovered</p>
                      <Money amount={Number(recovery.amount)} size="sm" />
                    </div>
                    <div>
                      <p className="kicker">Fee</p>
                      <span className="text-sm tabular-nums text-muted">
                        {formatUsd(Number(recovery.feeAmount))}
                      </span>
                    </div>
                    <StatusPill label="recorded" tone="success" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
