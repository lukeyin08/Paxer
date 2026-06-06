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
import { LineItemsTable } from '@/components/line-items-table';
import { Disclaimer } from '@/components/brand/disclaimer';
import { formatDate, formatUsd } from '@/lib/utils';
import { aiConfigured } from '@/lib/ai/client';
import { FindingCard } from '@/components/finding-card';
import { DocumentsSection } from './documents-section';
import { RunAuditButton } from './run-audit-button';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getCaseForUser(user.id, id);
  if (!detail) notFound();

  const { case: c, documents, lineItems, planBenefits: plan, findings } = detail;
  const aiEnabled = aiConfigured();
  const needsReviewDocs = documents.some((d) => d.ingestStatus === 'NEEDS_REVIEW');

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
        {needsReviewDocs && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Some extracted values are low-confidence. Please review the line items below and choose
            &ldquo;Confirm values&rdquo; on the document once they look right.
          </div>
        )}
        <DocumentsSection
          aiConfigured={aiEnabled}
          docs={documents.map((d) => ({
            id: d.id,
            fileName: d.fileName,
            kind: d.kind,
            ingestStatus: d.ingestStatus,
            blobUrl: d.blobUrl,
            hasFile: Boolean(d.blobUrl && d.mimeType),
          }))}
        />
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

      {/* Findings */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold">Findings</h2>
          {lineItems.length > 0 && (
            <RunAuditButton caseId={c.id} hasFindings={findings.length > 0} />
          )}
        </div>
        {findings.length === 0 ? (
          <p className="text-sm text-muted">
            {lineItems.length === 0
              ? 'Add or extract line items, then run the audit to surface findings.'
              : 'No findings yet. Run the audit to check this case for billing errors.'}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {findings.map((f) => (
              <FindingCard
                key={f.id}
                finding={{
                  id: f.id,
                  caseId: c.id,
                  type: f.type,
                  severity: f.severity,
                  title: f.title,
                  explanationPlain: f.explanationPlain,
                  estimatedRecovery:
                    f.estimatedRecovery === null ? null : Number(f.estimatedRecovery),
                  confidence: f.confidence,
                  detector: f.detector,
                  status: f.status,
                  evidence: (f.evidenceJson as Record<string, unknown> | null) ?? null,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
