import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getDisputeForUser } from '@/lib/disputes/repo';
import { DisputeWorkspace } from './workspace';

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getDisputeForUser(user.id, id);
  if (!detail) notFound();

  const { dispute, events, findings } = detail;
  const pastDeadline = dispute.deadlineAt ? new Date(dispute.deadlineAt) < new Date() : false;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={`/app/cases/${dispute.caseId}`} className="link text-sm">
          ← Back to case
        </Link>
        <h1 className="text-2xl font-bold">
          {dispute.target === 'INSURER' ? 'Insurer appeal' : 'Provider letter'}
        </h1>
      </div>

      <DisputeWorkspace
        dispute={{
          id: dispute.id,
          caseId: dispute.caseId,
          status: dispute.status,
          target: dispute.target,
          letterHtml: dispute.letterHtml ?? '',
          deadlineAt: dispute.deadlineAt ? dispute.deadlineAt.toISOString() : null,
          modelId: dispute.modelId,
          promptVersion: dispute.promptVersion,
        }}
        events={events.map((e) => ({ type: e.type, occurredAt: e.occurredAt.toISOString() }))}
        findings={findings.map((f) => ({
          id: f.id,
          title: f.title,
          estimatedRecovery: Number(f.estimatedRecovery ?? 0),
        }))}
        pastDeadline={pastDeadline}
      />
    </div>
  );
}
