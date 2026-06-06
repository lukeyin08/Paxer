import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env' });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  throw new Error('DATABASE_URL (or POSTGRES_URL) is required to run migrations.');
}

async function main() {
  const sql = postgres(url!, { max: 1 });
  const db = drizzle(sql);
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
