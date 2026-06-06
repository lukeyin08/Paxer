import { NextRequest, NextResponse } from 'next/server';
import { authorizeCron } from '@/lib/cron';
import { recomputeBenchmarks } from '@/lib/benchmarks/recompute';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Cron (Section 7.11): recompute benchmark aggregates from anonymized line items. */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await recomputeBenchmarks();
  return NextResponse.json({ ok: true, ...result });
}
