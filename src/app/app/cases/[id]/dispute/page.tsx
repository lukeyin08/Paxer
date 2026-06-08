import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getCaseForUser } from '@/lib/cases/repo';
import { Kicker } from '@/components/brand/kicker';
import { EmptyState } from '@/components/brand/empty-state';
import { Button } from '@/components/ui/button';
import { DraftForm } from './draft-form';

export default async function DisputeDraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ findingIds?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { findingIds } = await searchParams;
  const detail = await getCaseForUser(user.id, id);
  if (!detail) notFound();

  const open = detail.findings.filter((f) => f.status === 'OPEN');
  const preselected = (findingIds ?? '').split(',').filter(Boolean);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 animate-fade-up">
      <div>
        <Link href={`/app/cases/${id}`} className="text-sm text-accent hover:underline">
          ← Back to case
        </Link>
        <Kicker className="mb-2 mt-3">New dispute</Kicker>
        <h1 className="font-sans text-3xl font-semibold">Draft a dispute</h1>
        <p className="mt-1 text-muted">
          Choose the findings to include. Paxer drafts a letter you can edit and approve, then
          download and send to your provider or insurer.
        </p>
      </div>

      {open.length === 0 ? (
        <EmptyState
          title="No open findings to dispute"
          description="Run the audit on this case, or all findings have already been disputed or dismissed."
          action={
            <Button asChild variant="outline">
              <Link href={`/app/cases/${id}`}>Back to case</Link>
            </Button>
          }
        />
      ) : (
        <DraftForm
          caseId={id}
          preselected={preselected}
          prefill={{
            senderName: user.name ?? '',
            senderEmail: user.email ?? '',
            payerName: detail.case.payerName ?? '',
            providerName: detail.case.providerName ?? '',
          }}
          findings={open.map((f) => ({
            id: f.id,
            type: f.type,
            severity: f.severity,
            title: f.title,
            estimatedRecovery: f.estimatedRecovery === null ? null : Number(f.estimatedRecovery),
          }))}
        />
      )}
    </div>
  );
}
