# Paxer — Business-Model Change Spec (for Claude Code)

**Author:** product/strategy pass · **Target:** implement in the Paxer repo with Claude Code.
**How to use this file:** treat it as the source of truth for *what* to change and *why*.
File paths below are the real ones in this repo as of writing — confirm each against the
working tree before editing, and prefer extending existing code over rebuilding it. Work
**phase by phase**, one PR per phase, running the verification gate (bottom of file) before
moving on.

---

## 1. The decision (what we're committing to)

Paxer keeps the **patient-side** identity, but the **business** is monetized through B2B.
Concretely:

- **Consumer app stays free.** It is the trust wedge, the demo, and the demand-gen / data
  engine — not the revenue line. `PAXER_FEE_RATE` stays `0`. We do **not** reintroduce a
  B2C contingency fee.
- **The Audit API is the immediate revenue product** (self-serve, usage-priced), sold to
  the parties whose incentives align with the patient and who actually have budget:
  patient-billing platforms, **TPAs**, **self-insured employers**, and **HSA/FSA admins**.
- **The "employer benefit / PEPM" lane is scaffolded now, sold later.** We build the
  org/data model so that selling bill-review to an employer as a per-employee benefit is a
  near-term *extension*, not a rewrite. It ships behind a flag and is **not** charged in
  this round.

We are moving from a *hedge* (a free consumer app + a lightly-built API + an "in design"
employer tier) to a *committed, coherent B2B-leaning model* with one product that actually
bills.

### Guardrails — do NOT do these
- ❌ Do **not** re-enable a consumer success/contingency fee (keep `PAXER_FEE_RATE=0`; keep
  the fee plumbing only as B2B value-tracking — see Phase 5).
- ❌ Do **not** position or sell the API to **insurers/health plans as the primary buyer**.
  An insurer's incentive (pay providers less, deny patient claims) only half-aligns with the
  patient and contradicts the "only advocate on the patient's side" promise. Aligned buyers
  are employers/TPAs/HSA-FSA/benefit platforms. (Health plans may remain a "contact us" lane,
  not the wedge.)
- ❌ Do **not** build a full employer admin dashboard / member management UI in this round.
  Scaffold the data model and a minimal read-only savings view behind a flag; stop there.
- ❌ Do **not** touch the audit/dispute *engine* logic (`src/lib/audit/*`,
  `src/lib/ai/*`) except where this spec says to expose it. The model change is commercial,
  not algorithmic.
- ❌ Do **not** send real PHI anywhere new. No new third-party processors without a BAA
  (see LAUNCH.md). Stripe must never receive PHI — only plan/seat/usage metadata.

---

## 2. What already exists (don't rebuild these)

So Claude Code doesn't duplicate work, here's the current state of the model surface:

- **Three-tier pricing page** already drafted: Individuals (Free) · Audit API (Free → Pro
  `$49/mo`) · Employers & health plans ("Let's talk", PEPM/shared-savings, "in design") —
  `src/app/pricing/page.tsx`.
- **Audit API endpoint is live and metered:** `src/app/api/v1/audit/route.ts` — Bearer/`x-api-key`
  auth, fixed-window rate limit (`120/min`), **monthly quota enforcement returning 402 over
  quota**, usage increment. Stateless, deterministic detectors only (no AI, nothing persisted).
- **API key management:** table `api_keys` (SHA-256 hash, prefix, revoke) + repo
  `src/lib/api-keys/repo.ts`, `src/lib/api-keys/keys.ts`; UI at
  `src/app/app/settings/api-keys-client.tsx` (+ `actions.ts`).
- **Usage metering & plans:** table `api_usage` (per user, per `YYYY-MM`), `users.apiPlan`
  (`'free' | 'pro'`), plan defs in `src/lib/billing/plans.ts` (Free quota = env
  `PAXER_FREE_API_QUOTA`, default 100; Pro = 5,000 @ `$49/mo`), snapshot/increment in
  `src/lib/billing/usage.ts`.
- **Developer marketing + docs:** `src/app/developers/page.tsx` (curl example, sample
  response).
- **Fee plumbing (notional):** `src/lib/audit/fees.ts`, `recoveries.feeRate`/`feeAmount`
  columns; `PAXER_FEE_RATE` env (currently 0). No real money moves anywhere; **no Stripe in
  the repo at all.**
- **`users.apiPlan` has no self-serve upgrade path today** — it can only be set manually / by
  seed. That's the biggest functional gap.

**The gaps this spec closes:** (a) real self-serve billing for the API (Stripe), (b) an
**organization/team** layer so keys, usage, and plan belong to a *business account* not a
single user, (c) B2B-committed positioning/copy, (d) employer/PEPM scaffolding behind a flag,
(e) repurposing recoveries as B2B value-tracking.

---

## 3. Phase 1 — Positioning & messaging (no schema; do first)

Goal: the site should read as "free patient tool, powered by an audit engine businesses pay
for," not as a paid consumer service. Low-risk copy/IA changes.

1. **Landing hero** (`src/app/page.tsx`): keep the patient-side promise as the lede. In the
   existing "For businesses & developers" section, sharpen the buyer language from generic
   "businesses" to the named aligned buyers: *"For patient-billing platforms, TPAs,
   self-insured employers, and HSA/FSA admins."* Keep one primary consumer CTA + one
   secondary B2B CTA; don't add a third.
2. **Pricing** (`src/app/pricing/page.tsx`): keep the three tiers; align them to the new plan
   set in Phase 2 (Free / Pro / Scale / Enterprise-contact). Wire the Audit-API CTA to the new
   self-serve checkout (Phase 2) instead of `/login`. Keep the Employers tier as "contact /
   design-partner."
3. **Developers** (`src/app/developers/page.tsx`): add a short "Who uses this" line naming the
   buyer segments and the aligned-incentive framing; link to pricing + "get a key."
4. **Marketing copy module** (`src/lib/marketing.ts`): if you add buyer-segment or B2B value
   copy used by more than one page, put it here so landing/pricing/developers can't drift.
5. **Contact address** (done 2026-06-10): the site is standardized on `hello@paxer.app`
   across `pricing`, `developers`, footer, legal pages, settings, and JSON-LD. (Stand the
   inbox up — see LAUNCH.md.)
6. **Terms** (`src/app/terms/page.tsx`): ensure the "free for individuals / businesses pay for
   the API" split is stated, and that API use is governed by usage/plan terms. Keep the
   "DRAFT pending counsel" banner.

**Acceptance:** site communicates free-B2C + paid-B2B-API coherently; no consumer-paywall
language anywhere; all CTAs resolve; one consistent set of contact addresses.

---

## 4. Phase 2 — Make the Audit API a real, self-serve, billed product

Goal: a business can sign up, get a key, hit the free quota, and **upgrade with a credit
card** without manual intervention. This is the revenue line.

### 4.1 Plans
- In `src/lib/billing/plans.ts`, expand `ApiPlan` and `API_PLANS` to a real ladder. Suggested
  (numbers are the founder's call — leave them easy to change):
  - `free` — 100 audits/mo — `$0`
  - `pro` — 5,000/mo — `$49/mo`
  - `scale` — 50,000/mo — `$299/mo`
  - `enterprise` — custom / "contact us" (not self-serve)
- Add a `stripePriceId?: string` to `PlanDef` (read from env, see §8) so checkout can map
  plan → price. Keep `monthlyQuota` and `priceLabel`.
- Consider an **overage** policy (soft cap + 402, or metered overage). Default to the existing
  **hard cap → 402** behavior unless the founder wants metered overage; if metered, record
  overage units in `api_usage` and bill via Stripe usage records. Flag this as an open
  decision (§10) — don't silently pick metered billing.

### 4.2 Stripe billing (new — nothing exists yet)
- Add `stripe` dependency. Create `src/lib/billing/stripe.ts` (server-only client).
- **Checkout:** a server action / route that creates a Stripe Checkout Session for the chosen
  plan, keyed to the billing account (the **organization** from Phase 3; if Phase 3 isn't done
  yet, key to `users.id` and migrate later). Success/cancel redirect to Settings → Billing.
- **Webhook:** `src/app/api/stripe/webhook/route.ts` (`runtime = 'nodejs'`, raw-body signature
  verification with `STRIPE_WEBHOOK_SECRET`). Handle `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted` → set the account's
  `plan` + `planStatus` + store `stripeCustomerId` / `stripeSubscriptionId`. This is the
  **only** writer of paid plan state — never trust the client.
- **Customer portal:** a "Manage billing" link (Stripe billing portal session) in Settings.
- **Never send PHI to Stripe.** Only email, plan, seat count, usage counts.

### 4.3 Self-serve business onboarding
- Today there's one onboarding (patient). Add a lightweight **business/developer path** that
  doesn't require the patient onboarding (state/consent). Simplest: a "Create a developer/
  business account" entry that lands in **Settings → Developers/Billing** with an org created
  (Phase 3). Don't fork auth — reuse the magic-link sign-in; branch only the post-sign-in
  destination and the org creation.

### 4.4 Settings: Billing
- Add a **Billing** tab/section under `src/app/app/settings/` showing current plan, usage this
  month (reuse `usageSnapshot`), an Upgrade button (checkout), and Manage-billing (portal).
  Keep the existing Developers/API-keys UI.

### 4.5 API surface polish
- Keep the endpoint stateless/deterministic. In `src/app/api/v1/audit/route.ts`, keep the 402
  quota response; make sure the `usage` object it returns reflects org-scoped plan once Phase 3
  lands. Add response headers `X-RateLimit-*` if cheap. Version stays `/api/v1`.
- Add/refresh API docs on `src/app/developers/page.tsx`: auth, request/response schema, error
  codes (401/402/429/400), quota semantics, and a copy-paste curl. Optionally publish a static
  OpenAPI doc.

**Acceptance:** new business can self-serve sign up → generate key → call API → get 402 at
quota → upgrade via Stripe checkout → webhook flips plan → quota raised, all without a DB edit.
Webhook signature-verified. No PHI leaves to Stripe.

---

## 5. Phase 3 — Organization / team layer (the scaffolding that makes B2B real)

Goal: billing, API keys, usage, and plan belong to a **business account (organization)**, not a
single `users` row. This is required for real B2B (multiple developers per customer, one
subscription) and is the foundation the employer/PEPM lane builds on.

### 5.1 Schema (`src/lib/db/schema.ts` + a new Drizzle migration)
Add:

- `organizations`
  - `id uuid pk`
  - `name text not null`
  - `type text not null default 'business'` — enum-ish: `business | employer | tpa | platform`
  - `plan text not null default 'free'` — replaces per-user `apiPlan` as the billing unit
  - `planStatus text` — e.g. `active | past_due | canceled`
  - `stripeCustomerId text`, `stripeSubscriptionId text`
  - `createdAt`, `updatedAt`, `deletedAt`
- `org_members`
  - `orgId uuid fk → organizations.id (cascade)`
  - `userId uuid fk → users.id (cascade)`
  - `role text not null default 'MEMBER'` — `OWNER | ADMIN | MEMBER`
  - pk `(orgId, userId)`; index on `userId`
- Add `orgId uuid` (nullable for back-compat) to **`api_keys`** and **`api_usage`**; index it.
  New keys/usage attach to the org. Keep `userId` for the audit trail.

Migration/back-compat strategy (keep it simple, no data loss):
- On business sign-in / first key creation, **lazily create a personal org** for the user
  (`type='business'`, `OWNER` membership) if they have none, and attach new keys/usage to it.
- `users.apiPlan` becomes a **fallback only**. Read order for plan: org.plan → user.apiPlan →
  `'free'`. Don't drop the column in this round (avoids a destructive migration); mark it
  deprecated in a comment.
- `usageSnapshot`/`incrementUsage` (`src/lib/billing/usage.ts`) and `authenticateApiKey`
  (`src/lib/api-keys/repo.ts`) switch to resolving plan + counting usage **per org** when an
  `orgId` is present, else per user. Quota in `/api/v1/audit` then reflects the org plan.

### 5.2 UI
- Minimal: Settings shows the org name + members (read-only list is fine), and API keys are
  listed under the org. A full team-management UI (invites, role editing) is **out of scope**
  this round — a single OWNER is acceptable. Add a `// TODO: invites` seam.

**Acceptance:** keys/usage/plan resolve at the org level with a per-user fallback; Stripe
subscription attaches to `organizations`, not `users`; existing single-user flows still work.

---

## 6. Phase 4 — Employer-benefit / PEPM scaffolding (behind a flag, NOT charged)

Goal: prove the fundable lane is one extension away, without building the whole thing or
charging for it. Everything here is gated by `PAXER_EMPLOYER_BENEFIT_ENABLED` (default
`false`) and ships dark.

- Reuse `organizations` with `type='employer'`. Add (nullable) employer fields as needed:
  `pepmRateUsd numeric` (notional, like the fee plumbing), `memberCount integer`.
- **Member association:** reuse `org_members` (an employee = a `users` row linked to the
  employer org) and/or a lightweight `member_roster` table (`orgId`, `email`, `externalId`,
  `status`) for CSV-imported rosters that haven't signed up yet. Don't build the importer UI;
  a server action that accepts a CSV is enough, behind the flag.
- **Aggregate savings view (read-only):** a route `src/app/app/org/page.tsx` (flagged) that
  rolls up, for the employer's linked members, total findings $ and **recovered $** from the
  existing `findings` / `recoveries` tables — i.e. "your employees recovered $X." This is the
  PEPM/shared-savings sales artifact. Aggregate only; respect PHI minimization (no individual
  bill detail in the employer view).
- **PEPM pricing** lives in `plans.ts` as a separate, clearly-notional structure; **no Stripe
  wiring for PEPM this round** (employer deals are contract-led; "contact us" stays).

**Acceptance:** with the flag off, zero behavior change. With the flag on (dev), an employer
org can have linked members and show an aggregate recovered-dollars number. Nothing is billed.

---

## 7. Phase 5 — Repurpose the fee plumbing as B2B value-tracking

Goal: keep the contingency machinery *off* for patients but reuse it to quantify the value
Paxer creates — the number that sells the API and the employer benefit.

- Keep `PAXER_FEE_RATE=0`; keep `src/lib/audit/fees.ts` and `recoveries.feeRate/feeAmount`.
- Add read-side aggregation (a repo function, e.g. in `src/lib/billing/` or a new
  `src/lib/value/`) that computes **total recovered $** and **estimated $ found** across a
  user or an org. Surface it: (a) per-patient in their dashboard (already partially present via
  recoveries), (b) per-org in the Phase-4 employer view, (c) optionally an internal/admin
  "total dollars recovered across all users" stat for fundraising/marketing once real.
- Update landing stat blocks (`src/app/page.tsx`) to read from real aggregates **only once
  there's real data** — until then keep them clearly framed as industry estimates (the "$10k+
  saved" / "80% of bills" stats are currently illustrative; don't present them as Paxer's own
  results without data behind them). Flag for founder (§10).

**Acceptance:** a single source of truth for "dollars recovered / found," usable by consumer
UI, employer view, and marketing — with no contingency charge to patients.

---

## 8. Environment variables to add

Add to `src/lib/env.ts` (with the same `optionalString`/coerce pattern already used) and to
`.env.example`:

```
# Stripe (Audit API billing). Server-side only; never sent PHI.
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=            # price_… for the $49/mo Pro plan
STRIPE_PRICE_SCALE=          # price_… for the $299/mo Scale plan
STRIPE_PORTAL_RETURN_URL=    # optional; defaults to AUTH_URL/app/settings

# Employer-benefit lane (Phase 4) — ships dark.
PAXER_EMPLOYER_BENEFIT_ENABLED=false
PAXER_PEPM_RATE_USD=0        # notional, like PAXER_FEE_RATE
```

Keep existing `PAXER_FEE_RATE`, `PAXER_FREE_API_QUOTA`, AI-budget vars. Update the LAUNCH.md
env checklist to include the new Stripe vars and note Stripe needs **no BAA** (no PHI) but
**does** need live keys before charging.

---

## 9. File-by-file change map (quick index)

| File | Change |
| --- | --- |
| `src/app/page.tsx` | Sharpen B2B section to named buyers; stats framed as estimates until real (Ph1/Ph5) |
| `src/app/pricing/page.tsx` | Align to Free/Pro/Scale/Enterprise; wire API CTA to checkout (Ph1/Ph2) |
| `src/app/developers/page.tsx` | Buyer framing + refreshed API docs/errors; consistent contact (Ph1/Ph2) |
| `src/app/terms/page.tsx` | State free-B2C / paid-API split (Ph1) |
| `src/lib/marketing.ts` | Shared B2B buyer/value copy (Ph1) |
| `src/lib/billing/plans.ts` | Expand plan ladder + `stripePriceId` (Ph2) |
| `src/lib/billing/usage.ts` | Resolve plan/usage per org w/ user fallback (Ph3) |
| `src/lib/billing/stripe.ts` | **New** Stripe client (Ph2) |
| `src/app/api/stripe/webhook/route.ts` | **New** signed webhook → plan state (Ph2) |
| checkout + portal action(s) under `src/app/app/settings/` | **New** (Ph2) |
| `src/app/app/settings/*` | Billing tab; keys listed under org (Ph2/Ph3) |
| `src/lib/api-keys/repo.ts` | Attach keys to org; auth resolves org (Ph3) |
| `src/lib/db/schema.ts` + new migration | `organizations`, `org_members`, `orgId` on `api_keys`/`api_usage`; employer fields (Ph3/Ph4) |
| `src/app/app/org/page.tsx` | **New, flagged** aggregate savings view (Ph4) |
| `src/lib/value/*` (or `billing/`) | **New** recovered/found aggregation (Ph5) |
| `src/lib/env.ts`, `.env.example` | New env vars (Ph8) |
| `LAUNCH.md`, `README.md` | Update model description, env checklist, Stripe note |

---

## 10. Open decisions to confirm with the founder (don't guess)
1. **Overage:** hard cap → 402 (default) vs. metered overage billing? Affects Stripe + usage.
2. **Plan prices/quotas:** the `$49 / $299 / 50k` numbers are placeholders.
3. **Contact addresses:** decided — `hello@paxer.app` is the single contact address site-wide
   (2026-06-10). Confirm the inbox exists.
4. **Marketing stats:** keep "80% / $10k+" as labeled industry estimates, or pull them until
   Paxer has its own data? (Recommend: label clearly, don't claim as Paxer results.)
5. **Health plans as buyers:** keep them only as a "contact" lane (recommended), or exclude
   entirely from copy?

---

## 11. Verification gate (run after each phase)

```bash
pnpm install
pnpm typecheck      # tsc --noEmit — must pass
pnpm lint           # eslint
pnpm test           # vitest — unit tests incl. fees/usage
pnpm build          # production build must pass
# DB changes:
pnpm db:generate    # generate the new migration from schema
pnpm db:migrate     # apply locally
pnpm seed           # ensure seed still works with org/plan changes
```

Plus manual checks: Stripe webhook (use Stripe CLI `stripe listen` + a test checkout) flips an
org's plan; `/api/v1/audit` returns 402 at quota and a raised quota after upgrade; employer flag
off = no behavior change. Add/extend unit tests for `plans.ts` (new tiers) and org-scoped
`usage.ts` resolution. Keep the engine's existing tests green.

---

## 12. Suggested PR sequence
1. **PR1 — Positioning (Phase 1):** copy/IA only, no schema. Ship immediately.
2. **PR2 — Billing (Phase 2):** plans + Stripe + checkout/webhook/portal + Billing UI. Keys
   stay user-scoped for now.
3. **PR3 — Org layer (Phase 3):** schema + migrate keys/usage/plan to org with user fallback;
   move Stripe subscription onto the org.
4. **PR4 — Employer scaffolding (Phase 4):** flagged tables + read-only savings view.
5. **PR5 — Value-tracking (Phase 5):** recovered/found aggregation + wire into UI/marketing.

Ship PR1 and PR2 first — they get you a site that tells the right story and an API that can
actually take money. PR3–PR5 make the fundable employer lane real without committing to the
full build before you have a design partner.
