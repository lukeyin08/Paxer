import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getCaseForUser } from '@/lib/cases/repo';
import { caseStatusTone } from '@/lib/cases/status';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { Money } from '@/components/brand/money';
import { StatusPill } from '@/components/brand/status-pill';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineItemsTable } from '@/components/line-items-table';
import { Disclaimer } from '@/components/brand/disclaimer';
import { formatDate, formatUsd } from '@/lib/utils';
import { FileText } from 'lucide-react';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getCaseForUser(user.id, id);
  if (!detail) notFound();

  const { case: c, documents, lineItems, planBenefits: plan } = detail;

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/app" className="text-sm text-accent hover:underline">
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Kicker className="mb-2">Case</Kicker>
            <h1 className="font-serif text-3xl font-semibold">{c.title}</h1>
            <p className="mt-1 text-muted">
              {c.providerName ?? 'Unknown provider'} · {c.payerName ?? 'Unknown payer'}
              {c.dateOfService ? ` · ${formatDate(c.dateOfService)}` : ''}
            </p>
          </div>
          <StatusPill label={c.status} tone={caseStatusTone(c.status)} />
        </div>
      </div>

      {/* Totals */}
      <section className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatBlock
          label="Total billed"
          value={<Money amount={c.totalBilled === null ? null : Number(c.totalBilled)} />}
        />
        <StatBlock
          label="You were charged"
          value={
            <Money
              amount={
                c.totalPatientResponsibility === null
                  ? null
                  : Number(c.totalPatientResponsibility)
              }
            />
          }
        />
        <StatBlock
          label="Est. recoverable"
          value={
            <Money
              amount={c.estimatedRecoverable === null ? null : Number(c.estimatedRecoverable)}
              estimate
            />
          }
        />
      </section>

      {/* Documents */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-xl font-semibold">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted">No documents attached to this case.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted" />
                    <div>
                      <p className="text-sm font-medium text-ink">{d.fileName ?? 'Document'}</p>
                      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                        {d.kind.replace(/_/g, ' ')} · {d.ingestStatus}
                      </p>
                    </div>
                  </div>
                  {d.blobUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={d.blobUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Plan benefits */}
      {plan && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-xl font-semibold">Plan benefits</h2>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-4">
              <div>
                <p className="kicker">Deductible</p>
                <p>
                  {formatUsd(Number(plan.deductibleMet ?? 0))} /{' '}
                  {formatUsd(Number(plan.deductible ?? 0))}
                </p>
              </div>
              <div>
                <p className="kicker">Coinsurance</p>
                <p>{plan.coinsuranceRate !== null ? `${Math.round(plan.coinsuranceRate * 100)}%` : '—'}</p>
              </div>
              <div>
                <p className="kicker">Out-of-pocket max</p>
                <p>
                  {formatUsd(Number(plan.oopMet ?? 0))} / {formatUsd(Number(plan.oopMax ?? 0))}
                </p>
              </div>
              <div>
                <p className="kicker">Network</p>
                <p>{plan.inNetwork ? 'In-network' : 'Out-of-network'}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Line items */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-xl font-semibold">Line items</h2>
        <LineItemsTable items={lineItems} />
      </section>

      {/* Findings placeholder (Phase 4) */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold">Findings</h2>
        <p className="text-sm text-muted">
          The audit engine and findings review arrive in the next phase. Documents uploaded here are
          extracted into line items in Phase 3, then audited in Phase 4.
        </p>
      </section>

      <Disclaimer />
    </div>
  );
}
