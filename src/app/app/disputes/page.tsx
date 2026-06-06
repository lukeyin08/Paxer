import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { getDisputesForUser } from '@/lib/disputes/repo';
import { Kicker } from '@/components/brand/kicker';
import { EmptyState } from '@/components/brand/empty-state';
import { StatusPill } from '@/components/brand/status-pill';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { disputeStatusTone } from '@/lib/cases/status';
import { formatDate } from '@/lib/utils';

export default async function DisputesPage() {
  const user = await requireUser();
  const rows = await getDisputesForUser(user.id);

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <Kicker className="mb-2">Disputes</Kicker>
        <h1 className="font-serif text-3xl font-semibold">Your disputes</h1>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No disputes yet"
          description="Open a case, review its findings, and start a dispute to generate a letter or appeal."
          action={
            <Button asChild>
              <Link href="/app">Go to dashboard</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ dispute, caseTitle }) => (
            <Card key={dispute.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <Link href={`/app/disputes/${dispute.id}`} className="font-serif text-lg hover:underline">
                    {dispute.target === 'INSURER' ? 'Insurer appeal' : 'Provider letter'}
                  </Link>
                  <p className="text-sm text-muted">{caseTitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  {dispute.deadlineAt && (
                    <span className="text-xs text-muted">Due {formatDate(dispute.deadlineAt)}</span>
                  )}
                  <StatusPill label={dispute.status} tone={disputeStatusTone(dispute.status)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
