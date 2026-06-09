import 'server-only';
import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, cases } from '@/lib/db/schema';
import { env } from '@/lib/env';
import {
  computeConsumerEntitlement,
  isConsumerPriceId,
  type ConsumerEntitlement,
} from './consumer-entitlement';

export type { ConsumerEntitlement };

/**
 * Consumer (patient) subscription: "Paxer Plus". Model: the FIRST bill audit is
 * free; after that, auditing more cases AND generating dispute drafts require an
 * active Plus subscription (the demo account bypasses both). Flat software
 * subscription, NOT a contingency fee — patients keep 100% of what they recover.
 */
export const CONSUMER_PLAN = {
  id: 'plus' as const,
  label: 'Paxer Plus',
  priceLabel: env.PAXER_CONSUMER_PRICE_LABEL || '$12/mo',
  stripePriceId: env.STRIPE_PRICE_CONSUMER,
};

/** Whether consumer self-serve billing is wired up (Stripe key + Plus price set). */
export function consumerBillingConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY && !!env.STRIPE_PRICE_CONSUMER;
}

/** True if a Stripe price id is the Paxer Plus consumer subscription. */
export function isConsumerPrice(priceId: string | null | undefined): boolean {
  return isConsumerPriceId(priceId, env.STRIPE_PRICE_CONSUMER);
}

export async function getConsumerEntitlement(userId: string): Promise<ConsumerEntitlement> {
  const [u] = await db
    .select({ email: users.email, plan: users.consumerPlan, status: users.consumerStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return computeConsumerEntitlement({
    email: u?.email ?? null,
    plan: u?.plan ?? null,
    status: u?.status ?? null,
  });
}

// Statuses that mean a case has already been audited at least once.
const AUDITED_STATUSES = ['AUDITED', 'IN_DISPUTE', 'RESOLVED', 'CLOSED'] as const;

export interface AuditEntitlement {
  canAudit: boolean;
  isDemo: boolean;
  hasActiveSub: boolean;
  freeUsed: number;
  freeLimit: number;
  reason: 'ok' | 'audit_limit';
}

/**
 * Audit gate: the first audit (PAXER_FREE_AUDIT_LIMIT, default 1) is free; further
 * NEW-case audits require Paxer Plus. Re-running an already-audited case is always
 * free (doesn't consume), and the demo account bypasses. Free usage is derived
 * from audited-case count (incl. soft-deleted, so deleting a case can't refund the
 * free audit) — no separate counter column.
 */
export async function getAuditEntitlement(userId: string, caseId: string): Promise<AuditEntitlement> {
  const ent = await getConsumerEntitlement(userId);
  const freeLimit = env.PAXER_FREE_AUDIT_LIMIT;
  if (ent.isDemo || ent.hasActiveSub) {
    return { canAudit: true, isDemo: ent.isDemo, hasActiveSub: ent.hasActiveSub, freeUsed: 0, freeLimit, reason: 'ok' };
  }
  const [thisCase] = await db
    .select({ status: cases.status })
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
    .limit(1);
  const alreadyAudited = !!thisCase && (AUDITED_STATUSES as readonly string[]).includes(thisCase.status);
  const counted = await db
    .select({ n: count() })
    .from(cases)
    .where(and(eq(cases.userId, userId), inArray(cases.status, [...AUDITED_STATUSES])));
  const freeUsed = Number(counted[0]?.n ?? 0);
  const canAudit = alreadyAudited || freeUsed < freeLimit;
  return { canAudit, isDemo: false, hasActiveSub: false, freeUsed, freeLimit, reason: canAudit ? 'ok' : 'audit_limit' };
}
