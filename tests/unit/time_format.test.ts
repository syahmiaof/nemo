import { describe, expect, it } from 'vitest';
import { formatClockTime } from '@/lib/timeFormat';

describe('formatClockTime', () => {
  it('formats a stored local HH:mm value in 12-hour and 24-hour modes', () => {
    expect(formatClockTime('14:05', '24h')).toBe('14:05');
    expect(formatClockTime('14:05', '12h')).toBe('2:05 PM');
    expect(formatClockTime('00:10', '12h')).toBe('12:10 AM');
  });

  it('formats Date instances using the selected hour cycle', () => {
    const date = new Date(2026, 0, 1, 9, 7);
    expect(formatClockTime(date, '24h')).toBe('09:07');
    expect(formatClockTime(date, '12h')).toBe('9:07 AM');
  });

  it('preserves malformed input rather than displaying Invalid Date', () => {
    expect(formatClockTime('not-a-time', '12h')).toBe('not-a-time');
  });
});
