import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

config({ path: '.env' });

import { db } from './index';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/password';
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from '@/lib/auth/demo';

const RESET = process.argv.includes('--reset');

/**
 * Idempotent seed. Safe to run repeatedly. `--reset` wipes the demo user's data
 * first (dev only). The full worked synthetic cases land in Phase 7; this seeds
 * the demo account so sign-in works from Phase 1 on.
 */
async function seed() {
  if (RESET && process.env.NODE_ENV === 'production') {
    throw new Error('seed:reset is disabled in production.');
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        name: DEMO_NAME,
        passwordHash,
        consentAt: existing.consentAt ?? new Date(),
        deletedAt: null,
      })
      .where(eq(users.id, existing.id));
    console.log(`✓ Demo user updated: ${DEMO_EMAIL}`);
  } else {
    await db.insert(users).values({
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      role: 'PATIENT',
      state: 'CA',
      passwordHash,
      consentAt: new Date(),
      emailVerified: new Date(),
    });
    console.log(`✓ Demo user created: ${DEMO_EMAIL}`);
  }

  console.log(`\nDemo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('Seed complete.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
