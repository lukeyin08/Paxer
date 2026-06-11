import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { Wordmark } from '@/components/brand/wordmark';
import { Kicker } from '@/components/brand/kicker';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = {
  title: 'Set up your account',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await requireUser();
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || row.deletedAt) redirect('/login');
  if (row.consentAt) redirect('/app');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12">
      <Wordmark size="lg" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div>
            <Kicker className="mb-2">A few details</Kicker>
            <h1 className="font-sans text-2xl font-semibold">Set up your account</h1>
            <p className="mt-1 text-sm text-muted">
              This takes a moment and helps Paxer audit your bills accurately.
            </p>
          </div>
          <OnboardingForm defaultName={row?.name ?? user.name ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
