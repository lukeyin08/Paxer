import { z } from 'zod';

/**
 * Structured-output schemas for AI calls (Section 8). Fields the model must
 * weigh in on use `.nullable()` (required-but-null) so it explicitly returns
 * null rather than guessing (Section 9). A few low-signal fields are `.optional()`
 * (omittable) instead — this keeps the schema under Anthropic's structured-output
 * cap of 16 union-typed parameters (each `.nullable()` is one union). All numeric
 * confidences are 0..1.
 */

export const extractedLineItemSchema = z.object({
  description: z.string(),
  cptHcpcsCode: z.string().nullable(),
  revenueCode: z.string().optional(),
  units: z.number(),
  chargeAmount: z.number().nullable(),
  allowedAmount: z.number().nullable(),
  planPaid: z.number().nullable(),
  patientResponsibility: z.number().nullable(),
  dateOfService: z.string().nullable(),
  // EOB adjustment / reason codes printed for this line, e.g. ["PR-22", "CO-45"].
  // Optional (omittable) so it adds no union to the structured-output schema.
  adjustmentCodes: z.array(z.string()).optional(),
  confidence: z.number(),
});

export const extractedPlanBenefitsSchema = z.object({
  deductible: z.number().nullable(),
  deductibleMet: z.number().nullable(),
  coinsuranceRate: z.number().nullable(),
  copay: z.number().nullable(),
  oopMax: z.number().nullable(),
  oopMet: z.number().nullable(),
  inNetwork: z.boolean().optional(),
});

export const documentExtractionSchema = z.object({
  documentKind: z.enum(['ITEMIZED_BILL', 'EOB', 'DENIAL_LETTER', 'PLAN_SBC', 'OTHER']),
  providerName: z.string().nullable(),
  payerName: z.string().nullable(),
  dateOfService: z.string().nullable(),
  overallConfidence: z.number(),
  lineItems: z.array(extractedLineItemSchema),
  planBenefits: extractedPlanBenefitsSchema.optional(),
  notes: z.string().optional(),
});

export type DocumentExtraction = z.infer<typeof documentExtractionSchema>;
export type ExtractedLineItem = z.infer<typeof extractedLineItemSchema>;

/** Clamp a model-provided confidence into [0,1]. */
export function clampConfidence(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
