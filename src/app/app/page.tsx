import Link from 'next/link';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { Money } from '@/components/brand/money';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default async function DashboardPage() {
  const user = await requireUser();
  const myCases = await db
    .select()
    .from(cases)
    .where(and(eq(cases.userId, user.id), isNull(cases.deletedAt)));

  const totalEstimated = myCases.reduce((s, c) => s + Number(c.estimatedRecoverable ?? 0), 0);
  const openDisputes = myCases.filter((c) => c.status === 'IN_DISPUTE').length;

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      <div>
        <Kicker className="mb-2">Your dashboard</Kicker>
        <h1 className="font-serif text-3xl font-semibold">Overview</h1>
      </div>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatBlock label="Cases" value={myCases.length} />
        <StatBlock label="Est. recoverable" value={<Money amount={totalEstimated} estimate />} />
        <StatBlock label="Recovered" value={<Money amount={0} />} />
        <StatBlock label="Open disputes" value={openDisputes} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Your cases</h2>
          <Button asChild size="sm">
            <Link href="/app/cases/new">Start a case</Link>
          </Button>
        </div>

        {myCases.length === 0 ? (
          <EmptyState
            kicker="Nothing here yet"
            title="Start your first case"
            description="Upload a medical bill or EOB, connect your insurer, or enter charges by hand. Paxer reads the document and audits every line."
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
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <Link href={`/app/cases/${c.id}`} className="font-serif text-lg hover:underline">
                      {c.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {c.providerName ?? 'Unknown provider'} · {c.payerName ?? 'Unknown payer'}
                    </p>
                  </div>
                  <Money amount={Number(c.estimatedRecoverable ?? 0)} estimate />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
