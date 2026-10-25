import { describe, it, expect } from 'vitest';
import {
  calculateFidyahCompounded,
  calculateYearsDelayed,
  estimateHijriYear,
} from '@/features/ibadah/lib/fidyahCalculator';
import { calculateSafeToSpend, calculateDebtPayoffProjection } from '@/features/finance/financeUtils';
import { FinancialCommitment, DebtItem } from '@/domain/types';

describe('Ibadah Hub - Fidyah Compounding Calculator (Mazhab Syafi\'i)', () => {
  it('returns 0 fidyah for current year missed fasts (0 years delayed) while requiring qadha', () => {
    const result = calculateFidyahCompounded(7, 0, 4.00);
    expect(result.daysMissed).toBe(7);
    expect(result.yearsDelayed).toBe(0);
    expect(result.totalFidyahAmount).toBe(0);
    expect(result.requiresQadha).toBe(true);
    expect(result.formulaDescription).toContain('Tahun semasa');
  });

  it('calculates 1-year delayed fidyah accurately (days * 1 * rate)', () => {
    // 5 missed days, 1 year delayed, standard rate RM 4.00/cupak
    const result = calculateFidyahCompounded(5, 1, 4.00);
    expect(result.totalFidyahAmount).toBe(20.00);
    expect(result.formulaDescription).toContain('5 hari × 1 tahun tertangguh × RM 4.00 = RM 20.00');
  });

  it('calculates compounding multi-year fidyah for past years (days * years * rate)', () => {
    // 10 missed days delayed by 4 years at RM 4.00: 10 * 4 * 4 = RM 160.00
    const result = calculateFidyahCompounded(10, 4, 4.00);
    expect(result.totalFidyahAmount).toBe(160.00);
    expect(result.requiresQadha).toBe(true);
  });

  it('supports premium rice rates (e.g. Basmati / Beras Wangi at RM 8.00/cupak)', () => {
    // 5 missed days delayed by 3 years at RM 8.00: 5 * 3 * 8 = RM 120.00
    const result = calculateFidyahCompounded(5, 3, 8.00);
    expect(result.totalFidyahAmount).toBe(120.00);
  });

  it('handles 0 days missed cleanly', () => {
    const result = calculateFidyahCompounded(0, 5, 4.00);
    expect(result.totalFidyahAmount).toBe(0);
    expect(result.requiresQadha).toBe(false);
  });

  it('calculates years delayed between missed year and reference year', () => {
    expect(calculateYearsDelayed(2022, 2026)).toBe(4);
    expect(calculateYearsDelayed(2026, 2026)).toBe(0);
    expect(calculateYearsDelayed(2027, 2026)).toBe(0);
  });

  it('approximates Hijri year correctly from Gregorian year', () => {
    expect(estimateHijriYear(2026)).toBe(1448);
    expect(estimateHijriYear(2022)).toBe(1444);
  });
});

describe('Finance Hub - Lumpsum Flexible Debt & Safe-to-Spend', () => {
  it('excludes lumpsum_flexible debts from monthly recurring debt installments', () => {
    const commitments: FinancialCommitment[] = [
      {
        id: 'com_1',
        title: 'Sewa Rumah',
        amount: 1000,
        category: 'needs',
        dueDayOfMonth: 1,
        isPaidThisMonth: false,
        autoRenew: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const debts: DebtItem[] = [
      {
        id: 'debt_car',
        title: 'Honda City',
        creditor: 'Maybank',
        debtType: 'installment',
        originalPrincipal: 60000,
        currentBalance: 30000,
        monthlyInstallment: 700,
        priority: 'normal',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'debt_personal_friend',
        title: 'Hutang Kawan',
        creditor: 'Kawan Baik',
        debtType: 'lumpsum_flexible',
        originalPrincipal: 1500,
        currentBalance: 1500,
        monthlyInstallment: 0,
        priority: 'snowball',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const monthlyIncome = 4000;
    const result = calculateSafeToSpend(monthlyIncome, commitments, debts);

    // Total debt installments should ONLY be 700 (car), NOT distorted by the 1500 friend debt
    expect(result.totalDebtInstallments).toBe(700);
    expect(result.totalCommitments).toBe(1000);
    // Safe-to-spend = 4000 - 1000 - 700 = 2300
    expect(result.safeToSpend).toBe(2300);
    expect(result.status).toBe('healthy');
  });

  it('provides flexible payoff projection for lumpsum flexible debts', () => {
    const flexibleDebt: DebtItem = {
      id: 'debt_lumpsum',
      title: 'Pinjam Kawan',
      creditor: 'Ahmad',
      debtType: 'lumpsum_flexible',
      originalPrincipal: 1500,
      currentBalance: 1500,
      monthlyInstallment: 0,
      priority: 'snowball',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    const projection = calculateDebtPayoffProjection(flexibleDebt);
    expect(projection.monthsRemaining).toBe(0);
    expect(projection.projectedPayoffText).toContain('Fleksibel');
  });
});
