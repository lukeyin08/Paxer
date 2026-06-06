import { env } from '@/lib/env';

/**
 * Send an email. Uses Resend in production; logs to the console in dev or when
 * no key is configured (Section 3). Used for deadline reminders. Best-effort —
 * failures are logged, not thrown.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.log(`\n📧 [dev email] to=${input.to}\n   subject: ${input.subject}\n   ${input.text}\n`);
    return { sent: false };
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: env.RESEND_FROM ?? 'Paxer <onboarding@resend.dev>',
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { sent: false };
  }
}
