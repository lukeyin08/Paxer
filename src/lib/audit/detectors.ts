import { formatUsd } from '@/lib/utils';
import { computeExpectedPatientResponsibility } from './cost-share';
import { findBundledViolation } from './ncci';
import { type AuditContext, type DetectorFinding, money } from './types';
import type { LineItem } from '@/lib/db/schema';

const COST_SHARE_THRESHOLD = 5; // dollars; ignore tiny rounding deltas
const BENCHMARK_FLAG_MULTIPLIER = 1.0; // charge above p75 triggers a benchmark note

function dateKey(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : 'unknown';
}

// ---------------------------------------------------------------------------
// Duplicate charge (rule): same code + date + amount more than once.
// ---------------------------------------------------------------------------
export function detectDuplicates(ctx: AuditContext): DetectorFinding[] {
  const findings: DetectorFinding[] = [];
  const groups = new Map<string, LineItem[]>();
  for (const li of ctx.lineItems) {
    const key = `${li.cptHcpcsCode ?? li.description.toLowerCase()}|${dateKey(li.dateOfService)}|${li.chargeAmount ?? ''}`;
    const arr = groups.get(key) ?? [];
    arr.push(li);
    groups.set(key, arr);
  }
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    const dupes = arr.slice(1); // the extra occurrences
    const charge = money(arr[0]!.chargeAmount) ?? 0;
    const recovery = charge * dupes.length;
    findings.push({
      type: 'DUPLICATE_CHARGE',
      severity: 'HIGH',
      title: `Duplicate charge: ${arr[0]!.description}`,
      explanationPlain: `This charge appears ${arr.length} times on the same date for the same amount (${formatUsd(charge)} each). A service performed once should be billed once. The extra ${dupes.length} appears to be a duplicate.`,
      evidence: {
        description: arr[0]!.description,
        code: arr[0]!.cptHcpcsCode,
        date: dateKey(arr[0]!.dateOfService),
        occurrences: arr.length,
        chargeEach: charge,
      },
      estimatedRecovery: recovery,
      confidence: 0.9,
      detector: 'RULE',
      lineItemId: dupes[0]!.id,
      recommendedNextStep:
        'Ask the provider to remove the duplicate line and reissue a corrected itemized bill.',
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Cost-share error (rule): recompute expected patient responsibility.
// ---------------------------------------------------------------------------
export function detectCostShareErrors(ctx: AuditContext): DetectorFinding[] {
  const plan = ctx.planBenefits;
  if (!plan) return [];
  const findings: DetectorFinding[] = [];
  for (const li of ctx.lineItems) {
    const allowed = money(li.allowedAmount);
    const billed = money(li.patientResponsibility);
    if (allowed === null || billed === null) continue;
    if (allowed <= 0) continue;

    const breakdown = computeExpectedPatientResponsibility(allowed, {
      deductible: money(plan.deductible),
      deductibleMet: money(plan.deductibleMet),
      coinsuranceRate: plan.coinsuranceRate,
      copay: money(plan.copay),
      oopMax: money(plan.oopMax),
      oopMet: money(plan.oopMet),
    });
    const delta = billed - breakdown.expectedPatientResponsibility;
    if (delta > COST_SHARE_THRESHOLD) {
      findings.push({
        type: 'COST_SHARE_ERROR',
        severity: delta > 200 ? 'HIGH' : 'MED',
        title: `You may have been overcharged your share: ${li.description}`,
        explanationPlain: `Based on your plan, your expected share of this ${formatUsd(allowed)} allowed amount is about ${formatUsd(breakdown.expectedPatientResponsibility)} (deductible ${formatUsd(breakdown.appliedToDeductible)} + coinsurance ${formatUsd(breakdown.coinsurance)}${breakdown.copay ? ` + copay ${formatUsd(breakdown.copay)}` : ''}). You were billed ${formatUsd(billed)}, about ${formatUsd(delta)} more than expected.`,
        evidence: {
          description: li.description,
          allowed,
          billedPatientResponsibility: billed,
          expectedPatientResponsibility: breakdown.expectedPatientResponsibility,
          breakdown,
          delta,
        },
        estimatedRecovery: Math.round(delta * 100) / 100,
        confidence: 0.85,
        detector: 'RULE',
        lineItemId: li.id,
        recommendedNextStep:
          'Ask your insurer to reprocess the claim and recalculate your cost-share per your plan benefits.',
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Out-of-pocket maximum overrun (rule).
// ---------------------------------------------------------------------------
export function detectOopOverrun(ctx: AuditContext): DetectorFinding[] {
  const plan = ctx.planBenefits;
  if (!plan) return [];
  const oopMax = money(plan.oopMax);
  const oopMet = money(plan.oopMet);
  if (oopMax === null) return [];
  const totalPatient = ctx.lineItems.reduce(
    (s, li) => s + (money(li.patientResponsibility) ?? 0),
    0,
  );
  const cumulative = (oopMet ?? 0) + totalPatient;
  const overage = cumulative - oopMax;
  if (overage > COST_SHARE_THRESHOLD) {
    return [
      {
        type: 'OOP_MAX_OVERRUN',
        severity: 'HIGH',
        title: 'Charges exceed your out-of-pocket maximum',
        explanationPlain: `Your plan's out-of-pocket maximum is ${formatUsd(oopMax)}. With ${formatUsd(oopMet ?? 0)} already met plus ${formatUsd(totalPatient)} billed on this case, your total reaches ${formatUsd(cumulative)} — about ${formatUsd(overage)} past the cap. Once you hit your out-of-pocket maximum, the plan should pay 100%.`,
        evidence: { oopMax, oopMet: oopMet ?? 0, casePatientResponsibility: totalPatient, cumulative, overage },
        estimatedRecovery: Math.round(overage * 100) / 100,
        confidence: 0.8,
        detector: 'RULE',
        lineItemId: null,
        recommendedNextStep:
          'Ask your insurer to apply your out-of-pocket maximum and refund amounts charged above it.',
      },
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Balance billing / No Surprises Act (rule + AI context).
// ---------------------------------------------------------------------------
const NSA_CONTEXT = /(emergency|\ber\b|anesthesia|ambulance|radiolog|patholog|assistant surgeon)/i;

export function detectBalanceBilling(ctx: AuditContext): DetectorFinding[] {
  const plan = ctx.planBenefits;
  const findings: DetectorFinding[] = [];
  const outOfNetwork = plan ? !plan.inNetwork : false;
  for (const li of ctx.lineItems) {
    const allowed = money(li.allowedAmount);
    const billed = money(li.patientResponsibility);
    const planPaid = money(li.planPaid) ?? 0;
    if (allowed === null || billed === null || allowed <= 0) continue;

    const looksProtected = NSA_CONTEXT.test(li.description);
    const balanceBilled = billed + planPaid - allowed; // billed above the allowed amount
    if (outOfNetwork && looksProtected && balanceBilled > COST_SHARE_THRESHOLD) {
      const expectedInNetwork = allowed * (plan?.coinsuranceRate ?? 0.2);
      const recovery = Math.max(0, billed - expectedInNetwork);
      findings.push({
        type: 'BALANCE_BILLING_NSA',
        severity: 'HIGH',
        title: `Possible surprise bill: ${li.description}`,
        explanationPlain: `This looks like an out-of-network emergency or ancillary service. The No Surprises Act generally limits your responsibility to your in-network cost-share (about ${formatUsd(expectedInNetwork)} here), yet you were billed ${formatUsd(billed)} — roughly ${formatUsd(balanceBilled)} above the allowed amount. That balance may not be billable to you.`,
        evidence: { description: li.description, allowed, billedPatientResponsibility: billed, planPaid, balanceBilled, expectedInNetwork },
        estimatedRecovery: Math.round(recovery * 100) / 100,
        confidence: 0.65,
        detector: 'RULE+AI',
        lineItemId: li.id,
        recommendedNextStep:
          'Invoke the No Surprises Act with the provider and insurer; request reprocessing at your in-network cost-share.',
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Non-covered service billed to patient after denial (rule).
// ---------------------------------------------------------------------------
export function detectNonCoveredBilled(ctx: AuditContext): DetectorFinding[] {
  const findings: DetectorFinding[] = [];
  for (const li of ctx.lineItems) {
    const allowed = money(li.allowedAmount);
    const planPaid = money(li.planPaid);
    const billed = money(li.patientResponsibility);
    const denied = /deni|not covered|non-?covered/i.test(li.description);
    if (billed && billed > 0 && allowed === 0 && (planPaid ?? 0) === 0 && denied) {
      findings.push({
        type: 'NON_COVERED_BILLED_TO_PATIENT',
        severity: 'MED',
        title: `Denied claim billed to you: ${li.description}`,
        explanationPlain: `This claim was denied (often as out-of-network or "not medically necessary") and the full ${formatUsd(billed)} was passed to you. Denials are frequently overturned on appeal, especially when the service was necessary or network adequacy was lacking.`,
        evidence: { description: li.description, billedPatientResponsibility: billed },
        estimatedRecovery: billed,
        confidence: 0.5,
        detector: 'RULE',
        lineItemId: li.id,
        recommendedNextStep:
          'File a first-level appeal with your insurer requesting reconsideration of the denial.',
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Unbundling (rule, seed NCCI pairs).
// ---------------------------------------------------------------------------
export function detectUnbundling(ctx: AuditContext): DetectorFinding[] {
  const codes = ctx.lineItems.map((li) => li.cptHcpcsCode ?? '').filter(Boolean);
  const violations = findBundledViolation(codes);
  return violations.map((v) => {
    const secondary = ctx.lineItems.find((li) => li.cptHcpcsCode === v.secondary);
    const charge = secondary ? (money(secondary.chargeAmount) ?? 0) : 0;
    return {
      type: 'UNBUNDLING_NCCI' as const,
      severity: 'MED' as const,
      title: `Potential unbundling: ${v.primary} and ${v.secondary}`,
      explanationPlain: `${v.note} Billing both separately ("unbundling") can inflate the total. This is a potential issue that needs human review, not a certainty.`,
      evidence: { pair: v, secondaryCharge: charge },
      estimatedRecovery: charge || null,
      confidence: 0.55,
      detector: 'RULE' as const,
      lineItemId: secondary?.id ?? null,
      recommendedNextStep:
        'Ask the provider to confirm whether these codes should have been bundled per NCCI edits.',
    };
  });
}

// ---------------------------------------------------------------------------
// Cross-provider duplicate (rule, across the user's cases).
// ---------------------------------------------------------------------------
export function detectCrossProviderDuplicates(ctx: AuditContext): DetectorFinding[] {
  const findings: DetectorFinding[] = [];
  for (const li of ctx.lineItems) {
    if (!li.cptHcpcsCode || !li.dateOfService) continue;
    const match = ctx.otherCaseLineItems.find(
      (o) =>
        o.lineItem.cptHcpcsCode === li.cptHcpcsCode &&
        dateKey(o.lineItem.dateOfService) === dateKey(li.dateOfService) &&
        o.providerName !== ctx.case.providerName,
    );
    if (match) {
      const charge = money(li.chargeAmount) ?? 0;
      findings.push({
        type: 'CROSS_PROVIDER_DUPLICATE',
        severity: 'MED',
        title: `Same service billed by two providers: ${li.description}`,
        explanationPlain: `Code ${li.cptHcpcsCode} on ${dateKey(li.dateOfService)} also appears on a bill from ${match.providerName ?? 'another provider'}. The same service billed by two providers for one encounter may be a double charge.`,
        evidence: {
          code: li.cptHcpcsCode,
          date: dateKey(li.dateOfService),
          thisProvider: ctx.case.providerName,
          otherProvider: match.providerName,
          charge,
        },
        estimatedRecovery: charge || null,
        confidence: 0.6,
        detector: 'RULE',
        lineItemId: li.id,
        recommendedNextStep:
          'Compare both bills and ask each provider which one actually performed the service.',
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Benchmark overcharge (rule, using seeded regional benchmarks).
// ---------------------------------------------------------------------------
export function detectBenchmarkOvercharge(ctx: AuditContext): DetectorFinding[] {
  if (ctx.benchmarks.length === 0) return [];
  const byCode = new Map(ctx.benchmarks.map((b) => [b.cptHcpcsCode, b]));
  const findings: DetectorFinding[] = [];
  for (const li of ctx.lineItems) {
    if (!li.cptHcpcsCode) continue;
    const charge = money(li.chargeAmount);
    const bench = byCode.get(li.cptHcpcsCode);
    if (!bench || charge === null) continue;
    const p75 = money(bench.p75);
    const median = money(bench.medianCharge);
    if (p75 === null || charge <= p75 * BENCHMARK_FLAG_MULTIPLIER) continue;
    const over = charge - (median ?? p75);
    findings.push({
      type: 'OTHER',
      severity: 'LOW',
      title: `Charge above the regional benchmark: ${li.description}`,
      explanationPlain: `This ${formatUsd(charge)} charge for code ${li.cptHcpcsCode} is above the 75th percentile (${formatUsd(p75)}) for your area; the regional median is about ${formatUsd(median ?? 0)}. A higher-than-typical price is worth questioning, though prices vary.`,
      evidence: { code: li.cptHcpcsCode, charge, regionMedian: median, p75, region: bench.region, sampleSize: bench.sampleSize },
      estimatedRecovery: over > 0 ? Math.round(over * 100) / 100 : null,
      confidence: 0.45,
      detector: 'RULE',
      lineItemId: li.id,
      recommendedNextStep:
        'Ask the provider for a price closer to the regional benchmark, or request a self-pay/prompt-pay discount.',
    });
  }
  return findings;
}

/** All deterministic detectors. */
export function runRuleDetectors(ctx: AuditContext): DetectorFinding[] {
  return [
    ...detectDuplicates(ctx),
    ...detectCostShareErrors(ctx),
    ...detectOopOverrun(ctx),
    ...detectBalanceBilling(ctx),
    ...detectNonCoveredBilled(ctx),
    ...detectUnbundling(ctx),
    ...detectCrossProviderDuplicates(ctx),
    ...detectBenchmarkOvercharge(ctx),
  ];
}
