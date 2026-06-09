'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { runAuditAction } from './audit-actions';
import { WorkingIndicator } from '@/components/working-indicator';
import { ConsumerPaywall } from '@/components/consumer-paywall';

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
  canAudit,
  plusPriceLabel,
  plusConfigured,
}: {
  caseId: string;
  hasFindings: boolean;
  /** Whether this user may run this audit (free allowance left, Plus sub, or demo). */
  canAudit: boolean;
  plusPriceLabel: string;
  plusConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  function run() {
    // Free audit used up → show the paywall instead of calling the server.
    if (!canAudit) {
      setShowPaywall(true);
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await runAuditAction(caseId);
      // Allowance may have changed since page load — fall back to the paywall.
      if (!res.ok && res.code === 'subscription_required') {
        setShowPaywall(true);
        return;
      }
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" variant={hasFindings ? 'outline' : 'default'} disabled={pending} onClick={run}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {pending ? 'Auditing…' : hasFindings ? 'Re-run audit' : 'Run audit'}
      </Button>
      <WorkingIndicator active={pending} steps={AUDIT_STEPS} />
      {!pending && msg && (
        <p className={msg.ok ? 'text-xs text-success' : 'text-xs text-danger'}>{msg.text}</p>
      )}

      <ConsumerPaywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        priceLabel={plusPriceLabel}
        configured={plusConfigured}
      />
    </div>
  );
}
