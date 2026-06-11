import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, disputeEvents, users } from '@/lib/db/schema';
import { authorizeCron } from '@/lib/cron';
import { addDisputeEvent } from '@/lib/disputes/repo';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/utils';

export const runtime = 'nodejs';
// This route does serial DB writes + email sends per dispute; give it headroom
// and cap the per-run batch so it can't run past the limit and drop work
// silently. Remaining disputes are processed on the next daily run.
export const maxDuration = 60;

const REMINDER_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 200;
const SITE_URL = process.env.AUTH_URL || 'https://paxer.app';

/**
 * Daily cron (Section 7.9): for simulated-sent disputes, send a reminder as the
 * response deadline approaches and auto-escalate when it passes with no response.
 */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const open = await db
    .select({ dispute: disputes, caseTitle: cases.title, email: users.email })
    .from(disputes)
    .innerJoin(cases, eq(cases.id, disputes.caseId))
    .innerJoin(users, eq(users.id, cases.userId))
    .where(and(eq(disputes.status, 'SIMULATED_SENT'), isNull(disputes.deletedAt)));

  // Disputes that already got a reminder — avoid re-emailing every day in-window.
  const alreadyReminded = new Set<string>();
  if (open.length > 0) {
    const reminded = await db
      .select({ disputeId: disputeEvents.disputeId })
      .from(disputeEvents)
      .where(
        and(
          eq(disputeEvents.type, 'REMINDER_SENT'),
          inArray(
            disputeEvents.disputeId,
            open.map((o) => o.dispute.id),
          ),
        ),
      );
    for (const r of reminded) alreadyReminded.add(r.disputeId);
  }

  const now = Date.now();
  let reminders = 0;
  let escalated = 0;

  // Bound the work per invocation. Disputes nearest their deadline first so the
  // most urgent ones are never the ones dropped when there are more than the cap.
  const ordered = [...open].sort(
    (a, b) => (a.dispute.deadlineAt?.getTime() ?? Infinity) - (b.dispute.deadlineAt?.getTime() ?? Infinity),
  );
  const batch = ordered.slice(0, MAX_PER_RUN);
  const deferred = ordered.length - batch.length;

  for (const row of batch) {
    const deadline = row.dispute.deadlineAt;
    if (!deadline) continue;
    const msLeft = deadline.getTime() - now;

    if (msLeft < 0) {
      // Deadline passed with no logged response -> escalate.
      await db
        .update(disputes)
        .set({ status: 'ESCALATED', updatedAt: new Date() })
        .where(eq(disputes.id, row.dispute.id));
      await addDisputeEvent(row.dispute.id, 'ESCALATED', { reason: 'deadline_passed' });
      await sendEmail({
        to: row.email,
        subject: `Paxer: no response on your dispute for "${row.caseTitle}"`,
        text: `The response deadline (${formatDate(deadline)}) has passed with no logged response. Paxer suggests escalating to the next level. Open the dispute to continue: ${SITE_URL}/app/disputes/${row.dispute.id}`,
      });
      escalated++;
    } else if (msLeft <= REMINDER_WINDOW_DAYS * DAY_MS && !alreadyReminded.has(row.dispute.id)) {
      await addDisputeEvent(row.dispute.id, 'REMINDER_SENT', { deadlineAt: deadline });
      await sendEmail({
        to: row.email,
        subject: `Paxer reminder: response due soon for "${row.caseTitle}"`,
        text: `Your dispute response is due ${formatDate(deadline)}. If you have heard back, log the response in Paxer so we can record any recovery: ${SITE_URL}/app/disputes/${row.dispute.id}`,
      });
      reminders++;
    }
  }

  if (deferred > 0) {
    console.warn(`[cron/reminders] processed ${batch.length}/${open.length}; ${deferred} deferred to next run.`);
  }
  return NextResponse.json({ ok: true, checked: batch.length, total: open.length, reminders, escalated, deferred });
}
