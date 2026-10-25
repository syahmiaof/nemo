/**
 * Mazhab Syafi'i Fidyah Compounding Calculator for Malaysia
 *
 * Kaedah Kiraan:
 * Menurut Mazhab Syafi'i di Malaysia, fidyah dikenakan sekiranya puasa Ramadan
 * ditinggalkan dan tidak diganti (qadha) sehingga tiba bulan Ramadan tahun berikutnya.
 *
 * Sekiranya berlalu beberapa tahun, fidyah akan BERGANDA mengikut bilangan tahun
 * yang tertangguh:
 *
 * Fidyah (RM) = Hari Tertinggal x Bilangan Tahun Tertangguh x Kadar Fidyah (RM/hari)
 *
 * Nota: Sekiranya puasa ditinggalkan pada tahun semasa (0 tahun tertangguh sebelum
 * Ramadan seterusnya tiba), tiada fidyah dikenakan, hanya qadha wajib dilakukan.
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
          ? `${safeDays} hari qadha (Tahun semasa — belum melepasi Ramadan berikutnya, tiada bayaran fidyah).`
          : 'Tiada baki hari tinggal.',
    };
  }

  const total = safeDays * safeYears * safeRate;

  return {
    daysMissed: safeDays,
    yearsDelayed: safeYears,
    ratePerDay: safeRate,
    totalFidyahAmount: total,
    requiresQadha: true,
    formulaDescription: `${safeDays} hari × ${safeYears} tahun tertangguh × RM ${safeRate.toFixed(2)} = RM ${total.toFixed(2)}`,
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
