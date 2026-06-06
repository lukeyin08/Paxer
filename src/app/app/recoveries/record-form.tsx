'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/components/brand/money';
import { Kicker } from '@/components/brand/kicker';
import { formatUsd } from '@/lib/utils';
import { recordRecoveryAction } from './actions';

const KINDS = [
  { value: 'BILL_REDUCTION', label: 'Bill reduction' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'CLAIM_PAID', label: 'Claim paid' },
] as const;

export function RecordRecoveryForm({
  caseId,
  disputeId,
  defaultAmount,
  feeRate,
}: {
  caseId: string;
  disputeId: string | null;
  defaultAmount: number;
  feeRate: number;
}) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('BILL_REDUCTION');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const amt = Number(amount) || 0;
  const fee = Math.round(amt * feeRate * 100) / 100;
  const net = amt - fee;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await recordRecoveryAction({
        caseId,
        disputeId,
        amount: amt,
        kind,
        notes: notes || undefined,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div>
          <Kicker className="mb-1">Record a recovery</Kicker>
          <h2 className="font-serif text-xl font-semibold">Money returned to you</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount recovered</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="240.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kind">Type</Label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-ink ring-offset-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Insurer reprocessed claim on appeal" />
        </div>

        {/* Fee / invoice preview — Stripe is a stubbed seam (Section 2, 7.10) */}
        <div className="rounded-md border border-rule bg-soft/40 p-4">
          <p className="kicker mb-2">Invoice preview</p>
          <div className="flex flex-col gap-1 text-sm">
            <Row label="Recovered for you" value={formatUsd(amt)} />
            <Row label={`Paxer success fee (${Math.round(feeRate * 100)}%)`} value={`- ${formatUsd(fee)}`} />
            <div className="my-1 h-px bg-rule" />
            <Row label="You keep" value={formatUsd(net)} strong />
          </div>
          <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-wider text-accent2">
            Preview only — no payment is processed (Stripe is a stubbed seam).
          </p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={submit} disabled={pending || amt <= 0} className="self-start">
          {pending ? 'Recording…' : 'Record recovery'}
        </Button>
        <p className="text-xs text-muted">
          Estimated impact on this dispute: <Money amount={defaultAmount} estimate size="sm" />
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'font-medium' : 'text-muted'}>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
