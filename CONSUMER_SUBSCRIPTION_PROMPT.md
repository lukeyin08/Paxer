# Claude Code prompt — implement consumer "1 free audit, then subscribe"

Paste everything below into Claude Code at the root of the Paxer repo.

---

Implement a consumer subscription gate for Paxer: **every patient gets 1 free audited case; auditing any further case requires an active "Paxer Plus" subscription.** This is a flat software subscription, NOT a contingency fee — patients still keep 100% of what they recover, and `PAXER_FEE_RATE` stays `0`.

Before writing code, read the current state of these files and reuse what's there — do not rebuild billing infra:
- `src/lib/db/schema.ts` (the `users` table already has `stripeCustomerId`, `stripeSubscriptionId`, `planStatus`, `apiPlan` — these are bound to the **B2B Audit-API** plan; do NOT overload them for consumer billing).
- `src/lib/billing/account.ts` (`getUserBilling`, `getOrCreateStripeCustomer`, `applyPlanFromStripe`), `src/lib/billing/stripe.ts` (`stripeConfigured`, `getStripe`, `billingReturnUrl`), `src/lib/billing/plans.ts` (`API_PLANS`), `src/lib/billing/usage.ts`.
- `src/app/app/settings/billing-actions.ts` (`startCheckout(plan)`, `openBillingPortal()`).
- `src/app/api/stripe/webhook/route.ts` (already exists; extend it).
- The audit entry points: `src/app/app/cases/[id]/audit-actions.ts`, `src/app/app/cases/[id]/run-audit-button.tsx`, and `src/app/api/ingest/route.ts`.
- `src/lib/env.ts`, `.env.example`.
- Marketing/copy that currently claims patients are free: `src/app/pricing/page.tsx`, `src/app/page.tsx`, `src/app/how-it-works/page.tsx`, `src/app/terms/page.tsx`, `src/lib/marketing.ts`, and the `isFree`/`defaultFeeRate()` logic in `src/lib/audit/fees.ts`.

## Entitlement rules (make these the spec)
- A user's **first audited case** is free and fully usable: audit + findings + the first dispute draft are all included, so the free taste is the complete loop. The free allowance is `PAXER_FREE_AUDIT_LIMIT` (default `1`).
- Once the free allowance is consumed, running the audit on a **new** case requires an active Paxer Plus subscription. Plus unlocks unlimited audits and drafts.
- **Never** block viewing or editing cases the user already has (no locking people out of their own data/history). Creating/uploading a case is fine; the gate is on the **audit run**.
- The seeded **demo account bypasses the gate** so reviewers can walk the whole loop.
- Enforce the gate **server-side** at the audit chokepoint(s) — never rely on a hidden button.

## Data model (new Drizzle migration)
Add to `users` (keep them separate from the API-plan columns):
- `consumerPlan text not null default 'free'`  — `'free' | 'plus'`
- `consumerStatus text`                          — `'active' | 'past_due' | 'canceled'`
- `consumerSubscriptionId text`                  — the consumer Stripe subscription id
- `freeAuditsUsed integer not null default 0`
Reuse the existing `stripeCustomerId` (one Stripe customer can hold both the consumer and the API subscription). Generate the migration with `pnpm db:generate`; don't hand-edit SQL.

## Entitlement helper
Create `src/lib/billing/consumer.ts`:
- `CONSUMER_PLAN = { id: 'plus', label: 'Paxer Plus', priceLabel: <from env, default '$12/mo'>, stripePriceId: env.STRIPE_PRICE_CONSUMER }`.
- `getConsumerEntitlement(userId)` → `{ freeAuditsUsed, limit, hasActiveSub, canAudit, isDemo }` where `canAudit = isDemo || hasActiveSub || freeAuditsUsed < limit`.
- `consumeFreeAudit(userId)` — atomically increment `freeAuditsUsed` (only when not subscribed/demo). Call it exactly once per first-time audit of a case, on success.

## Gate enforcement
- In the audit action(s) (`src/app/app/cases/[id]/audit-actions.ts`, and `/api/ingest` if it auto-audits), call `getConsumerEntitlement` first. If `!canAudit`, return a typed "subscription required" result (no audit runs, no AI spend). On a successful first audit of a case, call `consumeFreeAudit`.
- Make the gate idempotent per case: re-running an audit on an already-audited case must not consume another free credit.

## Stripe (reuse existing infra)
- Add `startConsumerCheckout()` to `billing-actions.ts`: `mode: 'subscription'`, `line_items: [{ price: env.STRIPE_PRICE_CONSUMER, quantity: 1 }]`, `customer: await getOrCreateStripeCustomer(userId)`, success/cancel back to the app. Guard with `stripeConfigured()` (return a clear "billing not available yet" when keys are unset, like the existing flow). Reuse `openBillingPortal()` for management.
- Extend `src/app/api/stripe/webhook/route.ts`: branch on the subscription's **price id**. If it's `STRIPE_PRICE_CONSUMER`, update the consumer columns (`consumerPlan`, `consumerStatus`, `consumerSubscriptionId`) via a new `applyConsumerPlanFromStripe(...)` in `account.ts`; otherwise keep the existing API-plan path. Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Keep signature verification; make it idempotent. **Never send PHI to Stripe** — only email + plan/subscription metadata.

## UI
- A paywall view shown when the audit gate blocks a non-subscriber who's used their free audit: explain "You've used your free audit — subscribe to Paxer Plus for unlimited audits and dispute letters," with a Subscribe button calling `startConsumerCheckout()`. Include loading/error states and a "Manage billing" portal link for existing subscribers.
- In Settings, add a consumer-subscription section (status + Manage billing) distinct from the existing Developers/API billing.
- Reflect locked state on the "new case" / "run audit" entry points for users who've used the free audit and aren't subscribed (server enforcement still authoritative). Show "1 free audit used" once consumed.

## Copy sweep (required — the site currently says patients never pay)
Update every place that asserts free/never-pay so the site doesn't contradict the model:
- `src/app/pricing/page.tsx` "Individuals" tier → name it Paxer Plus, price "First audit free, then `$12/mo`", decouple it from the contingency `isFree` logic. Keep "You keep 100% of what you recover — no cut of your recovery" as a feature (still true; it's a selling point vs. contingency competitors). Point the CTA at sign-in/checkout.
- `src/app/page.tsx` hero stat block ("Free for individuals / $0 / we never take a cut") → reframe to "First audit free" + "Keep 100% of recoveries (no contingency)"; update the `isFree`-derived copy.
- `src/app/how-it-works/page.tsx` and `src/app/terms/page.tsx` → update any free/never-pay claims; Terms must describe the subscription: flat software fee (not contingency), billing/auto-renewal, cancellation, and a refunds statement. Keep the "DRAFT — pending counsel" banner.
- `src/lib/marketing.ts` → fix any shared copy.

## Env (add to `src/lib/env.ts` with the existing `optionalString`/coerce pattern, and `.env.example`)
```
STRIPE_PRICE_CONSUMER=        # price_… for the Paxer Plus monthly subscription
PAXER_FREE_AUDIT_LIMIT=1      # free audited cases per user before Plus is required
PAXER_CONSUMER_PRICE_LABEL=$12/mo
```

## Guardrails / out of scope
- Keep `PAXER_FEE_RATE=0` — do not add any contingency/success fee.
- Don't gate viewing/editing existing cases; don't gate creating/uploading a case — only the audit run.
- Free taste must include the first dispute draft (full loop), so value is proven before the paywall.
- Demo/seed account bypasses the gate.
- Add a note to `LAUNCH.md` flagging counsel review for charging consumers to produce dispute letters (UPL, state billing-advocate licensing) and subscription/auto-renewal disclosure law (e.g. CA Automatic Renewal Law). Not a code blocker.

## Phased PRs (do in order; keep each green)
1. Schema migration + `consumer.ts` entitlement helper + env. No behavior change.
2. Server-side audit gate + `consumeFreeAudit`.
3. Stripe consumer checkout + webhook branch + `applyConsumerPlanFromStripe` + portal.
4. UI paywall + Settings consumer-billing section + entry-point states.
5. Copy sweep + `LAUNCH.md` counsel note.

## Acceptance criteria
- New user audits their first case free (full loop incl. first draft).
- Auditing a second case is blocked **server-side** with the upgrade paywall (no AI spend).
- Subscribing via Stripe test (`stripe listen --forward-to localhost:3000/api/stripe/webhook` + test card) flips `consumerStatus` to `active` via the webhook and unblocks auditing.
- Canceling via the billing portal sets `canceled`; the gate re-applies on the next audit.
- Demo account bypasses the gate.
- No remaining "free / never pay" copy contradicts the model.
- No PHI is sent to Stripe.

## Verify before you finish
```
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm db:generate && pnpm db:migrate
```
Add/adjust unit tests for `consumer.ts` (entitlement math) and the webhook price-id branching. Report what you changed, any deviations, and the exact Stripe + env values I still need to set (`STRIPE_PRICE_CONSUMER`, etc.) for it to go live.
