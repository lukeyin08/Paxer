import type { LineItemInput, PlanBenefitsInput } from '@/lib/domain/line-item';

/**
 * A payer connection result: one or more EOB-like documents, each with extracted
 * line items, plus optional plan benefits. This is the shape any PayerConnector
 * must return, real or mock.
 */
export interface ConnectorDocument {
  kind: 'EOB' | 'ITEMIZED_BILL' | 'DENIAL_LETTER' | 'PLAN_SBC' | 'OTHER';
  fileName: string;
  providerName?: string;
  payerName?: string;
  dateOfService?: string;
  lineItems: LineItemInput[];
}

export interface ConnectorResult {
  payerName: string;
  documents: ConnectorDocument[];
  planBenefits?: PlanBenefitsInput;
  /** Human-readable note shown in the UI; mock connectors flag themselves here. */
  note: string;
}

/**
 * PayerConnector is the seam for real payer ingestion (Section 2, Section 16).
 * The real implementation will pull EOBs via a FHIR aggregator; the prototype
 * ships only MockFhirConnector.
 *
 * // TODO(paxer): real FHIR via aggregator (e.g. Flexpa) — exchange an OAuth
 * // token for the member's CMS Patient Access / payer FHIR endpoint, page
 * // through ExplanationOfBenefit resources, and map them onto ConnectorResult.
 */
export interface PayerConnector {
  readonly id: string;
  readonly displayName: string;
  readonly isMock: boolean;
  listAvailablePayers(): { id: string; name: string }[];
  connect(payerId: string): Promise<ConnectorResult>;
}
