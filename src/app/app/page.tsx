import Link from 'next/link';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { getDisputesForUser } from '@/lib/disputes/repo';
import { getRecoveriesForUser, sumRecoveries } from '@/lib/recoveries/repo';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { StatusPill } from '@/components/brand/status-pill';
import { Money } from '@/components/brand/money';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { caseStatusTone, disputeStatusTone, disputeStatusLabel } from '@/lib/cases/status';
import { formatDate } from '@/lib/utils';

const ACTIVE_DISPUTE = new Set(['DRAFT', 'AWAITING_USER_APPROVAL', 'SIMULATED_SENT', 'RESPONSE_RECEIVED', 'ESCALATED']);

export default async function DashboardPage() {
  const user = await requireUser();
  const [myCases, disputeRows, recoveryRows] = await Promise.all([
    db.select().from(cases).where(and(eq(cases.userId, user.id), isNull(cases.deletedAt))),
    getDisputesForUser(user.id),
    getRecoveriesForUser(user.id),
  ]);

  const totalEstimated = myCases.reduce((s, c) => s + Number(c.estimatedRecoverable ?? 0), 0);
  const openDisputes = disputeRows.filter((d) => ACTIVE_DISPUTE.has(d.dispute.status)).length;
  const recovered = sumRecoveries(recoveryRows);
  const upcoming = disputeRows
    .filter((d) => d.dispute.deadlineAt && d.dispute.status === 'SIMULATED_SENT')
    .sort((a, b) => a.dispute.deadlineAt!.getTime() - b.dispute.deadlineAt!.getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      <div>
        <Kicker className="mb-2">Your dashboard</Kicker>
        <h1 className="font-sans text-3xl font-semibold">Overview</h1>
      </div>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatBlock label="Cases" value={myCases.length} />
        <StatBlock
          label="Est. recoverable"
          value={<Money amount={totalEstimated} estimate size="inherit" />}
        />
        <StatBlock
          label="Recovered"
          value={<Money amount={recovered.totalRecovered} size="inherit" />}
        />
        <StatBlock label="Open disputes" value={openDisputes} />
      </section>

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-sans text-xl font-semibold">Upcoming deadlines</h2>
          <div className="flex flex-col gap-2">
            {upcoming.map(({ dispute, caseTitle }) => (
              <Link
                key={dispute.id}
                href={`/app/disputes/${dispute.id}`}
                className="flex items-center justify-between rounded-md border border-rule bg-card px-4 py-3 text-sm hover:bg-soft"
              >
                <span>{caseTitle}</span>
                <span className="flex items-center gap-3">
                  <StatusPill label={disputeStatusLabel(dispute.status)} tone={disputeStatusTone(dispute.status)} />
                  <span className="text-muted">due {formatDate(dispute.deadlineAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-xl font-semibold">Your cases</h2>
          <Button asChild size="sm">
            <Link href="/app/cases/new">Start a case</Link>
          </Button>
        </div>

        {myCases.length === 0 ? (
          <EmptyState
            kicker="Nothing here yet"
            title="Start your first case"
            description="Upload a medical bill or EOB, or enter charges by hand. Paxer reads the document and audits every line."
            action={
              <Button asChild>
                <Link href="/app/cases/new">Start your first case</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myCases.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div className="min-w-0">
                    <Link href={`/app/cases/${c.id}`} className="font-sans text-lg hover:underline">
                      {c.title}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {c.providerName ?? 'Unknown provider'} · {c.payerName ?? 'Unknown payer'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusPill label={c.status} tone={caseStatusTone(c.status)} />
                    <Money amount={Number(c.estimatedRecoverable ?? 0)} estimate />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
