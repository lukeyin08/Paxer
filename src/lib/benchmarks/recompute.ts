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

    const values = {
      cptHcpcsCode: code,
      region,
      sampleSize: amounts.length,
      medianCharge: percentile(amounts, 0.5).toFixed(2),
      p25: percentile(amounts, 0.25).toFixed(2),
      p75: percentile(amounts, 0.75).toFixed(2),
      source: 'AGGREGATE' as const,
      updatedAt: new Date(),
    };
    // Upsert onto the unique (code, region) constraint — no duplicate rows.
    await db
      .insert(benchmarks)
      .values(values)
      .onConflictDoUpdate({
        target: [benchmarks.cptHcpcsCode, benchmarks.region],
        set: {
          sampleSize: values.sampleSize,
          medianCharge: values.medianCharge,
          p25: values.p25,
          p75: values.p75,
          source: 'AGGREGATE',
          updatedAt: values.updatedAt,
        },
      });
    updated++;
  }

  return { codesUpdated: updated, lineItemsUsed: used };
}
