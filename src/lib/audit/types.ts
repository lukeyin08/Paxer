import type { Finding, LineItem, PlanBenefit, Case, Benchmark } from '@/lib/db/schema';

export type FindingType = Finding['type'];
export type Severity = Finding['severity'];
export type Detector = Finding['detector'];

/** A finding produced by a detector, before persistence. */
export interface DetectorFinding {
  type: FindingType;
  severity: Severity;
  title: string;
  explanationPlain: string;
  /** Structured evidence that triggered the finding (shown in the UI). */
  evidence: Record<string, unknown>;
  estimatedRecovery: number | null;
  confidence: number;
  detector: Detector;
  lineItemId: string | null;
  /** Recommended next step, plain language (may be enriched by the AI pass). */
  recommendedNextStep?: string;
}

/** Everything a detector needs. Rules run first and constrain the AI pass. */
export interface AuditContext {
  case: Case;
  lineItems: LineItem[];
  planBenefits: PlanBenefit | null;
  /** Line items across the user's other cases, for cross-provider checks. */
  otherCaseLineItems: { lineItem: LineItem; caseId: string; providerName: string | null }[];
  benchmarks: Benchmark[];
  region: string | null;
}

/**
 * Helper: numeric value of a money column (stored as string by pg). Also accepts
 * a number so callers that build line items in-memory (e.g. the /api/v1/audit
 * endpoint) can pass numeric amounts directly.
 */
export function money(value: string | number | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
