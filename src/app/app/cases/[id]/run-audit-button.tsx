'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { runAuditAction } from './audit-actions';
import { WorkingIndicator } from '@/components/working-indicator';

const AUDIT_STEPS = [
  { at: 0, text: 'Reading your line items' },
  { at: 5, text: 'Checking for duplicate & excessive charges' },
  { at: 14, text: 'Cross-checking cost-share, denials & benchmarks' },
  { at: 28, text: 'Writing up what it found' },
  { at: 45, text: 'Almost there — this one’s taking a little longer' },
];

export function RunAuditButton({
  caseId,
  hasFindings,
}: {
  caseId: string;
  hasFindings: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant={hasFindings ? 'outline' : 'default'}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await runAuditAction(caseId);
            setMsg({ ok: res.ok, text: res.message });
            // Re-fetch so the new finding cards render immediately.
            if (res.ok) router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {pending ? 'Auditing…' : hasFindings ? 'Re-run audit' : 'Run audit'}
      </Button>
      <WorkingIndicator active={pending} steps={AUDIT_STEPS} />
      {!pending && msg && (
        <p className={msg.ok ? 'text-xs text-success' : 'text-xs text-danger'}>{msg.text}</p>
      )}
    </div>
  );
}
