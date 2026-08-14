import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { benchmarks } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { Kicker } from '@/components/brand/kicker';
import { StatBlock } from '@/components/brand/stat-block';
import { EmptyState } from '@/components/brand/empty-state';
import { StatusPill } from '@/components/brand/status-pill';
import { formatUsd } from '@/lib/utils';
import { RecomputeButton } from './recompute-button';

export default async function BenchmarksPage() {
  const user = await requireUser();
  const isAdmin = user.role === 'ADMIN';
  const rows = await db.select().from(benchmarks).orderBy(desc(benchmarks.sampleSize));
  const totalSamples = rows.reduce((s, b) => s + b.sampleSize, 0);
  const aggregated = rows.filter((b) => b.source === 'AGGREGATE').length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Kicker className="mb-2">Benchmarks</Kicker>
          <h1 className="text-2xl font-bold">Price benchmarks</h1>
          <p className="mt-1 max-w-2xl text-muted">
            Anonymized prices collected across cases: billing code, region, and amount only, with no
            identifiers. The overcharge detector compares each charge against these figures, so they
            get more accurate as more bills are audited.
          </p>
        </div>
        {isAdmin && <RecomputeButton />}
      </div>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatBlock label="Codes tracked" value={rows.length} />
        <StatBlock label="Anonymized line items" value={totalSamples.toLocaleString()} />
        <StatBlock label="Aggregated from real data" value={aggregated} />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No benchmarks yet"
          description="Price benchmarks build up as more bills are audited across Paxer."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-rule bg-soft/40 text-left">
              <tr className="text-xs text-muted">
                <th className="p-3 font-normal">Code</th>
                <th className="p-3 font-normal">Region</th>
                <th className="p-3 text-right font-normal">25th pct</th>
                <th className="p-3 text-right font-normal">Median</th>
                <th className="p-3 text-right font-normal">75th pct</th>
                <th className="p-3 text-right font-normal">Sample</th>
                <th className="p-3 font-normal">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-rule last:border-0">
                  <td className="p-3 font-mono text-xs">{b.cptHcpcsCode}</td>
                  <td className="p-3 text-muted">{b.region}</td>
                  <td className="p-3 text-right tabular-nums">{formatUsd(Number(b.p25 ?? 0))}</td>
                  <td className="p-3 text-right font-medium tabular-nums">
                    {formatUsd(Number(b.medianCharge ?? 0))}
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatUsd(Number(b.p75 ?? 0))}</td>
                  <td className="p-3 text-right tabular-nums text-muted">
                    {b.sampleSize.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <StatusPill
                      label={b.source}
                      tone={b.source === 'AGGREGATE' ? 'success' : 'muted'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
