import { FinancialCommitment, DebtItem, SavingsGoal, WishlistItem } from '@/domain/types';

/**
 * Formats a number to Malaysian Ringgit (RM 1,234.56).
 */
export function formatRM(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `RM ${safeAmount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculates Safe-to-Spend cash flow:
 * Safe-to-Spend = Net Income - Total Monthly Commitments - Total Monthly Debt Installments
 */
export function calculateSafeToSpend(
  monthlyIncomeNet: number,
  commitments: FinancialCommitment[],
  debts: DebtItem[]
): {
  safeToSpend: number;
  totalCommitments: number;
  totalDebtInstallments: number;
  safeToSpendRatio: number; // percentage of net income
  status: 'healthy' | 'caution' | 'critical';
} {
  const totalCommitments = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalDebtInstallments = debts.reduce((sum, d) => sum + (d.monthlyInstallment || 0), 0);
  const safeToSpend = Math.max(0, monthlyIncomeNet - totalCommitments - totalDebtInstallments);
  
  const safeToSpendRatio = monthlyIncomeNet > 0 
    ? Math.round((safeToSpend / monthlyIncomeNet) * 100) 
    : 0;

  let status: 'healthy' | 'caution' | 'critical' = 'healthy';
  if (safeToSpendRatio < 15) {
    status = 'critical';
  } else if (safeToSpendRatio < 35) {
    status = 'caution';
  }

  return {
    safeToSpend,
    totalCommitments,
    totalDebtInstallments,
    safeToSpendRatio,
    status,
  };
}

/**
 * Calculates remaining days in anti-impulse cooling-off period.
 * Returns { isCooling: boolean, daysRemaining: number, daysElapsed: number }
 */
export function calculateCoolingOffStatus(wishlist: WishlistItem): {
  isCooling: boolean;
  daysRemaining: number;
  daysElapsed: number;
} {
  const addedDate = new Date(wishlist.addedAt).getTime();
  const now = Date.now();
  const daysElapsed = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));
  const coolingPeriod = wishlist.coolingOffDays ?? 14;
  const daysRemaining = Math.max(0, coolingPeriod - daysElapsed);

  return {
    isCooling: daysRemaining > 0 && !wishlist.isBought,
    daysRemaining,
    daysElapsed,
  };
}

/**
 * Calculates projected payoff date for a debt given current balance and monthly installment.
 */
export function calculateDebtPayoffProjection(debt: DebtItem): {
  monthsRemaining: number;
  projectedPayoffText: string;
} {
  if (debt.currentBalance <= 0) {
    return { monthsRemaining: 0, projectedPayoffText: 'Lunas Sepenuhnya' };
  }
  if (!debt.monthlyInstallment || debt.monthlyInstallment <= 0) {
    return { monthsRemaining: 0, projectedPayoffText: 'Tiada jadual bayaran' };
  }

  const monthsRemaining = Math.ceil(debt.currentBalance / debt.monthlyInstallment);
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining);

  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  const formattedDate = `${monthNames[payoffDate.getMonth()]} ${payoffDate.getFullYear()}`;

  return {
    monthsRemaining,
    projectedPayoffText: `${formattedDate} (~${monthsRemaining} bulan lagi)`,
  };
}

/**
 * Calculates suggested monthly saving pace for a savings goal.
 */
export function calculateMonthlySavingsPace(goal: SavingsGoal): {
  suggestedMonthly: number;
  monthsRemaining: number;
} {
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (remainingAmount <= 0) {
    return { suggestedMonthly: 0, monthsRemaining: 0 };
  }
  if (!goal.targetDate) {
    return { suggestedMonthly: 0, monthsRemaining: 0 };
  }

  const target = new Date(goal.targetDate).getTime();
  const now = Date.now();
  const diffDays = Math.max(1, Math.floor((target - now) / (1000 * 60 * 60 * 24)));
  const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.4));
  const suggestedMonthly = Math.ceil(remainingAmount / monthsRemaining);

  return { suggestedMonthly, monthsRemaining };
}
