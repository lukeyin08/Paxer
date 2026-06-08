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
    // A duplicate must have a real charge to be a duplicate worth flagging.
    // Without this, EOB-only items that share a code+date but carry no amount
    // collapse into one group and produce a $0 "duplicate" false positive.
    if (li.chargeAmount == null || Number(li.chargeAmount) === 0) continue;
    const key = `${li.cptHcpcsCode ?? li.description.toLowerCase()}|${dateKey(li.dateOfService)}|${li.chargeAmount}`;
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

    // Plan paid nothing and the entire allowed amount went to the patient — that's
    // a denial / coordination-of-benefits pattern handled by detectNonCoveredBilled.
    // Don't ALSO flag it as a cost-share miscalculation (it isn't one) — that would
    // report the same dollars twice under the wrong cause.
    const planPaid = money(li.planPaid) ?? 0;
    if (planPaid <= 0.01 && billed >= allowed - 0.01) continue;

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
    // The recoverable amount on THIS case can't exceed what the patient was
    // actually billed here — when oopMet already exceeds oopMax from prior
    // (other-case) spend, `overage` includes that prior overspend, which isn't
    // recoverable from this case's charges. Bound the finding accordingly.
    const recoverable = Math.min(overage, totalPatient);
    return [
      {
        type: 'OOP_MAX_OVERRUN',
        severity: 'HIGH',
        title: 'Charges exceed your out-of-pocket maximum',
        explanationPlain: `Your plan's out-of-pocket maximum is ${formatUsd(oopMax)}. With ${formatUsd(oopMet ?? 0)} already met plus ${formatUsd(totalPatient)} billed on this case, your total reaches ${formatUsd(cumulative)} — about ${formatUsd(overage)} past the cap. Once you hit your out-of-pocket maximum, the plan should pay 100%.`,
        evidence: { oopMax, oopMet: oopMet ?? 0, casePatientResponsibility: totalPatient, cumulative, overage, recoverable },
        estimatedRecovery: Math.round(recoverable * 100) / 100,
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
/**
 * Interpret EOB patient-responsibility (PR) reason codes so a denial finding can
 * name the cause precisely. Returns null when no PR code clearly identifies a
 * denial type (the caller then uses generic denial language).
 */
function classifyDenial(
  codes: string[] | null | undefined,
): { label: string; why: string; nextStep: string } | null {
  if (!codes || codes.length === 0) return null;
  const norm = codes.map((c) => c.toUpperCase().replace(/[^A-Z0-9]/g, '')); // "PR-22" -> "PR22"
  const has = (...cs: string[]) => norm.some((n) => cs.includes(n));

  if (has('PR22', 'PR23')) {
    return {
      label: 'coordination-of-benefits denial (reason code PR-22)',
      why: 'Your insurer denied this saying another plan may be primary (coordination of benefits) — so it is not a true patient charge, it is a routing problem.',
      nextStep:
        'Submit the primary plan’s EOB to this insurer, or — if you have no other coverage — call them to correct your coordination-of-benefits record so the claim reprocesses. Do not pay until it has been reprocessed.',
    };
  }
  if (has('PR96', 'PR204', 'PR49', 'PR149', 'PR50')) {
    const code = norm.find((n) => ['PR96', 'PR204', 'PR49', 'PR149', 'PR50'].includes(n));
    return {
      label: `non-covered denial (reason code ${code?.replace(/^(PR)(\d+)$/, '$1-$2')})`,
      why: 'Your insurer denied this as not covered or not medically necessary.',
      nextStep:
        'If the service was medically necessary and a covered benefit, file a first-level appeal citing your plan documents and the provider’s notes.',
    };
  }
  if (has('PR31', 'PR27', 'PR26', 'PR177')) {
    return {
      label: 'an eligibility/coverage denial',
      why: 'Your insurer denied this for an eligibility or coverage-date reason.',
      nextStep:
        'Confirm your member ID and coverage dates with the insurer, correct any enrollment error, and ask them to reprocess the claim.',
    };
  }
  return null;
}

export function detectNonCoveredBilled(ctx: AuditContext): DetectorFinding[] {
  const findings: DetectorFinding[] = [];
  const plan = ctx.planBenefits;
  // Deductible the patient could still legitimately owe — a plan-paid-$0 amount
  // up to this is just the deductible, not a denial worth disputing.
  const remainingDeductible = plan
    ? Math.max(0, (money(plan.deductible) ?? 0) - (money(plan.deductibleMet) ?? 0))
    : 0;

  for (const li of ctx.lineItems) {
    const allowed = money(li.allowedAmount);
    const planPaid = money(li.planPaid) ?? 0;
    const patient = money(li.patientResponsibility);
    if (patient === null || patient < COST_SHARE_THRESHOLD) continue;
    const descDenied = /deni|not covered|non-?covered/i.test(li.description);

    // Case A — explicitly non-covered/denied line with $0 allowed.
    if (allowed === 0 && planPaid <= 0.01 && descDenied) {
      findings.push({
        type: 'NON_COVERED_BILLED_TO_PATIENT',
        severity: 'MED',
        title: `Denied claim billed to you: ${li.description}`,
        explanationPlain: `This claim was denied (often as out-of-network or "not medically necessary") and the full ${formatUsd(patient)} was passed to you. Denials are frequently overturned on appeal, especially when the service was necessary or network adequacy was lacking.`,
        evidence: { description: li.description, billedPatientResponsibility: patient },
        estimatedRecovery: patient,
        confidence: 0.5,
        detector: 'RULE',
        lineItemId: li.id,
        recommendedNextStep:
          'File a first-level appeal with your insurer requesting reconsideration of the denial.',
      });
      continue;
    }

    // Case B — the service WAS allowed, but the plan paid $0 and the entire
    // allowed amount landed on the patient, beyond any remaining deductible.
    // That's the signature of a denial or coordination-of-benefits issue (e.g.
    // EOB reason code PR-22), which are frequently reversed.
    const denial = classifyDenial(li.adjustmentCodes);
    const fullAllowedToPatient =
      allowed !== null && allowed > 0 && planPaid <= 0.01 && patient >= allowed - 0.01;
    // A denial reason code (PR-22 etc.) is authoritative. Without one, "plan paid
    // nothing" only distinguishes a denial from an unmet deductible when we have
    // plan benefits showing the deductible can't account for it. With neither a
    // code nor plan benefits we can't tell — so stay silent rather than over-claim
    // recoverable dollars on what may be a legitimate deductible.
    const deductibleRulesOut = plan !== null && patient > remainingDeductible + COST_SHARE_THRESHOLD;
    if (fullAllowedToPatient && (denial !== null || deductibleRulesOut)) {
      findings.push({
        type: 'NON_COVERED_BILLED_TO_PATIENT',
        severity: 'HIGH',
        title: denial
          ? `Denial billed to you — ${denial.label}: ${li.description}`
          : `Plan paid nothing — full amount billed to you: ${li.description}`,
        explanationPlain: denial
          ? `Your plan allowed ${formatUsd(allowed!)} for this service but paid $0, and the full ${formatUsd(patient)} was passed to you under ${denial.label}. ${denial.why} Denials like this are frequently reversed.`
          : `Your plan allowed ${formatUsd(allowed!)} for this service but paid $0, leaving the entire ${formatUsd(patient)} on you — and that isn't explained by your deductible or coinsurance. When a plan pays nothing on an allowed service, it usually means the claim was denied or routed to another payer (e.g. a coordination-of-benefits issue, reason code PR-22). These are frequently reversed.`,
        evidence: {
          description: li.description,
          allowed,
          planPaid,
          billedPatientResponsibility: patient,
          reasonCodes: li.adjustmentCodes ?? null,
        },
        estimatedRecovery: patient,
        confidence: denial ? 0.75 : 0.6,
        detector: 'RULE',
        lineItemId: li.id,
        recommendedNextStep: denial
          ? denial.nextStep
          : 'Ask your insurer for the specific denial / zero-payment reason code, then request reprocessing or a first-level appeal. Do not pay until you have a clear written explanation.',
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
    const matches = ctx.otherCaseLineItems.filter(
      (o) =>
        o.lineItem.cptHcpcsCode === li.cptHcpcsCode &&
        dateKey(o.lineItem.dateOfService) === dateKey(li.dateOfService) &&
        o.providerName !== ctx.case.providerName,
    );
    if (matches.length > 0) {
      const match = matches[0]!;
      const charge = money(li.chargeAmount) ?? 0;
      // The duplicate is symmetric: each colliding case's audit produces a mirror
      // finding. Show it on every bill (good for the patient), but only ONE side
      // counts toward the recoverable total — otherwise the dashboard sums the
      // same recoverable dollar two (or, with 3+ providers, more) times. Only the
      // globally-smallest line-item id across all colliding lines counts.
      const countsRecovery = matches.every((m) => li.id < m.lineItem.id);
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
        estimatedRecovery: countsRecovery ? charge || null : null,
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
  // Prefer the region-specific benchmark over the national ('US') fallback when
  // both exist for a code (the query may return both).
  const byCode = new Map<string, (typeof ctx.benchmarks)[number]>();
  for (const b of ctx.benchmarks) {
    const existing = byCode.get(b.cptHcpcsCode);
    if (!existing || (b.region === ctx.region && existing.region !== ctx.region)) {
      byCode.set(b.cptHcpcsCode, b);
    }
  }
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
