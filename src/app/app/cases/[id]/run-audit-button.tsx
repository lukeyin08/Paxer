'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { runAuditAction } from './audit-actions';

export function RunAuditButton({
  caseId,
  hasFindings,
}: {
  caseId: string;
  hasFindings: boolean;
}) {
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
          })
        }
      >
        <ShieldCheck className="h-4 w-4" />
        {pending ? 'Auditing…' : hasFindings ? 'Re-run audit' : 'Run audit'}
      </Button>
      {msg && <p className={msg.ok ? 'text-xs text-success' : 'text-xs text-danger'}>{msg.text}</p>}
    </div>
  );
}
