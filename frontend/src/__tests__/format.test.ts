import { describe, expect, it } from 'vitest';
import { formatMonth, formatShortDate } from '../utils/format';

describe('formatMonth', () => {
  it('formats long and short month names', () => {
    expect(formatMonth('2026-09')).toBe('September 2026');
    expect(formatMonth('2026-01', true)).toBe('Jan 2026');
  });
});

describe('formatShortDate', () => {
  it('includes the weekday and time', () => {
    expect(formatShortDate('2026-10-03 19:00')).toBe('Sat 3 Oct 2026 · 19:00');
    expect(formatShortDate('2026-10-04')).toBe('Sun 4 Oct 2026');
  });
});
