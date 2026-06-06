import { z } from 'zod';

/**
 * Structured-output schemas for AI calls (Section 8). Fields that may be absent
 * are `.nullable()` (required-but-null) rather than `.optional()`, so the model
 * must explicitly return null instead of guessing (Section 9). All numeric
 * confidences are 0..1.
 */

export const extractedLineItemSchema = z.object({
  description: z.string(),
  cptHcpcsCode: z.string().nullable(),
  revenueCode: z.string().nullable(),
  units: z.number(),
  chargeAmount: z.number().nullable(),
  allowedAmount: z.number().nullable(),
  planPaid: z.number().nullable(),
  patientResponsibility: z.number().nullable(),
  dateOfService: z.string().nullable(),
  confidence: z.number(),
});

export const extractedPlanBenefitsSchema = z.object({
  deductible: z.number().nullable(),
  deductibleMet: z.number().nullable(),
  coinsuranceRate: z.number().nullable(),
  copay: z.number().nullable(),
  oopMax: z.number().nullable(),
  oopMet: z.number().nullable(),
  inNetwork: z.boolean().nullable(),
});

export const documentExtractionSchema = z.object({
  documentKind: z.enum(['ITEMIZED_BILL', 'EOB', 'DENIAL_LETTER', 'PLAN_SBC', 'OTHER']),
  providerName: z.string().nullable(),
  payerName: z.string().nullable(),
  dateOfService: z.string().nullable(),
  overallConfidence: z.number(),
  lineItems: z.array(extractedLineItemSchema),
  planBenefits: extractedPlanBenefitsSchema.nullable(),
  notes: z.string().nullable(),
});

export type DocumentExtraction = z.infer<typeof documentExtractionSchema>;
export type ExtractedLineItem = z.infer<typeof extractedLineItemSchema>;

/** Clamp a model-provided confidence into [0,1]. */
export function clampConfidence(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
