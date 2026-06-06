'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Money } from '@/components/brand/money';
import { StatusPill } from '@/components/brand/status-pill';
import { Disclaimer } from '@/components/brand/disclaimer';
import { severityTone } from '@/lib/cases/status';
import { generateDisputeAction } from '@/app/app/disputes/actions';

export interface SelectableFinding {
  id: string;
  type: string;
  severity: 'LOW' | 'MED' | 'HIGH';
  title: string;
  estimatedRecovery: number | null;
}

export function DraftForm({
  caseId,
  findings,
  preselected,
}: {
  caseId: string;
  findings: SelectableFinding[];
  preselected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));
  const [target, setTarget] = useState<'PROVIDER' | 'INSURER' | 'AUTO'>('AUTO');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const total = findings
    .filter((f) => selected.has(f.id))
    .reduce((s, f) => s + (f.estimatedRecovery ?? 0), 0);

  function generate() {
    setError(null);
    if (selected.size === 0) {
      setError('Select at least one finding to dispute.');
      return;
    }
    startTransition(async () => {
      const res = await generateDisputeAction({
        caseId,
        findingIds: [...selected],
        target: target === 'AUTO' ? undefined : target,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {findings.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-center gap-3 pt-6">
              <Checkbox
                checked={selected.has(f.id)}
                onCheckedChange={() => toggle(f.id)}
                id={`f-${f.id}`}
              />
              <label htmlFor={`f-${f.id}`} className="flex flex-1 items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <StatusPill label={f.severity} tone={severityTone(f.severity)} />
                  <span className="text-sm">{f.title}</span>
                </span>
                <Money amount={f.estimatedRecovery} estimate size="sm" />
              </label>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="kicker">Send to</span>
          {(['AUTO', 'PROVIDER', 'INSURER'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`rounded-md border px-3 py-1 text-xs ${
                target === t ? 'border-accent bg-accent/10 text-accent' : 'border-rule text-muted'
              }`}
            >
              {t === 'AUTO' ? 'Auto' : t === 'PROVIDER' ? 'Provider' : 'Insurer'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-right">
          <span className="kicker">Total estimated</span>
          <div>
            <Money amount={total} estimate size="lg" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={generate} disabled={pending} className="self-start">
        {pending ? 'Drafting…' : 'Generate dispute draft'}
      </Button>
      <Disclaimer variant="callout" />
    </div>
  );
}
