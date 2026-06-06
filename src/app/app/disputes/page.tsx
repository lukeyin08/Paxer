import { requireUser } from '@/lib/auth/session';
import { ComingSoon } from '@/components/brand/coming-soon';

export default async function DisputesPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Disputes"
      phase="Phase 5"
      description="Draft, review, approve, and track dispute letters and appeals through their lifecycle."
    />
  );
}
