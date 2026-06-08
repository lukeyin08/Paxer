import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// Lightweight health check for uptime monitors / load balancers. Verifies the
// process is up and the database is reachable. No auth (returns no sensitive
// data) and never cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: 'ok', db: 'up' });
  } catch {
    return Response.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
