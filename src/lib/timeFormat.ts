export type HourFormat = '12h' | '24h';

/** Format a local clock time according to the user's saved preference. */
export function formatClockTime(value: string | Date, hourFormat: HourFormat = '24h'): string {
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    const clockMatch = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (clockMatch) {
      date = new Date(2000, 0, 1, Number(clockMatch[1]), Number(clockMatch[2]));
    } else {
      date = new Date(value);
    }
  }

  if (Number.isNaN(date.getTime())) return value instanceof Date ? '' : value;

  return new Intl.DateTimeFormat('en-US', {
    hour: hourFormat === '12h' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: hourFormat === '12h',
  }).format(date);
}
