import { describe, it, expect } from 'vitest';
import { computeFee, patientKeeps } from './fees';

describe('success fee', () => {
  it('computes a 25% fee by default', () => {
    expect(computeFee(240)).toBe(60);
    expect(patientKeeps(240)).toBe(180);
  });

  it('respects a custom rate', () => {
    expect(computeFee(1000, 0.3)).toBe(300);
    expect(patientKeeps(1000, 0.3)).toBe(700);
  });

  it('rounds to cents', () => {
    expect(computeFee(99.99, 0.25)).toBe(25);
  });
});
