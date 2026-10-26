export interface QadhaPrayerPaceEstimate {
  prayersPerDay: number;
  totalRemainingPrayers: number;
  daysNeeded: number;
  completionDate: Date;
  formattedCompletionDate: string;
  durationText: string;
  isAllSettled: boolean;
}

export interface QadhaMilestoneComparison {
  paceLabel: string;
  prayersPerDay: number;
  description: string;
  daysNeeded: number;
  completionDate: Date;
  formattedDate: string;
}

/**
 * Formats day count into clean human-readable duration (years, months, days).
 */
export function formatDuration(days: number): string {
  if (days <= 0) return '0 days';
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'}`;

  const years = Math.floor(days / 365);
  const remainingDaysAfterYears = days % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const finalDays = remainingDaysAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (finalDays > 0 && years === 0) parts.push(`${finalDays} ${finalDays === 1 ? 'day' : 'days'}`);

  return parts.length > 0 ? parts.join(' ') : `${days} days`;
}

/**
 * Calculates the completion timeline based on remaining missed prayers and daily makeup pace.
 */
export function calculateQadhaPrayerPayoff(
  totalRemainingPrayers: number,
  prayersPerDay: number,
  startDate: Date = new Date()
): QadhaPrayerPaceEstimate {
  if (totalRemainingPrayers <= 0) {
    return {
      prayersPerDay,
      totalRemainingPrayers: 0,
      daysNeeded: 0,
      completionDate: startDate,
      formattedCompletionDate: 'All Settled!',
      durationText: '0 days (All caught up)',
      isAllSettled: true,
    };
  }

  const validPace = Math.max(1, Math.floor(prayersPerDay));
  const daysNeeded = Math.ceil(totalRemainingPrayers / validPace);

  const completionDate = new Date(startDate.getTime());
  completionDate.setDate(completionDate.getDate() + daysNeeded);

  const durationText = formatDuration(daysNeeded);
  const formattedCompletionDate = completionDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    prayersPerDay: validPace,
    totalRemainingPrayers,
    daysNeeded,
    completionDate,
    formattedCompletionDate,
    durationText,
    isAllSettled: false,
  };
}

/**
 * Generates milestone comparisons across standard daily makeup paces.
 */
export function getQadhaPaceMilestones(
  totalRemainingPrayers: number,
  startDate: Date = new Date()
): QadhaMilestoneComparison[] {
  const paces = [
    { label: 'Steady Pace', pace: 1, desc: '1 prayer/day (after any prayer)' },
    { label: 'Consistent', pace: 2, desc: '2 prayers/day (e.g. Subuh & Maghrib)' },
    { label: 'Balanced (1 Set)', pace: 5, desc: '1 extra after each of the 5 fardhu' },
    { label: 'Accelerated (2 Sets)', pace: 10, desc: '2 extra after each of the 5 fardhu' },
  ];

  return paces.map((p) => {
    const est = calculateQadhaPrayerPayoff(totalRemainingPrayers, p.pace, startDate);
    return {
      paceLabel: p.label,
      prayersPerDay: p.pace,
      description: p.desc,
      daysNeeded: est.daysNeeded,
      completionDate: est.completionDate,
      formattedDate: est.formattedCompletionDate,
    };
  });
}

/**
 * Reverse calculation: calculates required daily pace to finish by target date.
 */
export function calculateRequiredPaceForTargetDate(
  totalRemainingPrayers: number,
  targetDate: Date,
  startDate: Date = new Date()
): { requiredPrayersPerDay: number; daysAvailable: number } {
  if (totalRemainingPrayers <= 0) return { requiredPrayersPerDay: 0, daysAvailable: 0 };

  const diffTime = targetDate.getTime() - startDate.getTime();
  const daysAvailable = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const requiredPrayersPerDay = Math.ceil(totalRemainingPrayers / daysAvailable);

  return {
    requiredPrayersPerDay,
    daysAvailable,
  };
}
