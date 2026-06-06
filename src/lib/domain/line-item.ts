import { z } from 'zod';

/**
 * Canonical shape for an extracted / entered line item. Shared by the manual
 * entry form, the mock FHIR connector, and the AI extractor (Phase 3). Amounts
 * are numbers in dollars; nullable fields are genuinely-unknown values and must
 * never be guessed (Section 9).
 */
export const lineItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  cptHcpcsCode: z.string().trim().max(16).nullish(),
  revenueCode: z.string().trim().max(16).nullish(),
  units: z.coerce.number().int().min(1).default(1),
  chargeAmount: z.coerce.number().min(0).nullish(),
  allowedAmount: z.coerce.number().min(0).nullish(),
  planPaid: z.coerce.number().min(0).nullish(),
  patientResponsibility: z.coerce.number().min(0).nullish(),
  dateOfService: z.string().nullish(),
  sourceConfidence: z.number().min(0).max(1).default(1),
});

export type LineItemInput = z.infer<typeof lineItemInputSchema>;

export const planBenefitsInputSchema = z.object({
  deductible: z.coerce.number().min(0).nullish(),
  deductibleMet: z.coerce.number().min(0).nullish(),
  coinsuranceRate: z.coerce.number().min(0).max(1).nullish(),
  copay: z.coerce.number().min(0).nullish(),
  oopMax: z.coerce.number().min(0).nullish(),
  oopMet: z.coerce.number().min(0).nullish(),
  inNetwork: z.boolean().default(true),
});

export type PlanBenefitsInput = z.infer<typeof planBenefitsInputSchema>;
