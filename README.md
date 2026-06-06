# Paxer

**The only advocate on the patient's side of the bill.**

Paxer is a patient-side medical billing advocate. It audits the medical bills and
Explanation of Benefits (EOBs) a patient actually receives, finds the errors that
insurers and providers are content to leave in place, and helps the patient recover
their own money.

> **Prototype notice.** This build runs on **synthetic data only**. Do not enter real
> patient information. Real patient data must not be entered until a compliance program
> and Business Associate Agreements (BAAs) are in place. Paxer is a prototype; estimates
> are not guarantees; drafts must be reviewed by you before any use; this is not legal,
> medical, or financial advice.

---

## Stack

- **Framework:** Next.js (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui primitives, custom black & blue brand theme
- **Database:** Postgres (Vercel Postgres / Neon) via Drizzle ORM
- **Auth:** Auth.js (NextAuth v5), magic link + seeded demo account
- **Storage:** Vercel Blob (uploaded bills / EOBs)
- **AI:** `@anthropic-ai/sdk`, server-side only (ingestion, audit, drafting)
- **Email:** Resend (magic links + deadline reminders)
- **Deploy target:** Vercel (free / hobby tier, no custom infra)

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in values (see below)
pnpm db:migrate        # once Postgres is configured (Phase 1+)
pnpm seed              # load the synthetic demo (Phase 1+)
pnpm dev               # http://localhost:3000
```

### Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm seed` | Seed the synthetic demo (idempotent) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright happy-path e2e |
| `pnpm eval:extract` | AI extraction accuracy eval |

## Environment

See [`.env.example`](.env.example). All secrets are server-side only and are never
shipped to the client.

## Stubbed seams (built as interfaces, not faked as working)

- **Real payer FHIR / CMS Patient Access ingestion** — `MockFhirConnector` returns
  synthetic EOBs. `// TODO(paxer): real FHIR via aggregator (e.g. Flexpa)`.
- **Outbound submission** — "Submit" never contacts a real party; it queues a draft for
  explicit user approval, then records `SIMULATED_SENT`.
- **Payments / Stripe** — success fee and invoice are preview-only; no real money moves.
- **OCR at scale** — uses the Anthropic model's native PDF/image understanding.

## Out of scope (see Section 16 of the spec)

HIPAA program / BAAs / SOC 2 / production PHI handling; mobile apps; employer B2B portal;
multi-tenant orgs; dark mode toggle; i18n. Each is left as a documented seam.

## Build progress

- [x] **Phase 0** — Scaffold: Next.js + TS strict + Tailwind + brand system (black & blue),
      base primitives, landing page.
- [ ] Phase 1 — Data model + auth
- [ ] Phase 2 — Cases + uploads
- [ ] Phase 3 — Ingestion engine
- [ ] Phase 4 — Audit engine
- [ ] Phase 5 — Disputes
- [ ] Phase 6 — Recoveries, fees, benchmarks, cron
- [ ] Phase 7 — Polish, seed, tests, deploy
