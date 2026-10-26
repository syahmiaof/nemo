import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import {
  atomicUpdateFinancialProfile,
  atomicAddCommitment,
  atomicToggleCommitmentPaid,
  atomicDeleteCommitment,
  atomicAddDebt,
  atomicRecordDebtPayment,
  atomicUpdateDebt,
  atomicUpdateDebtPayment,
  atomicDeleteDebtPayment,
  atomicDeleteDebt,
  atomicAddWishlistItem,
  atomicToggleWishlistBought,
  atomicConvertWishlistToSavings,
  atomicDeleteWishlistItem,
  atomicAddSavingsGoal,
  atomicRecordSavingsDeposit,
  atomicDeleteSavingsGoal,
} from '@/db/operations';
import { exportWorkspaceBackup, importWorkspaceBackup } from '@/db/nemoDb';

describe('Finance & Wealth Database Operations (Dexie v4)', () => {
  let testDb: NemoDatabase;

  beforeEach(async () => {
    testDb = new NemoDatabase(`NemoFinanceTest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  describe('Financial Profile', () => {
    it('creates and updates financial profile with monthly net income and payday', async () => {
      const profile = await atomicUpdateFinancialProfile(testDb, {
        monthlyIncomeGross: 5500,
        monthlyIncomeNet: 4500,
        paydayDayOfMonth: 25,
        currency: 'MYR',
      });

      expect(profile.id).toBe('default');
      expect(profile.monthlyIncomeNet).toBe(4500);
      expect(profile.currency).toBe('MYR');

      const saved = await testDb.financialProfiles.get('default');
      expect(saved?.monthlyIncomeNet).toBe(4500);
      expect(saved?.paydayDayOfMonth).toBe(25);

      // Update net income
      const updated = await atomicUpdateFinancialProfile(testDb, {
        monthlyIncomeNet: 4800,
      });
      expect(updated.monthlyIncomeNet).toBe(4800);
      expect(updated.currency).toBe('MYR');
      expect(updated.paydayDayOfMonth).toBe(25);
    });
  });

  describe('Financial Commitments (Bills & Subscriptions)', () => {
    it('adds, toggles paid status with cycle tracking, and deletes commitments', async () => {
      const rent = await atomicAddCommitment(testDb, {
        title: 'House Rental',
        amount: 900,
        category: 'needs',
        dueDayOfMonth: 5,
        isPaidThisMonth: false,
        autoRenew: true,
      });

      expect(rent.id).toMatch(/^com_/);
      expect(rent.amount).toBe(900);
      expect(rent.isPaidThisMonth).toBe(false);

      // Mark as paid for 2026-10
      await atomicToggleCommitmentPaid(testDb, rent.id, true, '2026-10');
      let current = await testDb.financialCommitments.get(rent.id);
      expect(current?.isPaidThisMonth).toBe(true);
      expect(current?.lastPaidMonthYear).toBe('2026-10');

      // Reset to unpaid
      await atomicToggleCommitmentPaid(testDb, rent.id, false);
      current = await testDb.financialCommitments.get(rent.id);
      expect(current?.isPaidThisMonth).toBe(false);

      // Delete commitment
      await atomicDeleteCommitment(testDb, rent.id);
      const deleted = await testDb.financialCommitments.get(rent.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Debts & Loan Payoff Tracker', () => {
    it('creates debt, records payment and atomically decrements remaining balance', async () => {
      const debt = await atomicAddDebt(testDb, {
        title: 'PTPTN Education Loan',
        creditor: 'PTPTN',
        originalPrincipal: 25000,
        currentBalance: 12000,
        monthlyInstallment: 150,
        interestRatePercent: 1.0,
        priority: 'snowball',
      });

      expect(debt.id).toMatch(/^debt_/);
      expect(debt.currentBalance).toBe(12000);

      // Record installment payment of 150
      const payment1 = await atomicRecordDebtPayment(testDb, {
        debtId: debt.id,
        amount: 150,
        note: 'Oct installment',
      });

      expect(payment1.id).toMatch(/^dp_/);
      let updatedDebt = await testDb.debts.get(debt.id);
      expect(updatedDebt?.currentBalance).toBe(11850);

      // Record lump sum payment of 12,000 (should floor balance to 0, not negative)
      await atomicRecordDebtPayment(testDb, {
        debtId: debt.id,
        amount: 15000,
        note: 'Full settlement bonus',
      });

      updatedDebt = await testDb.debts.get(debt.id);
      expect(updatedDebt?.currentBalance).toBe(0);

      // Cascading deletion
      await atomicDeleteDebt(testDb, debt.id);
      expect(await testDb.debts.get(debt.id)).toBeUndefined();
      const remainingPayments = await testDb.debtPayments.where('debtId').equals(debt.id).toArray();
      expect(remainingPayments.length).toBe(0);
    });

    it('updates debt parameters and repairs mistakes in current balance or installment', async () => {
      const debt = await atomicAddDebt(testDb, {
        title: 'Tekun Loan',
        creditor: 'TEKUN',
        originalPrincipal: 10000,
        currentBalance: 5359,
        monthlyInstallment: 50,
      });

      const updated = await atomicUpdateDebt(testDb, debt.id, {
        title: 'Tekun Microfinance',
        currentBalance: 5300,
        monthlyInstallment: 70,
        notes: 'Refinanced tenure',
      });

      expect(updated.title).toBe('Tekun Microfinance');
      expect(updated.currentBalance).toBe(5300);
      expect(updated.monthlyInstallment).toBe(70);
      expect(updated.notes).toBe('Refinanced tenure');

      const saved = await testDb.debts.get(debt.id);
      expect(saved?.currentBalance).toBe(5300);
    });

    it('updates and deletes debt payments with automatic debt balance recalibration', async () => {
      const debt = await atomicAddDebt(testDb, {
        title: 'Kereta X50',
        creditor: 'Affin Bank',
        originalPrincipal: 110000,
        currentBalance: 77552,
        monthlyInstallment: 800,
      });

      // Record an erroneous payment (user entered 8000 instead of 800)
      const wrongPayment = await atomicRecordDebtPayment(testDb, {
        debtId: debt.id,
        amount: 8000,
        note: 'Accidental typo',
      });

      let currentDebt = await testDb.debts.get(debt.id);
      expect(currentDebt?.currentBalance).toBe(69552);

      // User repairs payment: changes amount to 800
      const correctedPayment = await atomicUpdateDebtPayment(testDb, wrongPayment.id, {
        amount: 800,
        note: 'Corrected monthly installment',
      });

      expect(correctedPayment.amount).toBe(800);
      currentDebt = await testDb.debts.get(debt.id);
      // Delta was (800 - 8000 = -7200), so balance is adjusted by -(-7200) = +7200 -> 76752
      expect(currentDebt?.currentBalance).toBe(76752);

      // User deletes the payment altogether to undo
      await atomicDeleteDebtPayment(testDb, wrongPayment.id);
      currentDebt = await testDb.debts.get(debt.id);
      // Balance restored by +800 -> 77552
      expect(currentDebt?.currentBalance).toBe(77552);

      const deletedPayment = await testDb.debtPayments.get(wrongPayment.id);
      expect(deletedPayment).toBeUndefined();
    });
  });

  describe('Wishlist & Anti-Impulse Planner', () => {
    it('adds wishlist item, toggles bought, and converts to target savings goal', async () => {
      const wish = await atomicAddWishlistItem(testDb, {
        title: 'UltraWide Monitor',
        estimatedPrice: 1200,
        priority: 'medium',
        coolingOffDays: 14,
        storeUrl: 'https://store.dell.com/monitor',
      });

      expect(wish.id).toMatch(/^wsh_/);
      expect(wish.isBought).toBe(false);

      // Convert to savings goal
      const goal = await atomicConvertWishlistToSavings(testDb, wish.id, {
        category: 'gadget',
        color: '#FBBF24',
      });

      expect(goal.id).toMatch(/^svg_/);
      expect(goal.title).toBe('UltraWide Monitor');
      expect(goal.targetAmount).toBe(1200);

      // Check wishlist item is linked
      const updatedWish = await testDb.wishlistItems.get(wish.id);
      expect(updatedWish?.targetSavingsGoalId).toBe(goal.id);

      // Mark as bought
      await atomicToggleWishlistBought(testDb, wish.id, true);
      const boughtWish = await testDb.wishlistItems.get(wish.id);
      expect(boughtWish?.isBought).toBe(true);
      expect(boughtWish?.boughtAt).toBeDefined();

      // Delete wishlist item
      await atomicDeleteWishlistItem(testDb, wish.id);
      expect(await testDb.wishlistItems.get(wish.id)).toBeUndefined();
    });
  });

  describe('Savings Goals (Sinking Funds) & Deposits', () => {
    it('creates savings goal, records deposits/withdrawals with current amount updates', async () => {
      const goal = await atomicAddSavingsGoal(testDb, {
        title: 'Japan Holiday Fund',
        targetAmount: 4000,
        currentAmount: 0,
        category: 'travel',
        targetDate: '2027-03-01',
        color: '#F5C8BC',
      });

      expect(goal.id).toMatch(/^svg_/);
      expect(goal.currentAmount).toBe(0);

      // Deposit 1,000
      await atomicRecordSavingsDeposit(testDb, {
        savingsGoalId: goal.id,
        amount: 1000,
        type: 'deposit',
        note: 'Savings from bonus',
      });

      let currentGoal = await testDb.savingsGoals.get(goal.id);
      expect(currentGoal?.currentAmount).toBe(1000);

      // Deposit another 500
      await atomicRecordSavingsDeposit(testDb, {
        savingsGoalId: goal.id,
        amount: 500,
        type: 'deposit',
      });

      currentGoal = await testDb.savingsGoals.get(goal.id);
      expect(currentGoal?.currentAmount).toBe(1500);

      // Withdraw 200
      await atomicRecordSavingsDeposit(testDb, {
        savingsGoalId: goal.id,
        amount: 200,
        type: 'withdrawal',
        note: 'Flight booking deposit',
      });

      currentGoal = await testDb.savingsGoals.get(goal.id);
      expect(currentGoal?.currentAmount).toBe(1300);

      // Cascading deletion
      await atomicDeleteSavingsGoal(testDb, goal.id);
      expect(await testDb.savingsGoals.get(goal.id)).toBeUndefined();
      const remainingDeposits = await testDb.savingsDeposits.where('savingsGoalId').equals(goal.id).toArray();
      expect(remainingDeposits.length).toBe(0);
    });
  });

  describe('Disaster Recovery: Workspace Backup & Restore Integrity', () => {
    it('exports and imports all 7 finance tables without data corruption', async () => {
      // Seed finance entities
      await atomicUpdateFinancialProfile(testDb, { monthlyIncomeNet: 4500, paydayDayOfMonth: 28 });
      await atomicAddCommitment(testDb, {
        title: 'Unifi 100Mbps',
        amount: 89,
        category: 'utilities',
        dueDayOfMonth: 15,
        isPaidThisMonth: true,
      });
      const debt = await atomicAddDebt(testDb, {
        title: 'Motorcycle Loan',
        creditor: 'Aeon Credit',
        originalPrincipal: 8000,
        currentBalance: 3200,
        monthlyInstallment: 240,
        priority: 'snowball',
      });
      await atomicRecordDebtPayment(testDb, { debtId: debt.id, amount: 240 });
      await atomicAddWishlistItem(testDb, {
        title: 'Sony XM5 Headphones',
        estimatedPrice: 1199,
        priority: 'medium',
      });
      const goal = await atomicAddSavingsGoal(testDb, {
        title: 'Emergency 3-Months',
        targetAmount: 5000,
        currentAmount: 2500,
        category: 'emergency',
      });
      await atomicRecordSavingsDeposit(testDb, {
        savingsGoalId: goal.id,
        amount: 500,
        type: 'deposit',
      });

      // Export
      const backupJson = await exportWorkspaceBackup(testDb);
      expect(backupJson).toContain('Unifi 100Mbps');
      expect(backupJson).toContain('Motorcycle Loan');
      expect(backupJson).toContain('Sony XM5 Headphones');
      expect(backupJson).toContain('Emergency 3-Months');

      // Clear DB
      await testDb.financialProfiles.clear();
      await testDb.financialCommitments.clear();
      await testDb.debts.clear();
      await testDb.debtPayments.clear();
      await testDb.wishlistItems.clear();
      await testDb.savingsGoals.clear();
      await testDb.savingsDeposits.clear();

      // Restore
      const restoreResult = await importWorkspaceBackup(backupJson, testDb);
      expect(restoreResult.success).toBe(true);

      // Verify restored records
      const restoredComs = await testDb.financialCommitments.toArray();
      expect(restoredComs.length).toBe(1);
      expect(restoredComs[0].title).toBe('Unifi 100Mbps');

      const restoredDebts = await testDb.debts.toArray();
      expect(restoredDebts.length).toBe(1);
      expect(restoredDebts[0].title).toBe('Motorcycle Loan');

      const restoredPayments = await testDb.debtPayments.toArray();
      expect(restoredPayments.length).toBe(1);

      const restoredGoals = await testDb.savingsGoals.toArray();
      expect(restoredGoals.length).toBe(1);
      expect(restoredGoals[0].title).toBe('Emergency 3-Months');
    });
  });
});
