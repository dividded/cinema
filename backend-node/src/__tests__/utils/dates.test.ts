import { describe, it, expect } from 'vitest';
import { getTodayInIsrael, getUpcomingDates } from '../../utils/dates';

describe('dates', () => {
  it('uses the Israeli calendar day, not the UTC one', () => {
    // 22:30 UTC on Jan 31 is already Feb 1 in Israel (UTC+2).
    expect(getTodayInIsrael(new Date('2025-01-31T22:30:00Z'))).toBe('2025-02-01');
  });

  it('lists consecutive dates across month boundaries', () => {
    expect(getUpcomingDates(3, new Date('2025-01-30T10:00:00Z'))).toEqual([
      '2025-01-30',
      '2025-01-31',
      '2025-02-01',
    ]);
  });
});
