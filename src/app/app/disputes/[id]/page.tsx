import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getDisputeForUser } from '@/lib/disputes/repo';
import { Kicker } from '@/components/brand/kicker';
import { DisputeWorkspace } from './workspace';

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getDisputeForUser(user.id, id);
  if (!detail) notFound();

  const { dispute, events } = detail;
  const pastDeadline = dispute.deadlineAt ? new Date(dispute.deadlineAt) < new Date() : false;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 animate-fade-up">
      <div>
        <Link href={`/app/cases/${dispute.caseId}`} className="text-sm text-accent hover:underline">
          ← Back to case
        </Link>
        <Kicker className="mb-2 mt-3">Dispute</Kicker>
        <h1 className="font-serif text-3xl font-semibold">
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
        pastDeadline={pastDeadline}
      />
    </div>
  );
}
