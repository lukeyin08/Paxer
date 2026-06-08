import { describe, it, expect } from 'vitest';
import { detectDuplicates, detectCostShareErrors, detectNonCoveredBilled } from './detectors';
import type { AuditContext } from './types';
import type { Case, LineItem, PlanBenefit } from '@/lib/db/schema';

let idc = 0;
function li(p: Partial<LineItem>): LineItem {
  return {
    id: `li-${idc++}`,
    documentId: null,
    caseId: 'case-1',
    description: 'Service',
    cptHcpcsCode: null,
    revenueCode: null,
    units: 1,
    chargeAmount: null,
    allowedAmount: null,
    planPaid: null,
    patientResponsibility: null,
    dateOfService: null,
    sourceConfidence: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...p,
  } as LineItem;
}

function ctx(lineItems: LineItem[], planBenefits: PlanBenefit | null = null): AuditContext {
  return {
    case: { id: 'case-1', providerName: 'Test Provider' } as Case,
    lineItems,
    planBenefits,
    otherCaseLineItems: [],
    benchmarks: [],
    region: 'CA',
  };
}

describe('detectDuplicates', () => {
  it('flags an identical code+date+amount appearing twice', () => {
    const d = new Date('2025-11-12');
    const items = [
      li({ description: 'CT head', cptHcpcsCode: '70450', dateOfService: d, chargeAmount: '1240.00' }),
      li({ description: 'CT head', cptHcpcsCode: '70450', dateOfService: d, chargeAmount: '1240.00' }),
    ];
    const findings = detectDuplicates(ctx(items));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.type).toBe('DUPLICATE_CHARGE');
    expect(findings[0]!.estimatedRecovery).toBe(1240);
  });

  it('does not flag distinct charges', () => {
    const items = [
      li({ cptHcpcsCode: '70450', dateOfService: new Date('2025-11-12'), chargeAmount: '1240.00' }),
      li({ cptHcpcsCode: '80053', dateOfService: new Date('2025-11-12'), chargeAmount: '220.00' }),
    ];
    expect(detectDuplicates(ctx(items))).toHaveLength(0);
  });
});

describe('detectCostShareErrors', () => {
  it('flags an overstated patient responsibility', () => {
    const plan = {
      deductible: '1500.00',
      deductibleMet: '1500.00',
      coinsuranceRate: 0.2,
      copay: '0.00',
      oopMax: '6000.00',
      oopMet: '2100.00',
    } as PlanBenefit;
    const items = [
      li({ description: 'MRI', allowedAmount: '1200.00', patientResponsibility: '720.00' }),
    ];
    const findings = detectCostShareErrors(ctx(items, plan));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.type).toBe('COST_SHARE_ERROR');
    expect(findings[0]!.estimatedRecovery).toBe(480); // 720 billed - 240 expected
  });

  it('does not flag a correct cost-share', () => {
    const plan = {
      deductible: '1500.00',
      deductibleMet: '1500.00',
      coinsuranceRate: 0.2,
      copay: '0.00',
      oopMax: '6000.00',
      oopMet: '2100.00',
    } as PlanBenefit;
    const items = [li({ allowedAmount: '1200.00', patientResponsibility: '240.00' })];
    expect(detectCostShareErrors(ctx(items, plan))).toHaveLength(0);
  });
});

describe('detectNonCoveredBilled (denial / COB)', () => {
  // Plan paid $0 and the full allowed amount landed on the patient.
  const denialLine = () =>
    li({ description: 'Procedure', cptHcpcsCode: '67028', allowedAmount: '900', planPaid: '0', patientResponsibility: '900' });
  const pb = (deductible: string, met: string) =>
    ({ deductible, deductibleMet: met, coinsuranceRate: null, copay: null, oopMax: null, oopMet: null, inNetwork: true }) as PlanBenefit;

  it('fires on a PR-22 reason code (even with no plan benefits) and names the COB denial', () => {
    const f = detectNonCoveredBilled(ctx([li({ ...denialLine(), adjustmentCodes: ['PR-22'] })], null));
    expect(f).toHaveLength(1);
    expect(f[0]!.type).toBe('NON_COVERED_BILLED_TO_PATIENT');
    expect(f[0]!.estimatedRecovery).toBe(900);
    expect(`${f[0]!.title} ${f[0]!.explanationPlain}`).toMatch(/coordination-of-benefits|PR-22/i);
  });

  it('fires when plan benefits show no deductible can explain it', () => {
    expect(detectNonCoveredBilled(ctx([denialLine()], pb('0', '0')))).toHaveLength(1);
  });

  it('does NOT fire on a legit unmet deductible', () => {
    expect(detectNonCoveredBilled(ctx([denialLine()], pb('2000', '0')))).toHaveLength(0);
  });

  it('does NOT fire with no reason code AND no plan benefits (ambiguous — avoid over-claiming)', () => {
    expect(detectNonCoveredBilled(ctx([denialLine()], null))).toHaveLength(0);
  });

  it('fires when the deductible is already met (so $0 plan-paid is not a deductible)', () => {
    expect(detectNonCoveredBilled(ctx([denialLine()], pb('2000', '2000')))).toHaveLength(1);
  });
});
