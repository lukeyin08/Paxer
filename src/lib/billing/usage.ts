import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiUsage, users } from '@/lib/db/schema';
import { currentPeriod, planFor, type PlanDef } from './plans';

/** This calendar month's Audit-API call count for a user. */
export async function usageThisMonth(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: apiUsage.count })
    .from(apiUsage)
    .where(and(eq(apiUsage.userId, userId), eq(apiUsage.period, currentPeriod())))
    .limit(1);
  return row?.count ?? 0;
}

/** Atomically record one Audit-API call for the current month. */
export async function incrementUsage(userId: string): Promise<void> {
  const period = currentPeriod();
  await db
    .insert(apiUsage)
    .values({ userId, period, count: 1 })
    .onConflictDoUpdate({
      target: [apiUsage.userId, apiUsage.period],
      set: { count: sql`${apiUsage.count} + 1`, updatedAt: new Date() },
    });
}

export interface UsageSnapshot {
  plan: PlanDef;
  used: number;
  quota: number;
  remaining: number;
  overQuota: boolean;
}

/** Plan + this-month usage for a user (one query for the user's plan). */
export async function usageSnapshot(userId: string): Promise<UsageSnapshot> {
  const [[u], used] = await Promise.all([
    db.select({ apiPlan: users.apiPlan }).from(users).where(eq(users.id, userId)).limit(1),
    usageThisMonth(userId),
  ]);
  const plan = planFor(u?.apiPlan);
  return {
    plan,
    used,
    quota: plan.monthlyQuota,
    remaining: Math.max(0, plan.monthlyQuota - used),
    overQuota: used >= plan.monthlyQuota,
  };
}
