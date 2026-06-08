import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lineItemInputSchema, planBenefitsInputSchema } from '@/lib/domain/line-item';
import { runRuleDetectors } from '@/lib/audit/detectors';
import { capRecoverable } from '@/lib/audit/recoverable';
import type { AuditContext } from '@/lib/audit/types';
import type { LineItem, PlanBenefit, Case } from '@/lib/db/schema';
import { authenticateApiKey } from '@/lib/api-keys/repo';
import { extractApiKey } from '@/lib/api-keys/keys';
import { enforceRateLimit, RateLimitError } from '@/lib/rate-limit';
import { usageSnapshot, incrementUsage } from '@/lib/billing/usage';

export const runtime = 'nodejs';

const bodySchema = z.object({
  lineItems: z.array(lineItemInputSchema).min(1).max(200),
  planBenefits: planBenefitsInputSchema.optional().nullable(),
});

const err = (status: number, message: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: message, ...extra }, { status });

/**
 * Embedded audit API (B2B). Authenticate with an API key, run the deterministic
 * audit engine over caller-supplied line items + plan benefits, and return
 * findings. Stateless: nothing is persisted, no AI is called.
 *
 *   curl -X POST https://<host>/api/v1/audit \
 *     -H "Authorization: Bearer pax_live_..." \
 *     -H "Content-Type: application/json" \
 *     -d '{"lineItems":[{"description":"CT scan","cptHcpcsCode":"70450","chargeAmount":1200,"allowedAmount":600,"planPaid":0,"patientResponsibility":1200}]}'
 */
export async function POST(req: NextRequest) {
  const presented = extractApiKey(req.headers);
  if (!presented) {
    return err(401, 'Missing API key. Send "Authorization: Bearer <key>" or "x-api-key: <key>".');
  }
  const user = await authenticateApiKey(presented);
  if (!user) return err(401, 'Invalid or revoked API key.');

  try {
    await enforceRateLimit(`api-audit:${user.id}`, 120, 60, 'API requests');
  } catch (e) {
    if (e instanceof RateLimitError) {
      return err(429, e.message, { retryAfterSeconds: e.retryAfterSec });
    }
    throw e;
  }

  // Monthly plan quota (billing). Over the free quota → 402 with an upgrade hint.
  const usage = await usageSnapshot(user.id);
  if (usage.overQuota) {
    return err(
      402,
      `Monthly ${usage.plan.label} quota reached (${usage.quota} audits). Upgrade your plan for more.`,
      { plan: usage.plan.id, used: usage.used, quota: usage.quota },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return err(400, 'Request body must be valid JSON.');
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return err(400, 'Invalid request body.', { details: parsed.error.flatten() });
  }

  // Map caller input onto the internal line-item / plan-benefit shapes. money()
  // inside the detectors accepts numbers directly, so no DB round-trip is needed.
  const now = new Date();
  const lineItems = parsed.data.lineItems.map((it, i) => ({
    id: `li-${i}`,
    caseId: 'api',
    documentId: null,
    description: it.description,
    cptHcpcsCode: it.cptHcpcsCode ?? null,
    revenueCode: it.revenueCode ?? null,
    adjustmentCodes: it.adjustmentCodes ?? null,
    units: it.units ?? 1,
    chargeAmount: it.chargeAmount ?? null,
    allowedAmount: it.allowedAmount ?? null,
    planPaid: it.planPaid ?? null,
    patientResponsibility: it.patientResponsibility ?? null,
    dateOfService: it.dateOfService ? new Date(it.dateOfService) : null,
    sourceConfidence: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })) as unknown as LineItem[];

  const pb = parsed.data.planBenefits;
  const planBenefits = pb
    ? ({
        deductible: pb.deductible ?? null,
        deductibleMet: pb.deductibleMet ?? null,
        coinsuranceRate: pb.coinsuranceRate ?? null,
        copay: pb.copay ?? null,
        oopMax: pb.oopMax ?? null,
        oopMet: pb.oopMet ?? null,
        inNetwork: pb.inNetwork ?? true,
      } as unknown as PlanBenefit)
    : null;

  const ctx: AuditContext = {
    case: { id: 'api', providerName: null } as unknown as Case,
    lineItems,
    planBenefits,
    otherCaseLineItems: [],
    benchmarks: [],
    region: null,
  };

  const findings = runRuleDetectors(ctx);
  const lineIndexOf = (id: string | null) => {
    const m = id?.match(/^li-(\d+)$/);
    return m ? Number(m[1]) : null;
  };

  const out = findings.map((f) => ({
    type: f.type,
    severity: f.severity,
    title: f.title,
    explanation: f.explanationPlain,
    recommendedNextStep: f.recommendedNextStep ?? null,
    estimatedRecovery: f.estimatedRecovery,
    confidence: f.confidence,
    detector: f.detector,
    lineItemIndex: lineIndexOf(f.lineItemId),
  }));
  // Same per-line + case cap the in-app audit applies, so the public API never
  // reports a recoverable larger than the app would for identical input.
  const estimatedRecoverable = capRecoverable(
    findings,
    parsed.data.lineItems.map((it, i) => ({
      id: `li-${i}`,
      charge: it.chargeAmount ?? null,
      patientResponsibility: it.patientResponsibility ?? null,
    })),
  );

  await incrementUsage(user.id);

  return NextResponse.json({
    findings: out,
    summary: { findingCount: out.length, estimatedRecoverable },
    usage: { plan: usage.plan.id, used: usage.used + 1, quota: usage.quota },
  });
}
