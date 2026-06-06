import { requireUser } from '@/lib/auth/session';
import { ComingSoon } from '@/components/brand/coming-soon';

export default async function SettingsPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Settings"
      phase="Phase 6"
      description="Manage your profile and state, review your consent record, and delete a case or your account."
    />
  );
}
