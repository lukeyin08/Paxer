import type { ConnectorResult, PayerConnector } from './types';
import { SCENARIOS } from '@/lib/synthetic/scenarios';

/**
 * MockFhirConnector — the stubbed payer ingestion seam (Section 2, Section 7.4).
 * Returns synthetic EOBs instead of contacting a real payer. Clearly labeled as
 * a demo connection everywhere it surfaces in the UI.
 *
 * // TODO(paxer): real FHIR via aggregator (e.g. Flexpa). Replace connect() with
 * // an OAuth handshake + paged ExplanationOfBenefit fetch, mapped to ConnectorResult.
 */
export class MockFhirConnector implements PayerConnector {
  readonly id = 'mock-fhir';
  readonly displayName = 'Demo insurer connection';
  readonly isMock = true;

  listAvailablePayers() {
    // Synthetic payers backed by the scenario set.
    return [{ id: 'brightpath', name: 'Brightpath Health (demo)' }];
  }

  async connect(_payerId: string): Promise<ConnectorResult> {
    // Pull the EOB-style scenarios (skip the itemized-bill-only one) to mimic a
    // payer feed that returns claims/EOBs.
    const eobScenarios = SCENARIOS.filter((s) =>
      s.documents.some((d) => d.kind === 'EOB' || d.kind === 'DENIAL_LETTER'),
    );

    const documents = eobScenarios.flatMap((s) =>
      s.documents
        .filter((d) => d.kind === 'EOB' || d.kind === 'DENIAL_LETTER')
        .map((d) => ({
          kind: d.kind,
          fileName: d.fileName,
          providerName: s.providerName,
          payerName: s.payerName,
          dateOfService: s.dateOfService,
          lineItems: d.lineItems,
        })),
    );

    // Use the first scenario's plan benefits as the member's plan summary.
    const planBenefits = eobScenarios[0]?.planBenefits;

    return {
      payerName: 'Brightpath Health (demo)',
      documents,
      planBenefits,
      note: 'Demo connection. These EOBs are synthetic and were not retrieved from a real insurer.',
    };
  }
}

export const mockFhirConnector = new MockFhirConnector();
