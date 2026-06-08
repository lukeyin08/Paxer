import { z } from 'zod';

/**
 * Canonical shape for an extracted / entered line item. Shared by the manual
 * entry form, the mock FHIR connector, and the AI extractor (Phase 3). Amounts
 * are numbers in dollars; nullable fields are genuinely-unknown values and must
 * never be guessed (Section 9).
 */
// Dollar amounts are stored in numeric(12,2) — values past ~10 integer digits
// overflow the column. Bound every money field (and reject Infinity/NaN) so an
// out-of-range input is a friendly validation error, not a DB-level 500.
const MAX_MONEY = 99_999_999.99;
const money = () => z.coerce.number().finite().min(0).max(MAX_MONEY);

export const lineItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required.').max(500),
  cptHcpcsCode: z.string().trim().max(16).nullish(),
  revenueCode: z.string().trim().max(16).nullish(),
  units: z.coerce.number().int().min(1).max(100_000).default(1),
  chargeAmount: money().nullish(),
  allowedAmount: money().nullish(),
  planPaid: money().nullish(),
  patientResponsibility: money().nullish(),
  dateOfService: z.string().max(40).nullish(),
  adjustmentCodes: z.array(z.string().trim().max(16)).max(30).nullish(),
  sourceConfidence: z.number().min(0).max(1).default(1),
});

export type LineItemInput = z.infer<typeof lineItemInputSchema>;

export const planBenefitsInputSchema = z.object({
  deductible: money().nullish(),
  deductibleMet: money().nullish(),
  coinsuranceRate: z.coerce.number().finite().min(0).max(1).nullish(),
  copay: money().nullish(),
  oopMax: money().nullish(),
  oopMet: money().nullish(),
  inNetwork: z.boolean().default(true),
});

export type PlanBenefitsInput = z.infer<typeof planBenefitsInputSchema>;
