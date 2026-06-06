'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth/config';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/auth/demo';

/** Sign in as the seeded demo account (Section 7.1). */
export async function signInDemo() {
  await signIn('credentials', {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    redirectTo: '/app',
  });
}

/** Send a magic link. In dev the link is logged to the server console. */
export async function sendMagicLink(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  try {
    await signIn('resend', { email, redirectTo: '/app', redirect: false });
    return {
      ok: true,
      message: 'Check your email for a sign-in link. (In dev, the link is printed to the server console.)',
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: 'Could not send the link. Please try again.' };
    }
    throw err;
  }
}
