import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { ComingSoon } from '@/components/brand/coming-soon';
import { Button } from '@/components/ui/button';

export default async function DisputeDraftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <ComingSoon
        title="Draft dispute"
        phase="Phase 5"
        description="Generate a dispute letter or insurer appeal from the selected findings, edit it, export a PDF, and submit for your review."
      />
      <Button asChild variant="outline" className="self-start">
        <Link href={`/app/cases/${id}`}>← Back to case</Link>
      </Button>
    </div>
  );
}
