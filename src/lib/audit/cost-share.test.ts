import { describe, it, expect } from 'vitest';
import { computeExpectedPatientResponsibility } from './cost-share';

describe('computeExpectedPatientResponsibility', () => {
  it('applies coinsurance after a met deductible', () => {
    const r = computeExpectedPatientResponsibility(1200, {
      deductible: 1500,
      deductibleMet: 1500,
      coinsuranceRate: 0.2,
      copay: 0,
      oopMax: 6000,
      oopMet: 2100,
    });
    expect(r.appliedToDeductible).toBe(0);
    expect(r.coinsurance).toBe(240);
    expect(r.expectedPatientResponsibility).toBe(240);
    expect(r.cappedByOopMax).toBe(false);
  });

  it('applies remaining deductible then coinsurance on the rest', () => {
    const r = computeExpectedPatientResponsibility(1000, {
      deductible: 1500,
      deductibleMet: 1200, // 300 remaining
      coinsuranceRate: 0.2,
      copay: 0,
      oopMax: 6000,
      oopMet: 0,
    });
    expect(r.appliedToDeductible).toBe(300);
    expect(r.coinsurance).toBe(140); // 700 * 0.2
    expect(r.expectedPatientResponsibility).toBe(440);
  });

  it('caps the patient share at the remaining out-of-pocket maximum', () => {
    const r = computeExpectedPatientResponsibility(5000, {
      deductible: 0,
      deductibleMet: 0,
      coinsuranceRate: 0.5,
      copay: 0,
      oopMax: 6000,
      oopMet: 5800, // only 200 left
    });
    expect(r.expectedPatientResponsibility).toBe(200);
    expect(r.cappedByOopMax).toBe(true);
  });

  it('adds a flat copay', () => {
    const r = computeExpectedPatientResponsibility(200, {
      deductible: 0,
      deductibleMet: 0,
      coinsuranceRate: 0,
      copay: 30,
      oopMax: null,
      oopMet: null,
    });
    expect(r.expectedPatientResponsibility).toBe(30);
  });
});
