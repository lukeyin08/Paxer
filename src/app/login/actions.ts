'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth/config';
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_ENABLED } from '@/lib/auth/demo';
import { checkRateLimit } from '@/lib/rate-limit';

/** Sign in as the seeded demo account (dev-only — Section 7.1). */
export async function signInDemo() {
  // The Credentials provider isn't registered in production; refuse explicitly
  // so this can never become a real-patient login path.
  if (!DEMO_ENABLED) {
    throw new Error('Demo sign-in is disabled.');
  }
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
  // Anti-abuse: cap magic-link sends per email (prevents inbox-bombing and
  // enumeration spam). 5 per 15 min. Enforced HERE — the only magic-link entry
  // point — rather than in the Auth.js sendVerificationRequest hook, because an
  // error thrown there is swallowed by Auth.js and the user would be falsely
  // told the email was sent.
  const rl = await checkRateLimit(`magic-link:${email.toLowerCase()}`, 5, 900);
  if (!rl.ok) {
    const wait = rl.retryAfterSec < 90 ? `${rl.retryAfterSec}s` : `${Math.ceil(rl.retryAfterSec / 60)} min`;
    return { ok: false, message: `Too many sign-in emails. Please wait ${wait} and try again.` };
  }
  try {
    await signIn('resend', { email, redirectTo: '/app', redirect: false });
    // The console-fallback hint is only true in dev (no RESEND_API_KEY); never
    // show it to real users in production.
    const devHint =
      process.env.NODE_ENV === 'production'
        ? ''
        : ' (In dev, the link is printed to the server console.)';
    return {
      ok: true,
      message: `Check your email for a sign-in link.${devHint}`,
    };
  } catch (err) {
    console.error('[magic-link] signIn failed:', err);
    if (err instanceof AuthError) {
      return { ok: false, message: 'Could not send the link. Please try again.' };
    }
    throw err;
  }
}
