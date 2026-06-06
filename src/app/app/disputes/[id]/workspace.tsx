'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/brand/status-pill';
import { Disclaimer } from '@/components/brand/disclaimer';
import { disputeStatusTone } from '@/lib/cases/status';
import { formatDate } from '@/lib/utils';
import {
  saveLetterAction,
  approveDisputeAction,
  reopenDraftAction,
  simulatedSendAction,
  logResponseAction,
  escalateDisputeAction,
} from '../actions';

export interface WorkspaceDispute {
  id: string;
  caseId: string;
  status: string;
  target: string;
  letterHtml: string;
  deadlineAt: string | null;
  modelId: string | null;
  promptVersion: string | null;
}

export interface EventView {
  type: string;
  occurredAt: string;
}

export function DisputeWorkspace({
  dispute,
  events,
  pastDeadline,
}: {
  dispute: WorkspaceDispute;
  events: EventView[];
  pastDeadline: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(dispute.status);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const editable = status === 'DRAFT';

  const run = (fn: () => Promise<{ ok: boolean }>, nextStatus?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok && nextStatus) setStatus(nextStatus);
    });

  const save = () =>
    startTransition(async () => {
      const html = editorRef.current?.innerHTML ?? dispute.letterHtml;
      const res = await saveLetterAction(dispute.id, html);
      if (res.ok) {
        setSavedNote('Saved.');
        setTimeout(() => setSavedNote(null), 2000);
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill
          label={status}
          tone={disputeStatusTone(status as Parameters<typeof disputeStatusTone>[0])}
        />
        <StatusPill label={dispute.target} tone="muted" />
        {dispute.deadlineAt && (
          <span className="text-sm text-muted">Response due {formatDate(dispute.deadlineAt)}</span>
        )}
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <a href={`/api/disputes/${dispute.id}/pdf`} target="_blank" rel="noreferrer">
            Download PDF
          </a>
        </Button>
      </div>

      {status === 'SIMULATED_SENT' && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          Simulated send — no real provider or insurer was contacted. In a production deployment this
          is where Paxer would queue the letter for outbound delivery.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div
            ref={editorRef}
            contentEditable={editable}
            suppressContentEditableWarning
            className={`dispute-prose max-h-[60vh] overflow-y-auto rounded-md border p-6 text-sm leading-relaxed focus:outline-none ${
              editable ? 'border-rule bg-card focus:ring-2 focus:ring-ring' : 'border-transparent bg-soft/30'
            }`}
            dangerouslySetInnerHTML={{ __html: dispute.letterHtml }}
          />
          {editable && (
            <p className="mt-2 text-xs text-muted">
              Edit the letter directly above. Placeholders in [brackets] are for you to fill in.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle actions */}
      <div className="flex flex-wrap items-center gap-2">
        {status === 'DRAFT' && (
          <>
            <Button onClick={save} disabled={pending} variant="outline">
              Save changes
            </Button>
            <Button onClick={() => run(() => approveDisputeAction(dispute.id), 'AWAITING_USER_APPROVAL')} disabled={pending}>
              Approve draft
            </Button>
            {savedNote && <span className="text-sm text-success">{savedNote}</span>}
          </>
        )}
        {status === 'AWAITING_USER_APPROVAL' && (
          <>
            <Button onClick={() => run(() => simulatedSendAction(dispute.id), 'SIMULATED_SENT')} disabled={pending}>
              Confirm & simulate send
            </Button>
            <Button onClick={() => run(() => reopenDraftAction(dispute.id), 'DRAFT')} variant="ghost" disabled={pending}>
              Keep editing
            </Button>
          </>
        )}
        {(status === 'SIMULATED_SENT' || status === 'RESPONSE_RECEIVED') && (
          <>
            <span className="kicker">Log the response:</span>
            <Button size="sm" onClick={() => run(() => logResponseAction(dispute.id, 'WON'), 'WON')} disabled={pending}>
              Won
            </Button>
            <Button size="sm" variant="outline" onClick={() => run(() => logResponseAction(dispute.id, 'PARTIAL'), 'PARTIAL')} disabled={pending}>
              Partial
            </Button>
            <Button size="sm" variant="outline" onClick={() => run(() => logResponseAction(dispute.id, 'DENIED'), 'DENIED')} disabled={pending}>
              Denied
            </Button>
            {pastDeadline && (
              <Button size="sm" variant="ghost" onClick={() => run(() => escalateDisputeAction(dispute.id), 'ESCALATED')} disabled={pending}>
                Escalate (deadline passed)
              </Button>
            )}
          </>
        )}
        {(status === 'WON' || status === 'PARTIAL') && (
          <Button asChild>
            <Link href={`/app/recoveries?disputeId=${dispute.id}`}>Record recovery</Link>
          </Button>
        )}
        {status === 'DENIED' && (
          <Button onClick={() => run(() => escalateDisputeAction(dispute.id), 'ESCALATED')} disabled={pending} variant="outline">
            Escalate
          </Button>
        )}
      </div>

      {/* Events timeline */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-lg font-semibold">Activity</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-3 text-muted">
              <span className="font-mono text-[0.65rem] uppercase tracking-wider">
                {e.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs">{formatDate(e.occurredAt)}</span>
            </li>
          ))}
        </ol>
      </div>

      {dispute.modelId && (
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
          Drafted by {dispute.modelId} · {dispute.promptVersion}
        </p>
      )}
      <Disclaimer />
    </div>
  );
}
