import { describe, it, expect } from 'vitest';
import { computeFee, patientKeeps } from './fees';

describe('success fee', () => {
  it('is free by default (no fee for individuals)', () => {
    expect(computeFee(240)).toBe(0);
    expect(patientKeeps(240)).toBe(240);
  });

  it('respects a custom rate (e.g. a future B2B tier)', () => {
    expect(computeFee(1000, 0.3)).toBe(300);
    expect(patientKeeps(1000, 0.3)).toBe(700);
  });

  it('rounds to cents', () => {
    expect(computeFee(99.99, 0.25)).toBe(25);
  });
});
