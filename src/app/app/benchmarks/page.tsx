import { requireUser } from '@/lib/auth/session';
import { ComingSoon } from '@/components/brand/coming-soon';

export default async function BenchmarksPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Benchmarks"
      phase="Phase 6"
      description="Explore regional price benchmarks and watch the anonymized dataset grow."
    />
  );
}
