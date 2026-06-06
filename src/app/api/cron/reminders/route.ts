import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, disputes, users } from '@/lib/db/schema';
import { authorizeCron } from '@/lib/cron';
import { addDisputeEvent } from '@/lib/disputes/repo';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/utils';

export const runtime = 'nodejs';

const REMINDER_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

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

  const now = Date.now();
  let reminders = 0;
  let escalated = 0;

  for (const row of open) {
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
        text: `The response deadline (${formatDate(deadline)}) has passed with no logged response. Paxer suggests escalating to the next level. Open the dispute to continue.`,
      });
      escalated++;
    } else if (msLeft <= REMINDER_WINDOW_DAYS * DAY_MS) {
      await addDisputeEvent(row.dispute.id, 'REMINDER_SENT', { deadlineAt: deadline });
      await sendEmail({
        to: row.email,
        subject: `Paxer reminder: response due soon for "${row.caseTitle}"`,
        text: `Your dispute response is due ${formatDate(deadline)}. If you have heard back, log the response in Paxer so we can record any recovery.`,
      });
      reminders++;
    }
  }

  return NextResponse.json({ ok: true, checked: open.length, reminders, escalated });
}
