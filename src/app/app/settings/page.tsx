import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cases, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { listApiKeys } from '@/lib/api-keys/repo';
import { usageSnapshot } from '@/lib/billing/usage';
import { checkoutPlans, billingConfigured, planFor } from '@/lib/billing/plans';
import { consumerBillingConfigured, CONSUMER_PLAN } from '@/lib/billing/consumer';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Disclaimer } from '@/components/brand/disclaimer';
import { formatDate } from '@/lib/utils';
import { StateForm, DeleteCaseButton, DeleteAccountCard } from './settings-client';
import { ApiKeysClient } from './api-keys-client';
import { BillingClient } from './billing-client';
import { ConsumerBillingClient } from './consumer-billing-client';

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  const [myCases, allKeys, usage] = await Promise.all([
    db.select().from(cases).where(and(eq(cases.userId, sessionUser.id), isNull(cases.deletedAt))),
    listApiKeys(sessionUser.id),
    usageSnapshot(sessionUser.id),
  ]);
  const apiKeys = allKeys
    .filter((k) => !k.revokedAt)
    .map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
    }));
  const apiUsage = {
    planLabel: usage.plan.label,
    used: usage.used,
    quota: usage.quota,
    isFreePlan: usage.plan.id === 'free',
    // No self-serve billing yet — upgrade requests come to us by email.
    upgradeHref: 'mailto:ly3569@princeton.edu?subject=Paxer%20API%20upgrade',
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 animate-fade-up">
      <div>
        <Kicker className="mb-2">Settings</Kicker>
        <h1 className="font-sans text-3xl font-semibold">Account</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="font-sans text-lg font-semibold">Profile</h2>
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
          <h2 className="font-sans text-lg font-semibold">Consent record</h2>
          <p className="text-sm text-muted">
            {user?.consentAt
              ? `You agreed to the Terms of Service and Privacy Policy on ${formatDate(user.consentAt)}.`
              : 'No consent on record.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="font-sans text-lg font-semibold">Your data</h2>
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

      <Card id="plus">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <h2 className="font-sans text-lg font-semibold">Paxer Plus</h2>
            <p className="text-sm text-muted">
              Your first bill audit is free. Paxer Plus unlocks unlimited audits and dispute
              letters — a flat subscription, never a cut of what you recover.
            </p>
          </div>
          <ConsumerBillingClient
            plan={user?.consumerPlan ?? 'free'}
            status={user?.consumerStatus ?? null}
            priceLabel={CONSUMER_PLAN.priceLabel}
            configured={consumerBillingConfigured()}
            hasCustomer={!!user?.stripeCustomerId}
          />
        </CardContent>
      </Card>

      <Card id="billing">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <h2 className="font-sans text-lg font-semibold">Billing — Audit API</h2>
            <p className="text-sm text-muted">
              The consumer app is free. The Audit API is usage-priced for businesses.
            </p>
          </div>
          <BillingClient
            planLabel={planFor(user?.apiPlan).label}
            planId={user?.apiPlan ?? 'free'}
            used={usage.used}
            quota={usage.quota}
            hasSubscription={!!user?.stripeSubscriptionId}
            billingConfigured={billingConfigured()}
            checkoutPlans={checkoutPlans().map((p) => ({
              id: p.id,
              label: p.label,
              priceLabel: p.priceLabel,
            }))}
          />
        </CardContent>
      </Card>

      <Card id="developers">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <h2 className="font-sans text-lg font-semibold">Developers — Audit API</h2>
            <p className="text-sm text-muted">
              Run Paxer’s deterministic audit engine on your own line items via API.
            </p>
          </div>
          <ApiKeysClient keys={apiKeys} usage={apiUsage} />
        </CardContent>
      </Card>

      <DeleteAccountCard />
      <Disclaimer />
    </div>
  );
}
