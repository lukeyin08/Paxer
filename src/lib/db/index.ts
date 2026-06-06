import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseUrl } from '@/lib/env';
import * as schema from './schema';

// Single shared postgres-js client. In serverless (Vercel) each instance is
// short-lived, so a small pool is appropriate. `postgres` works against Vercel
// Postgres / Neon and any standard Postgres.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(databaseUrl(), {
    max: 5,
    prepare: false, // friendlier to PgBouncer / Neon pooling
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
