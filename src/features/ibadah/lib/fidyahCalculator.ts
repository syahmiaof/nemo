/**
 * Shafi'i Madhhab Fidyah Compounding Calculator for Malaysia
 *
 * Calculation Method:
 * According to Shafi'i jurisprudence in Malaysia, fidyah is due if Ramadan fasting
 * was missed and not made up (qadha) before the arrival of the subsequent Ramadan.
 *
 * If multiple years pass, fidyah compounds for each delayed year:
 *
 * Fidyah (RM) = Days Missed x Number of Delayed Years x Fidyah Rate (RM/day)
 *
 * Note: If fasting was missed in the current year cycle (0 delayed years before
 * the next Ramadan arrives), no fidyah is due, only obligatory qadha fasting is required.
 */

export interface FidyahCalculationResult {
  daysMissed: number;
  yearsDelayed: number;
  ratePerDay: number;
  totalFidyahAmount: number;
  requiresQadha: boolean;
  formulaDescription: string;
}

export function calculateFidyahCompounded(
  daysMissed: number,
  yearsDelayed: number,
  ratePerDay = 4.00
): FidyahCalculationResult {
  const safeDays = Math.max(0, Math.floor(daysMissed));
  const safeYears = Math.max(0, Math.floor(yearsDelayed));
  const safeRate = Math.max(0, ratePerDay);

  if (safeDays === 0 || safeYears === 0) {
    return {
      daysMissed: safeDays,
      yearsDelayed: safeYears,
      ratePerDay: safeRate,
      totalFidyahAmount: 0,
      requiresQadha: safeDays > 0,
      formulaDescription:
        safeDays > 0
          ? `${safeDays} makeup days (Current cycle — before the next Ramadan arrives, no fidyah due yet).`
          : 'No remaining missed days.',
    };
  }

  const total = safeDays * safeYears * safeRate;

  return {
    daysMissed: safeDays,
    yearsDelayed: safeYears,
    ratePerDay: safeRate,
    totalFidyahAmount: total,
    requiresQadha: true,
    formulaDescription: `${safeDays} days × ${safeYears} ${safeYears === 1 ? 'year' : 'years'} delayed × RM ${safeRate.toFixed(2)} = RM ${total.toFixed(2)}`,
  };
}

/**
 * Calculates years delayed between the missed year and current reference year.
 */
export function calculateYearsDelayed(
  missedYearGregorian: number,
  currentYearGregorian = new Date().getFullYear()
): number {
  return Math.max(0, currentYearGregorian - missedYearGregorian);
}

/**
 * Approximate conversion from Gregorian year to Hijri year.
 */
export function estimateHijriYear(gregorianYear: number): number {
  return Math.round((gregorianYear - 622) * (33 / 32));
}
