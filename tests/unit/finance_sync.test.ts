import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mappers } from '@/sync/mappers';
import { resolveGenericLWW } from '@/sync/conflictResolver';
import { NemoDatabase } from '@/db/nemoDb';
import { registerDexieSyncHooks } from '@/sync/dexieHooks';
import type {
  FinancialProfile,
  FinancialCommitment,
  DebtItem,
  DebtPayment,
  WishlistItem,
  SavingsGoal,
  SavingsDeposit,
} from '@/domain/types';

describe('Finance & Wealth Sync Mappers and Hooks', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  describe('Sync Mappers Round-trip', () => {
    it('correctly maps financial profiles to remote and back to local', () => {
      const local: FinancialProfile = {
        id: 'default',
        monthlyIncomeGross: 5000,
        monthlyIncomeNet: 4200,
        paydayDayOfMonth: 25,
        currency: 'MYR',
        updatedAt: '2026-10-24T00:00:00.000Z',
      };

      const remote = mappers.financialProfile.toRemote(local, userId);
      expect(remote.monthly_income_net).toBe(4200);
      expect(remote.currency).toBe('MYR');
      expect(remote.user_id).toBe(userId);

      const roundTrip = mappers.financialProfile.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });

    it('correctly maps commitments to remote and back to local', () => {
      const local: FinancialCommitment = {
        id: 'com_test_1',
        title: 'Apartment Rent',
        amount: 900,
        category: 'needs',
        dueDayOfMonth: 5,
        isPaidThisMonth: true,
        lastPaidMonthYear: '2026-10',
        notes: 'Maybank transfer to landlord',
        autoRenew: true,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-05T00:00:00.000Z',
      };

      const remote = mappers.financialCommitment.toRemote(local, userId);
      expect(remote.title).toBe('Apartment Rent');
      expect(remote.amount).toBe(900);
      expect(remote.category).toBe('needs');

      const roundTrip = mappers.financialCommitment.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });

    it('correctly maps debts and debt payments to remote and back', () => {
      const debt: DebtItem = {
        id: 'debt_ptptn',
        title: 'PTPTN Education Loan',
        creditor: 'PTPTN',
        originalPrincipal: 25000,
        currentBalance: 12000,
        monthlyInstallment: 150,
        interestRatePercent: 1.0,
        targetPayoffDate: '2030-12-31',
        priority: 'snowball',
        notes: 'Monthly direct debit',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      };

      const remoteDebt = mappers.debtItem.toRemote(debt, userId);
      expect(remoteDebt.original_principal).toBe(25000);
      expect(mappers.debtItem.toLocal(remoteDebt)).toEqual(debt);

      const payment: DebtPayment = {
        id: 'dp_test_1',
        debtId: 'debt_ptptn',
        amount: 150,
        paidAt: '2026-10-15T10:00:00.000Z',
        note: 'October auto-debit',
      };

      const remotePayment = mappers.debtPayment.toRemote(payment, userId);
      expect(remotePayment.debt_id).toBe('debt_ptptn');
      expect(remotePayment.amount).toBe(150);
      expect(mappers.debtPayment.toLocal(remotePayment)).toEqual(payment);
    });

    it('correctly maps wishlist items to remote and back', () => {
      const item: WishlistItem = {
        id: 'wsh_test_1',
        title: 'Ergonomic Chair',
        estimatedPrice: 450,
        priority: 'high',
        storeUrl: 'https://shopee.com.my/chair',
        isBought: false,
        coolingOffDays: 7,
        addedAt: '2026-10-20T00:00:00.000Z',
        notes: 'Wait for 11.11 promo',
      };

      const remote = mappers.wishlistItem.toRemote(item, userId);
      expect(remote.title).toBe('Ergonomic Chair');
      expect(remote.priority).toBe('high');
      expect(mappers.wishlistItem.toLocal(remote)).toEqual(item);
    });

    it('correctly maps savings goals and deposits to remote and back', () => {
      const goal: SavingsGoal = {
        id: 'svg_japan',
        title: 'Trip to Tokyo',
        targetAmount: 5000,
        currentAmount: 2200,
        category: 'travel',
        targetDate: '2027-04-01',
        color: '#F5C8BC',
        icon: 'Plane',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      };

      const remoteGoal = mappers.savingsGoal.toRemote(goal, userId);
      expect(remoteGoal.category).toBe('travel');
      expect(remoteGoal.target_amount).toBe(5000);
      expect(mappers.savingsGoal.toLocal(remoteGoal)).toEqual(goal);

      const deposit: SavingsDeposit = {
        id: 'dep_test_1',
        savingsGoalId: 'svg_japan',
        amount: 300,
        type: 'deposit',
        loggedAt: '2026-10-10T12:00:00.000Z',
        note: 'Side freelance savings',
      };

      const remoteDeposit = mappers.savingsDeposit.toRemote(deposit, userId);
      expect(remoteDeposit.amount).toBe(300);
      expect(remoteDeposit.type).toBe('deposit');
      expect(mappers.savingsDeposit.toLocal(remoteDeposit)).toEqual(deposit);
    });
  });

  describe('Outbox Mutation Queueing on Dexie Tables', () => {
    let testDb: NemoDatabase;

    beforeEach(async () => {
      testDb = new NemoDatabase(`NemoFinanceSyncTest_${Date.now()}`);
      registerDexieSyncHooks(testDb);
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('queues outbox mutation when financial commitment is added', async () => {
      const com: FinancialCommitment = {
        id: 'com_outbox_test',
        title: 'Internet Fiber',
        amount: 99,
        category: 'utilities',
        dueDayOfMonth: 20,
        isPaidThisMonth: false,
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await testDb.financialCommitments.put(com);

      const mutations = await testDb.syncMutations.toArray();
      const match = mutations.find((m) => m.entityType === 'financialCommitment' && m.entityId === 'com_outbox_test');
      expect(match).toBeDefined();
      expect(match?.operation).toBe('UPSERT');
      expect(match?.payload.title).toBe('Internet Fiber');
    });

    it('queues outbox mutation when savings goal is updated or deleted', async () => {
      const goal: SavingsGoal = {
        id: 'svg_outbox_test',
        title: 'Emergency Fund',
        targetAmount: 3000,
        currentAmount: 1000,
        category: 'emergency',
        color: '#34D399',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await testDb.savingsGoals.put(goal);
      await testDb.savingsGoals.delete('svg_outbox_test');

      const mutations = await testDb.syncMutations.toArray();
      const deleteMutation = mutations.find((m) => m.entityType === 'savingsGoal' && m.operation === 'DELETE');
      expect(deleteMutation).toBeDefined();
      expect(deleteMutation?.entityId).toBe('svg_outbox_test');
    });

    it('resolves LWW deterministically: newer local paid commitment wins over older remote unpaid commitment', () => {
      const olderRemoteUnpaid: FinancialCommitment = {
        id: 'com_lww_1',
        title: 'Electricity Bill',
        amount: 150,
        category: 'utilities',
        dueDayOfMonth: 15,
        isPaidThisMonth: false,
        autoRenew: true,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T08:00:00.000Z',
      };

      const newerLocalPaid: FinancialCommitment = {
        id: 'com_lww_1',
        title: 'Electricity Bill',
        amount: 150,
        category: 'utilities',
        dueDayOfMonth: 15,
        isPaidThisMonth: true,
        lastPaidMonthYear: '2026-10',
        autoRenew: true,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-26T08:00:00.000Z',
      };

      const { resolved } = resolveGenericLWW(newerLocalPaid, olderRemoteUnpaid);
      expect(resolved.isPaidThisMonth).toBe(true);
      expect(resolved.lastPaidMonthYear).toBe('2026-10');
      expect(resolved.updatedAt).toBe('2026-10-26T08:00:00.000Z');
    });

    it('resolves LWW correctly when remote has newer updatedAt from cloud update', () => {
      const olderLocal: FinancialCommitment = {
        id: 'com_lww_2',
        title: 'Water Bill',
        amount: 40,
        category: 'utilities',
        dueDayOfMonth: 20,
        isPaidThisMonth: false,
        autoRenew: true,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T08:00:00.000Z',
      };

      const newerRemotePaid: FinancialCommitment = {
        id: 'com_lww_2',
        title: 'Water Bill',
        amount: 40,
        category: 'utilities',
        dueDayOfMonth: 20,
        isPaidThisMonth: true,
        lastPaidMonthYear: '2026-10',
        autoRenew: true,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-26T08:00:00.000Z',
      };

      const { resolved } = resolveGenericLWW(olderLocal, newerRemotePaid);
      expect(resolved.isPaidThisMonth).toBe(true);
      expect(resolved.lastPaidMonthYear).toBe('2026-10');
    });
  });
});
