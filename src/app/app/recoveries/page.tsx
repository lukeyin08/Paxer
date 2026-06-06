import { requireUser } from '@/lib/auth/session';
import { ComingSoon } from '@/components/brand/coming-soon';

export default async function RecoveriesPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Recoveries"
      phase="Phase 6"
      description="Log recovered dollars, see the computed success fee, and preview invoices."
    />
  );
}
