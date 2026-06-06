import { describe, it, expect } from 'vitest';
import { formatUsd, formatDate } from './utils';

describe('formatUsd', () => {
  it('formats whole dollars by default', () => {
    expect(formatUsd(1240)).toBe('$1,240');
    expect(formatUsd(0)).toBe('$0');
  });
  it('formats cents when asked', () => {
    expect(formatUsd(1240.5, { cents: true })).toBe('$1,240.50');
  });
});

describe('formatDate', () => {
  it('returns a dash for null/invalid', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
  it('formats an ISO date', () => {
    expect(formatDate('2025-11-12T00:00:00Z')).toMatch(/2025/);
  });
});
