'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit-log';

const schema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  state: z.string().optional(),
  consent: z.literal('on', { errorMap: () => ({ message: 'Consent is required to continue.' }) }),
});

export async function completeOnboarding(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    name: formData.get('name'),
    state: formData.get('state') || undefined,
    consent: formData.get('consent'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please complete the form.' };
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      state: parsed.data.state ?? null,
      consentAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await writeAuditLog({
    userId: user.id,
    entity: 'user',
    entityId: user.id,
    action: 'onboarding.completed',
    diff: { state: parsed.data.state ?? null },
  });

  redirect('/app');
}
