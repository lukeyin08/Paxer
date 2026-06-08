'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/brand/status-pill';
import { Disclaimer } from '@/components/brand/disclaimer';
import { disputeStatusTone, disputeStatusLabel } from '@/lib/cases/status';
import { formatDate } from '@/lib/utils';
import {
  saveLetterAction,
  approveDisputeAction,
  reopenDraftAction,
  markAsSentAction,
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

export interface FindingView {
  id: string;
  title: string;
  estimatedRecovery: number;
}

export function DisputeWorkspace({
  dispute,
  events,
  findings,
  pastDeadline,
}: {
  dispute: WorkspaceDispute;
  events: EventView[];
  findings: FindingView[];
  pastDeadline: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(dispute.status);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  // Partial-response flow: reveal a per-finding selector before logging.
  const [partialMode, setPartialMode] = useState(false);
  const [recovered, setRecovered] = useState<Set<string>>(() => new Set(findings.map((f) => f.id)));

  const editable = status === 'DRAFT';

  const run = (fn: () => Promise<{ ok: boolean }>, nextStatus?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok && nextStatus) setStatus(nextStatus);
    });

  const saveLetter = async () => {
    const html = editorRef.current?.innerHTML ?? dispute.letterHtml;
    return saveLetterAction(dispute.id, html);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveLetter();
      if (res.ok) {
        setSavedNote('Saved.');
        setTimeout(() => setSavedNote(null), 2000);
      }
    });

  // Approve persists any in-progress edits first so they aren't silently lost.
  const approve = () =>
    startTransition(async () => {
      await saveLetter();
      const res = await approveDisputeAction(dispute.id);
      if (res.ok) setStatus('AWAITING_USER_APPROVAL');
    });

  const toggleRecovered = (id: string) =>
    setRecovered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill
          label={disputeStatusLabel(status as Parameters<typeof disputeStatusTone>[0])}
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
        <div className="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
          Marked as sent. Download the letter above and send it to your provider or insurer (mail,
          fax, or their portal). We&rsquo;ll track the response deadline and remind you.
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
              Review and edit the letter directly above before approving. If anything looks off, you
              can fix it here.
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
            <Button onClick={approve} disabled={pending}>
              Approve draft
            </Button>
            {savedNote && <span className="text-sm text-success">{savedNote}</span>}
          </>
        )}
        {status === 'AWAITING_USER_APPROVAL' && (
          <>
            <Button onClick={() => run(() => markAsSentAction(dispute.id), 'SIMULATED_SENT')} disabled={pending}>
              I&rsquo;ve sent this — mark as sent
            </Button>
            <Button onClick={() => run(() => reopenDraftAction(dispute.id), 'DRAFT')} variant="ghost" disabled={pending}>
              Keep editing
            </Button>
          </>
        )}
        {(status === 'SIMULATED_SENT' || status === 'RESPONSE_RECEIVED') && !partialMode && (
          <>
            <span className="kicker">Log the response:</span>
            <Button size="sm" onClick={() => run(() => logResponseAction(dispute.id, 'WON'), 'WON')} disabled={pending}>
              Won
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPartialMode(true)}
              disabled={pending || findings.length === 0}
            >
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
        {(status === 'SIMULATED_SENT' || status === 'RESPONSE_RECEIVED') && partialMode && (
          <div className="flex w-full flex-col gap-3 rounded-md border border-rule bg-soft/40 p-4">
            <p className="text-sm text-ink">
              Which findings were resolved in your favor? The rest return to your open findings so you
              can re-dispute or escalate them.
            </p>
            <div className="flex flex-col gap-2">
              {findings.map((f) => (
                <label key={f.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={recovered.has(f.id)}
                    onChange={() => toggleRecovered(f.id)}
                  />
                  <span className="text-muted">{f.title}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  run(
                    () => logResponseAction(dispute.id, 'PARTIAL', [...recovered]),
                    'PARTIAL',
                  )
                }
                disabled={pending || recovered.size === 0}
              >
                Confirm partial outcome
              </Button>
              {recovered.size === 0 && (
                <span className="text-xs text-muted">
                  Select at least one finding, or use “Denied”.
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => setPartialMode(false)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </div>
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
        <h2 className="font-sans text-lg font-semibold">Activity</h2>
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

      <Disclaimer />
    </div>
  );
}
