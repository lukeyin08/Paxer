/**
 * A SMALL, clearly-sourced seed of commonly-bundled code pairs (Section 7.6).
 * This is NOT a complete NCCI dataset. Findings from it are marked "potential"
 * and always require human review. The comprehensive NCCI edits are a documented
 * future data-licensing task.
 *
 * // TODO(paxer): license the full CMS NCCI Procedure-to-Procedure edits.
 */
export interface BundledPair {
  // If both codes appear separately billed, the secondary is typically bundled
  // into the primary.
  primary: string;
  secondary: string;
  note: string;
}

export const BUNDLED_PAIRS: BundledPair[] = [
  {
    primary: '80053',
    secondary: '80048',
    note: 'A basic metabolic panel (80048) is a component of a comprehensive metabolic panel (80053).',
  },
  {
    primary: '93000',
    secondary: '93005',
    note: 'ECG tracing-only (93005) is a component of the complete ECG (93000).',
  },
  {
    primary: '45378',
    secondary: '45380',
    note: 'Diagnostic colonoscopy (45378) is bundled when a colonoscopy with biopsy (45380) is performed in the same session.',
  },
  {
    primary: '99213',
    secondary: '36415',
    note: 'Routine venipuncture (36415) is often bundled into an office visit (99213).',
  },
];

export function findBundledViolation(codes: string[]): BundledPair[] {
  const present = new Set(codes.filter(Boolean));
  return BUNDLED_PAIRS.filter((p) => present.has(p.primary) && present.has(p.secondary));
}
