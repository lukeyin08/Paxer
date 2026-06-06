import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { AppNav } from '@/components/app-nav';
import { SiteFooter } from '@/components/site-footer';

// All /app routes are authenticated. Unconsented users are sent to onboarding.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || row.deletedAt) redirect('/login');
  if (!row.consentAt) redirect('/onboarding');

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav email={row.email} />
      <main className="container flex-1 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
