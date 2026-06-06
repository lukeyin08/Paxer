import type { LineItemInput, PlanBenefitsInput } from '@/lib/domain/line-item';

/**
 * Synthetic-but-plausible case scenarios. FAKE DATA ONLY (Section 9, Section 10).
 * Each scenario is engineered to trigger one or more audit findings (Phase 4) and
 * is reused by both the MockFhirConnector and the full demo seed (Phase 7).
 */
export interface Scenario {
  key: string;
  title: string;
  providerName: string;
  payerName: string;
  dateOfService: string;
  documents: {
    kind: 'EOB' | 'ITEMIZED_BILL' | 'DENIAL_LETTER';
    fileName: string;
    lineItems: LineItemInput[];
  }[];
  planBenefits: PlanBenefitsInput;
  /** What this scenario is designed to demonstrate. */
  expectedFindings: string[];
}

const li = (p: Partial<LineItemInput> & { description: string }): LineItemInput => ({
  cptHcpcsCode: null,
  revenueCode: null,
  units: 1,
  chargeAmount: null,
  allowedAmount: null,
  planPaid: null,
  patientResponsibility: null,
  dateOfService: null,
  sourceConfidence: 1,
  ...p,
});

export const SCENARIOS: Scenario[] = [
  {
    key: 'duplicate-er',
    title: 'Emergency room visit, St. Marin Medical Center',
    providerName: 'St. Marin Medical Center',
    payerName: 'Brightpath Health',
    dateOfService: '2025-11-12',
    documents: [
      {
        kind: 'ITEMIZED_BILL',
        fileName: 'st-marin-itemized-bill.pdf',
        lineItems: [
          li({ description: 'Emergency department visit, high severity', cptHcpcsCode: '99285', chargeAmount: 1850, dateOfService: '2025-11-12' }),
          li({ description: 'CT scan, head, without contrast', cptHcpcsCode: '70450', chargeAmount: 1240, dateOfService: '2025-11-12' }),
          // Duplicate of the CT line (same code, date, amount)
          li({ description: 'CT scan, head, without contrast', cptHcpcsCode: '70450', chargeAmount: 1240, dateOfService: '2025-11-12' }),
          li({ description: 'Metabolic panel, comprehensive', cptHcpcsCode: '80053', chargeAmount: 220, dateOfService: '2025-11-12' }),
          li({ description: 'IV infusion, hydration, first hour', cptHcpcsCode: '96360', chargeAmount: 410, dateOfService: '2025-11-12' }),
        ],
      },
    ],
    planBenefits: { deductible: 2000, deductibleMet: 2000, coinsuranceRate: 0.2, copay: 0, oopMax: 8000, oopMet: 3200, inNetwork: true },
    expectedFindings: ['DUPLICATE_CHARGE'],
  },
  {
    key: 'cost-share-error',
    title: 'Outpatient MRI, Cedar Valley Imaging',
    providerName: 'Cedar Valley Imaging',
    payerName: 'Brightpath Health',
    dateOfService: '2025-10-03',
    documents: [
      {
        kind: 'EOB',
        fileName: 'brightpath-eob-mri.pdf',
        lineItems: [
          li({
            description: 'MRI, lumbar spine, without contrast',
            cptHcpcsCode: '72148',
            chargeAmount: 2600,
            allowedAmount: 1200,
            planPaid: 480,
            // Plan is 20% coinsurance, deductible already met -> patient should owe ~$240.
            // Billed patient responsibility is overstated.
            patientResponsibility: 720,
            dateOfService: '2025-10-03',
          }),
        ],
      },
    ],
    planBenefits: { deductible: 1500, deductibleMet: 1500, coinsuranceRate: 0.2, copay: 0, oopMax: 6000, oopMet: 2100, inNetwork: true },
    expectedFindings: ['COST_SHARE_ERROR'],
  },
  {
    key: 'nsa-balance-billing',
    title: 'Emergency anesthesia, out-of-network',
    providerName: 'Pacific Anesthesia Associates',
    payerName: 'Brightpath Health',
    dateOfService: '2025-09-21',
    documents: [
      {
        kind: 'EOB',
        fileName: 'brightpath-eob-anesthesia.pdf',
        lineItems: [
          li({
            description: 'Anesthesia for emergency surgery (out-of-network)',
            cptHcpcsCode: '00840',
            chargeAmount: 4200,
            allowedAmount: 1400,
            planPaid: 1120,
            // Out-of-network emergency: patient billed the full balance above in-network cost-share.
            patientResponsibility: 3080,
            dateOfService: '2025-09-21',
          }),
        ],
      },
    ],
    planBenefits: { deductible: 1500, deductibleMet: 1500, coinsuranceRate: 0.2, copay: 0, oopMax: 6000, oopMet: 2400, inNetwork: false },
    expectedFindings: ['BALANCE_BILLING_NSA'],
  },
  {
    key: 'oon-denial',
    title: 'Specialist consult denied, out-of-network',
    providerName: 'Lakeside Dermatology',
    payerName: 'Brightpath Health',
    dateOfService: '2025-08-14',
    documents: [
      {
        kind: 'DENIAL_LETTER',
        fileName: 'brightpath-denial-derm.pdf',
        lineItems: [
          li({
            description: 'Office consultation, dermatology (DENIED: out-of-network)',
            cptHcpcsCode: '99244',
            chargeAmount: 540,
            allowedAmount: 0,
            planPaid: 0,
            patientResponsibility: 540,
            dateOfService: '2025-08-14',
          }),
        ],
      },
    ],
    planBenefits: { deductible: 1500, deductibleMet: 900, coinsuranceRate: 0.2, copay: 0, oopMax: 6000, oopMet: 1800, inNetwork: false },
    expectedFindings: ['NON_COVERED_BILLED_TO_PATIENT'],
  },
];

export function getScenario(key: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
