import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env' });

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  throw new Error('DATABASE_URL (or POSTGRES_URL) is required for drizzle-kit.');
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
