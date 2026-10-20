import { describe, it, expect } from 'vitest';
import {
  getTodayLocalDateString,
  parseLocalDateString,
  formatDisplayDate,
  isOverdue,
  isToday,
  isUpcoming,
  getYearFromDate,
} from '@/lib/dates';

describe('Local Date Utilities', () => {
  it('formats today as YYYY-MM-DD string', () => {
    const today = getTodayLocalDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('correctly parses local date string without timezone drift', () => {
    const parsed = parseLocalDateString('2026-10-20');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed: 9 = October
    expect(parsed.getDate()).toBe(20);
    expect(parsed.getHours()).toBe(0);
  });

  it('formats display date nicely', () => {
    expect(formatDisplayDate('2026-10-20')).toBe('Oct 20, 2026');
    expect(formatDisplayDate(null)).toBe('');
  });

  it('calculates overdue and today status accurately', () => {
    const today = getTodayLocalDateString();
    expect(isToday(today)).toBe(true);
    expect(isOverdue(today)).toBe(false);
    expect(isUpcoming(today, 7)).toBe(true);

    expect(isOverdue('2000-01-01')).toBe(true);
    expect(isOverdue('2099-01-01')).toBe(false);
  });

  it('extracts year accurately', () => {
    expect(getYearFromDate('2026-10-20')).toBe(2026);
    expect(getYearFromDate('2025-12-31T23:59:59Z')).toBe(2025);
    expect(getYearFromDate(null)).toBeNull();
  });
});
