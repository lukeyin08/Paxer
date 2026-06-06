import { env } from '@/lib/env';

/**
 * Success-fee computation (Section 7.10). Pure and unit-testable. The fee is a
 * share of dollars actually returned to the patient; default rate is configurable
 * via PAXER_FEE_RATE. No real money moves in this build (Stripe is a stubbed seam).
 */
export function defaultFeeRate(): number {
  return env.PAXER_FEE_RATE;
}

export function computeFee(amount: number, feeRate = defaultFeeRate()): number {
  return Math.round(amount * feeRate * 100) / 100;
}

export function patientKeeps(amount: number, feeRate = defaultFeeRate()): number {
  return Math.round((amount - computeFee(amount, feeRate)) * 100) / 100;
}
