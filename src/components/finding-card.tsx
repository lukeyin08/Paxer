'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/brand/money';
import { ConfidenceBadge } from '@/components/brand/confidence-badge';
import { StatusPill } from '@/components/brand/status-pill';
import { formatUsd } from '@/lib/utils';
import { severityTone, findingStatusTone } from '@/lib/cases/status';
import { dismissFindingAction } from '@/app/app/cases/[id]/audit-actions';

export interface FindingView {
  id: string;
  caseId: string;
  type: string;
  severity: 'LOW' | 'MED' | 'HIGH';
  title: string;
  explanationPlain: string;
  estimatedRecovery: number | null;
  confidence: number;
  detector: string;
  status: string;
  evidence: Record<string, unknown> | null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}

/** Cost-share recompute table — shows the patient the arithmetic (Section 7.7). */
function CostShareTable({ evidence }: { evidence: Record<string, unknown> }) {
  const breakdown = evidence.breakdown as
    | {
        allowed: number;
        appliedToDeductible: number;
        coinsurance: number;
        copay: number;
        expectedPatientResponsibility: number;
      }
    | undefined;
  const billed = num(evidence.billedPatientResponsibility);
  if (!breakdown) return null;
  const rows = [
    ['Allowed amount', breakdown.allowed],
    ['Applied to deductible', breakdown.appliedToDeductible],
    ['Coinsurance', breakdown.coinsurance],
    ['Copay', breakdown.copay],
    ['Expected your share', breakdown.expectedPatientResponsibility],
  ] as const;
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-rule">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, val]) => (
            <tr key={label} className="border-b border-rule last:border-0">
              <td className="px-3 py-1.5 text-muted">{label}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatUsd(val)}</td>
            </tr>
          ))}
          {billed !== null && (
            <tr className="bg-soft/40">
              <td className="px-3 py-1.5 font-medium">You were billed</td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums text-danger">
                {formatUsd(billed)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Benchmark comparison widget (Section 7.7). */
function BenchmarkWidget({ evidence }: { evidence: Record<string, unknown> }) {
  const charge = num(evidence.charge);
  const median = num(evidence.regionMedian);
  const p75 = num(evidence.p75);
  const sample = num(evidence.sampleSize);
  if (charge === null || p75 === null) return null;
  return (
    <div className="mt-3 rounded-md border border-rule bg-soft/30 p-3 text-sm">
      <p className="kicker mb-2">Regional benchmark</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>
          This charge: <strong className="tabular-nums">{formatUsd(charge)}</strong>
        </span>
        {median !== null && (
          <span className="text-muted">
            Median: <span className="tabular-nums">{formatUsd(median)}</span>
          </span>
        )}
        <span className="text-muted">
          75th pct: <span className="tabular-nums">{formatUsd(p75)}</span>
        </span>
      </div>
      {sample !== null && (
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
          Based on {sample} anonymized line items
        </p>
      )}
    </div>
  );
}

export function FindingCard({ finding }: { finding: FindingView }) {
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(finding.status === 'DISMISSED');
  const ev = finding.evidence ?? {};
  const nextStep = typeof ev.recommendedNextStep === 'string' ? ev.recommendedNextStep : null;
  const isOpen = finding.status === 'OPEN' && !dismissed;

  return (
    <Card className={dismissed ? 'opacity-60' : undefined}>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={finding.severity} tone={severityTone(finding.severity)} />
          <StatusPill label={finding.type} tone="muted" />
          <ConfidenceBadge confidence={finding.confidence} />
          {finding.detector !== 'RULE' && (
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
              {finding.detector}
            </span>
          )}
          {finding.status !== 'OPEN' && (
            <StatusPill
              label={finding.status}
              tone={findingStatusTone(
                finding.status as 'OPEN' | 'DISMISSED' | 'DISPUTING' | 'RECOVERED',
              )}
            />
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-lg font-semibold leading-snug">{finding.title}</h3>
          {finding.estimatedRecovery !== null && (
            <div className="shrink-0 text-right">
              <p className="kicker">Est. recovery</p>
              <Money amount={finding.estimatedRecovery} estimate size="lg" />
            </div>
          )}
        </div>

        <p className="text-sm leading-relaxed text-muted">{finding.explanationPlain}</p>

        {finding.type === 'COST_SHARE_ERROR' && <CostShareTable evidence={ev} />}
        {finding.type === 'OTHER' && 'p75' in ev && <BenchmarkWidget evidence={ev} />}

        {nextStep && (
          <p className="rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-sm text-ink">
            <span className="font-medium">Recommended next step: </span>
            {nextStep}
          </p>
        )}

        {isOpen && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link href={`/app/cases/${finding.caseId}/dispute?findingIds=${finding.id}`}>
                Start dispute
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await dismissFindingAction(finding.id);
                  if (res.ok) setDismissed(true);
                })
              }
            >
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
