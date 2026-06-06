/**
 * Cost-share recompute (Section 7.6) — the highest-trust detector's math, kept
 * pure for unit testing. Given a claim's allowed amount and the member's plan
 * benefits, compute the patient's expected responsibility.
 *
 * This is an estimate based on a single-claim snapshot of the deductible/OOP
 * counters; it is always labeled as an estimate in the UI (Section 9).
 */
export interface PlanInputs {
  deductible: number | null;
  deductibleMet: number | null;
  coinsuranceRate: number | null; // 0..1
  copay: number | null;
  oopMax: number | null;
  oopMet: number | null;
}

export interface CostShareBreakdown {
  allowed: number;
  appliedToDeductible: number;
  coinsurance: number;
  copay: number;
  expectedPatientResponsibility: number;
  cappedByOopMax: boolean;
}

export function computeExpectedPatientResponsibility(
  allowed: number,
  plan: PlanInputs,
): CostShareBreakdown {
  const deductible = plan.deductible ?? 0;
  const deductibleMet = plan.deductibleMet ?? 0;
  const coinsuranceRate = plan.coinsuranceRate ?? 0;
  const copay = plan.copay ?? 0;
  const oopMax = plan.oopMax;
  const oopMet = plan.oopMet ?? 0;

  const remainingDeductible = Math.max(0, deductible - deductibleMet);
  const appliedToDeductible = Math.min(Math.max(0, allowed), remainingDeductible);
  const afterDeductible = Math.max(0, allowed - appliedToDeductible);
  const coinsurance = round2(afterDeductible * coinsuranceRate);

  let expected = round2(appliedToDeductible + coinsurance + copay);

  let cappedByOopMax = false;
  if (oopMax !== null) {
    const remainingOop = Math.max(0, oopMax - oopMet);
    if (expected > remainingOop) {
      expected = round2(remainingOop);
      cappedByOopMax = true;
    }
  }

  return {
    allowed,
    appliedToDeductible: round2(appliedToDeductible),
    coinsurance,
    copay,
    expectedPatientResponsibility: expected,
    cappedByOopMax,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
