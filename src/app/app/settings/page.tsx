import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Disclaimer } from '@/components/brand/disclaimer';
import { formatDate } from '@/lib/utils';
import { StateForm, DeleteCaseButton, DeleteAccountCard } from './settings-client';

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  const myCases = await db
    .select()
    .from(cases)
    .where(and(eq(cases.userId, sessionUser.id), isNull(cases.deletedAt)));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 animate-fade-up">
      <div>
        <Kicker className="mb-2">Settings</Kicker>
        <h1 className="font-serif text-3xl font-semibold">Account</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="font-serif text-lg font-semibold">Profile</h2>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="kicker">Name</p>
              <p>{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="kicker">Email</p>
              <p>{user?.email}</p>
            </div>
          </div>
          <StateForm defaultState={user?.state ?? ''} />
          <p className="text-xs text-muted">Your state is used for regional price benchmarks.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <h2 className="font-serif text-lg font-semibold">Consent record</h2>
          <p className="text-sm text-muted">
            {user?.consentAt
              ? `You acknowledged the prototype / synthetic-data terms on ${formatDate(user.consentAt)}.`
              : 'No consent on record.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="font-serif text-lg font-semibold">Your data</h2>
          {myCases.length === 0 ? (
            <p className="text-sm text-muted">No cases to manage.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myCases.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{c.title}</span>
                  <DeleteCaseButton caseId={c.id} title={c.title} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DeleteAccountCard />
      <Disclaimer />
    </div>
  );
}
