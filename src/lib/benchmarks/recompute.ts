import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { benchmarks, cases, lineItems, users } from '@/lib/db/schema';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx]!;
}

/**
 * Recompute benchmark aggregates from anonymized line items (Section 7.11).
 * Reads ONLY code + region + charge amount (no patient identifiers) by joining
 * line items to the owning user's state, groups by (code, region), and upserts
 * AGGREGATE benchmarks. This is the compounding-dataset moat.
 */
export async function recomputeBenchmarks(): Promise<{ codesUpdated: number; lineItemsUsed: number }> {
  // Anonymized projection: code, region (user state), amount only.
  const rows = await db
    .select({
      code: lineItems.cptHcpcsCode,
      region: users.state,
      charge: lineItems.chargeAmount,
    })
    .from(lineItems)
    .innerJoin(cases, eq(cases.id, lineItems.caseId))
    .innerJoin(users, eq(users.id, cases.userId))
    .where(
      and(
        isNull(lineItems.deletedAt),
        isNotNull(lineItems.cptHcpcsCode),
        isNotNull(lineItems.chargeAmount),
      ),
    );

  // Group by (code, region).
  const groups = new Map<string, number[]>();
  let used = 0;
  for (const r of rows) {
    if (!r.code || !r.region || r.charge === null) continue;
    const amt = Number(r.charge);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const key = `${r.code}|${r.region}`;
    const arr = groups.get(key) ?? [];
    arr.push(amt);
    groups.set(key, arr);
    used++;
  }

  let updated = 0;
  for (const [key, amounts] of groups) {
    const [code, region] = key.split('|') as [string, string];
    amounts.sort((a, b) => a - b);
    const median = percentile(amounts, 0.5);
    const p25 = percentile(amounts, 0.25);
    const p75 = percentile(amounts, 0.75);

    const [existing] = await db
      .select()
      .from(benchmarks)
      .where(and(eq(benchmarks.cptHcpcsCode, code), eq(benchmarks.region, region)))
      .limit(1);

    const values = {
      cptHcpcsCode: code,
      region,
      sampleSize: amounts.length,
      medianCharge: median.toFixed(2),
      p25: p25.toFixed(2),
      p75: p75.toFixed(2),
      source: 'AGGREGATE' as const,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(benchmarks).set(values).where(eq(benchmarks.id, existing.id));
    } else {
      await db.insert(benchmarks).values(values);
    }
    updated++;
  }

  return { codesUpdated: updated, lineItemsUsed: used };
}
