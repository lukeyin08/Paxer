import { describe, it, expect } from 'vitest';
import { capRecoverable } from './recoverable';

describe('capRecoverable', () => {
  it('caps two findings on one line at the line charge (no double-count)', () => {
    const findings = [
      { lineItemId: 'li-0', type: 'COST_SHARE_ERROR', estimatedRecovery: 60 },
      { lineItemId: 'li-0', type: 'BALANCE_BILLING_NSA', estimatedRecovery: 60 },
    ];
    const lines = [{ id: 'li-0', charge: 100, patientResponsibility: 100 }];
    expect(capRecoverable(findings, lines)).toBe(100); // not 120
  });

  it('does not cap duplicate findings across multiple physical lines', () => {
    const findings = [{ lineItemId: 'li-0', type: 'DUPLICATE_CHARGE', estimatedRecovery: 1200 }];
    const lines = [
      { id: 'li-0', charge: 1200, patientResponsibility: 1200 },
      { id: 'li-1', charge: 1200, patientResponsibility: 1200 },
    ];
    expect(capRecoverable(findings, lines)).toBe(1200);
  });

  it('bounds the total at patient responsibility (the $50k bandages case)', () => {
    const findings = [{ lineItemId: 'li-0', type: 'OTHER', estimatedRecovery: 50000 }];
    const lines = [{ id: 'li-0', charge: 50000, patientResponsibility: 10000 }];
    expect(capRecoverable(findings, lines)).toBe(10000);
  });

  it('sums findings not tied to a line, bounded by total billed when PR is 0', () => {
    const findings = [{ lineItemId: null, type: 'OTHER', estimatedRecovery: 75 }];
    const lines = [{ id: 'li-0', charge: 100, patientResponsibility: 0 }];
    expect(capRecoverable(findings, lines)).toBe(75);
  });

  it('does NOT add OOP-max overrun on top of per-line findings (takes the larger view)', () => {
    const findings = [
      { lineItemId: 'li-0', type: 'COST_SHARE_ERROR', estimatedRecovery: 300 },
      { lineItemId: null, type: 'OOP_MAX_OVERRUN', estimatedRecovery: 400 },
    ];
    const lines = [{ id: 'li-0', charge: 1000, patientResponsibility: 1000 }];
    expect(capRecoverable(findings, lines)).toBe(400); // max(400, 300), not 700
  });

  it('uses the itemized total when it exceeds the OOP overage', () => {
    const findings = [
      { lineItemId: 'li-0', type: 'DUPLICATE_CHARGE', estimatedRecovery: 600 },
      { lineItemId: null, type: 'OOP_MAX_OVERRUN', estimatedRecovery: 400 },
    ];
    const lines = [{ id: 'li-0', charge: 1000, patientResponsibility: 1000 }];
    expect(capRecoverable(findings, lines)).toBe(600);
  });
});
