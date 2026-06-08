/**
 * Single source of truth for "estimated recoverable" from a set of findings.
 * Caps recovery per line item at what was billed on that line (so two detectors
 * on one line can't sum beyond its charge), EXCEPT duplicate / cross-provider
 * findings whose recovery legitimately spans multiple physical lines, and
 * findings not tied to a line — those are summed uncapped. The whole total is
 * then bounded by total patient responsibility (or total billed if PR is 0).
 *
 * Used by both the in-app audit roll-up (recomputeEstimatedRecoverable) and the
 * embedded /api/v1/audit response, so the public API can never report a larger
 * recoverable than the app would for the same input.
 */
const MULTI_LINE_TYPES = new Set(['DUPLICATE_CHARGE', 'CROSS_PROVIDER_DUPLICATE']);

export interface RecoverableFinding {
  lineItemId: string | null;
  type: string;
  estimatedRecovery: number | null;
}
export interface RecoverableLine {
  id: string;
  charge: number | null;
  patientResponsibility: number | null;
}

export function capRecoverable(
  findings: RecoverableFinding[],
  lineItems: RecoverableLine[],
): number {
  const chargeById = new Map(lineItems.map((i) => [i.id, Number(i.charge) || Infinity]));
  const perLine = new Map<string, number>();
  let unlinkedSum = 0;
  for (const f of findings) {
    const amt = Number(f.estimatedRecovery) || 0;
    if (!f.lineItemId || MULTI_LINE_TYPES.has(f.type)) {
      unlinkedSum += amt;
      continue;
    }
    perLine.set(f.lineItemId, (perLine.get(f.lineItemId) ?? 0) + amt);
  }
  let rawSum = unlinkedSum;
  for (const [id, sum] of perLine) {
    rawSum += Math.min(sum, chargeById.get(id) ?? Infinity);
  }

  const totalPatient = lineItems.reduce((s, i) => s + (Number(i.patientResponsibility) || 0), 0);
  const totalBilled = lineItems.reduce((s, i) => s + (Number(i.charge) || 0), 0);
  const cap = totalPatient > 0 ? totalPatient : totalBilled;
  const total = cap > 0 ? Math.min(rawSum, cap) : rawSum;
  return Math.round(total * 100) / 100;
}
