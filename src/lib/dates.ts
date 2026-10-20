import { format, isValid, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isBefore } from 'date-fns';

/**
 * Returns today's date formatted as local YYYY-MM-DD string.
 */
export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local midnight Date object
 * without timezone drift.
 */
export function parseLocalDateString(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Formats a YYYY-MM-DD string into a user-friendly display string, e.g. "Oct 20, 2026"
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = parseLocalDateString(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD string into short month & day, e.g. "Oct 20"
 */
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = parseLocalDateString(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'MMM d');
  } catch {
    return dateStr;
  }
}

/**
 * Returns true if the given YYYY-MM-DD is strictly before today in local time.
 */
export function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const todayStr = getTodayLocalDateString();
  return dateStr < todayStr;
}

/**
 * Returns true if the given YYYY-MM-DD is today in local time.
 */
export function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayLocalDateString();
}

/**
 * Returns true if dateStr is within the upcoming N days (including today).
 */
export function isUpcoming(dateStr?: string | null, daysAhead = 7): boolean {
  if (!dateStr) return false;
  const today = getTodayLocalDateString();
  const futureDate = addDays(parseLocalDateString(today), daysAhead);
  const targetDate = parseLocalDateString(dateStr);

  return (
    (dateStr >= today && isBefore(targetDate, addDays(futureDate, 1))) ||
    dateStr === today
  );
}

/**
 * Extracts the 4-digit year from an ISO string or YYYY-MM-DD string.
 */
export function getYearFromDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Returns an array of dates (YYYY-MM-DD) for a month grid view.
 */
export function getMonthDaysGrid(year: number, monthIndex: number, weekStartsOn: 0 | 1 = 1): Date[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const start = startOfWeek(firstDayOfMonth, { weekStartsOn });
  
  // 6 weeks * 7 days = 42 days grid for full consistency
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

/**
 * Returns an array of dates (7 days) for the week containing referenceDate.
 */
export function getWeekDays(referenceDate: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn });
  const end = endOfWeek(referenceDate, { weekStartsOn });
  return eachDayOfInterval({ start, end });
}
