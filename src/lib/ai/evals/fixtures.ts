/**
 * Eval fixtures (Section 12): synthetic documents with known ground truth.
 * FAKE DATA. Each fixture renders to a PDF and the extractor's output is scored
 * against the ground truth.
 */
export interface GroundTruthLine {
  description: string;
  cptHcpcsCode: string | null;
  charge: number;
  patientResponsibility: number | null;
}

export interface Fixture {
  name: string;
  kind: 'ITEMIZED_BILL' | 'EOB';
  providerName: string;
  payerName: string | null;
  dateOfService: string;
  lines: GroundTruthLine[];
}

export const FIXTURES: Fixture[] = [
  {
    name: 'itemized-bill-er',
    kind: 'ITEMIZED_BILL',
    providerName: 'Northgate Regional Hospital',
    payerName: null,
    dateOfService: '2025-07-09',
    lines: [
      { description: 'Emergency department visit, level 4', cptHcpcsCode: '99284', charge: 1420, patientResponsibility: null },
      { description: 'Chest X-ray, 2 views', cptHcpcsCode: '71046', charge: 310, patientResponsibility: null },
      { description: 'Complete blood count', cptHcpcsCode: '85025', charge: 95, patientResponsibility: null },
      { description: 'Normal saline IV, 1000 ml', cptHcpcsCode: 'J7030', charge: 140, patientResponsibility: null },
    ],
  },
  {
    name: 'eob-outpatient',
    kind: 'EOB',
    providerName: 'Riverside Orthopedics',
    payerName: 'Brightpath Health',
    dateOfService: '2025-05-22',
    lines: [
      { description: 'Office visit, established patient, level 3', cptHcpcsCode: '99213', charge: 240, patientResponsibility: 38 },
      { description: 'Knee X-ray, 3 views', cptHcpcsCode: '73562', charge: 280, patientResponsibility: 44 },
      { description: 'Steroid joint injection', cptHcpcsCode: '20610', charge: 420, patientResponsibility: 66 },
    ],
  },
];
