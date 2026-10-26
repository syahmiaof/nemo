import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import {
  atomicUpdateQadhaPrayer,
  atomicSetQadhaPrayerRemaining,
  atomicBulkSetQadhaPrayers,
} from '@/db/operations';
import {
  calculateQadhaPrayerPayoff,
  getQadhaPaceMilestones,
  calculateRequiredPaceForTargetDate,
  formatDuration,
} from '@/features/ibadah/lib/qadhaCalculator';

describe('Qadha Prayer Database Operations & Direct Key-in', () => {
  let testDb: NemoDatabase;

  beforeEach(async () => {
    testDb = new NemoDatabase(`NemoQadhaTest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('allows user to key in remaining missed prayers directly for a single prayer', async () => {
    const item = await atomicSetQadhaPrayerRemaining(testDb, 'subuh', 45);

    expect(item.prayerType).toBe('subuh');
    expect(item.remainingCount).toBe(45);
    expect(item.totalMissed).toBe(45);
    expect(item.completedCount).toBe(0);

    // Make up 1 prayer
    const afterOne = await atomicUpdateQadhaPrayer(testDb, 'subuh', 1, 0);
    expect(afterOne.completedCount).toBe(1);
    expect(afterOne.remainingCount).toBe(44);

    // User updates remaining directly to 30
    const adjusted = await atomicSetQadhaPrayerRemaining(testDb, 'subuh', 30);
    expect(adjusted.remainingCount).toBe(30);
    expect(adjusted.completedCount).toBe(1);
    expect(adjusted.totalMissed).toBe(31);
  });

  it('supports bulk setting remaining prayers across all 5 daily prayers', async () => {
    const result = await atomicBulkSetQadhaPrayers(testDb, [
      { prayerType: 'subuh', remainingCount: 100 },
      { prayerType: 'zohor', remainingCount: 100 },
      { prayerType: 'asar', remainingCount: 100 },
      { prayerType: 'maghrib', remainingCount: 100 },
      { prayerType: 'isyak', remainingCount: 100 },
    ]);

    expect(result.length).toBe(5);
    const subuh = await testDb.qadhaPrayers.get('qp_subuh');
    const isyak = await testDb.qadhaPrayers.get('qp_isyak');

    expect(subuh?.remainingCount).toBe(100);
    expect(isyak?.remainingCount).toBe(100);
  });
});

describe('Qadha Prayer Completion & Payoff Calculator', () => {
  const baseDate = new Date('2026-10-26T00:00:00Z');

  it('calculates duration and completion date for 500 prayers at 5 prayers/day pace', () => {
    // 500 prayers / 5 per day = 100 days
    const est = calculateQadhaPrayerPayoff(500, 5, baseDate);

    expect(est.totalRemainingPrayers).toBe(500);
    expect(est.prayersPerDay).toBe(5);
    expect(est.daysNeeded).toBe(100);
    expect(est.durationText).toContain('3 months 10 days');
    expect(est.isAllSettled).toBe(false);

    // 100 days from Oct 26, 2026 is Feb 3, 2027
    const expectedYear = est.completionDate.getFullYear();
    expect(expectedYear).toBe(2027);
  });

  it('calculates duration for 1 prayer/day steady pace', () => {
    // 50 prayers / 1 per day = 50 days
    const est = calculateQadhaPrayerPayoff(50, 1, baseDate);
    expect(est.daysNeeded).toBe(50);
    expect(est.durationText).toContain('1 month 20 days');
  });

  it('handles 0 remaining prayers cleanly as all settled', () => {
    const est = calculateQadhaPrayerPayoff(0, 5, baseDate);
    expect(est.daysNeeded).toBe(0);
    expect(est.isAllSettled).toBe(true);
    expect(est.formattedCompletionDate).toBe('All Settled!');
  });

  it('generates pace milestone comparisons (1/day, 2/day, 5/day, 10/day)', () => {
    const milestones = getQadhaPaceMilestones(300, baseDate);
    expect(milestones.length).toBe(4);

    // 1/day -> 300 days
    expect(milestones[0].daysNeeded).toBe(300);
    // 5/day -> 60 days
    expect(milestones[2].daysNeeded).toBe(60);
    // 10/day -> 30 days
    expect(milestones[3].daysNeeded).toBe(30);
  });

  it('calculates required pace to finish by target date', () => {
    const targetDate = new Date('2026-11-25T00:00:00Z'); // 30 days later
    const { requiredPrayersPerDay, daysAvailable } = calculateRequiredPaceForTargetDate(150, targetDate, baseDate);

    expect(daysAvailable).toBe(30);
    expect(requiredPrayersPerDay).toBe(5); // 150 / 30 = 5 prayers/day
  });

  it('formats human readable durations properly', () => {
    expect(formatDuration(1)).toBe('1 day');
    expect(formatDuration(15)).toBe('15 days');
    expect(formatDuration(365)).toBe('1 year');
    expect(formatDuration(400)).toContain('1 year');
  });
});
