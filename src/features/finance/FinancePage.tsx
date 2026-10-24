import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { db } from '@/db/nemoDb';
import {
  atomicUpdateFinancialProfile,
  atomicAddCommitment,
  atomicToggleCommitmentPaid,
  atomicDeleteCommitment,
  atomicAddDebt,
  atomicRecordDebtPayment,
  atomicDeleteDebt,
  atomicAddWishlistItem,
  atomicToggleWishlistBought,
  atomicConvertWishlistToSavings,
  atomicDeleteWishlistItem,
  atomicAddSavingsGoal,
  atomicRecordSavingsDeposit,
  atomicDeleteSavingsGoal,
} from '@/db/operations';
import { formatRM, calculateSafeToSpend } from './financeUtils';
import { FinancialProfileModal } from './FinancialProfileModal';
import { MonthlyCommitmentsCard } from './MonthlyCommitmentsCard';
import { DebtsManagerCard } from './DebtsManagerCard';
import { WishlistCard } from './WishlistCard';
import { SavingsGoalsCard } from './SavingsGoalsCard';
import { PageHeading } from '@/components/ui/PageHeading';
import { useReducedMotion } from '@/design/useReducedMotion';
import {
  Wallet,
  CreditCard,
  ShoppingBag,
  PiggyBank,
  CalendarDays,
  LayoutGrid,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Settings2,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

type FinanceTab = 'all' | 'commitments' | 'debts' | 'wishlist' | 'savings';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('all');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Reactive Dexie queries
  const profiles = useLiveQuery(() => db.financialProfiles.toArray(), []) ?? [];
  const commitments = useLiveQuery(() => db.financialCommitments.toArray(), []) ?? [];
  const debts = useLiveQuery(() => db.debts.toArray(), []) ?? [];
  const debtPayments = useLiveQuery(() => db.debtPayments.toArray(), []) ?? [];
  const wishlistItems = useLiveQuery(() => db.wishlistItems.toArray(), []) ?? [];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), []) ?? [];
  const savingsDeposits = useLiveQuery(() => db.savingsDeposits.toArray(), []) ?? [];

  const profile = profiles[0] ?? null;
  const monthlyIncome = profile?.monthlyIncomeNet ?? 0;

  // Safe-to-Spend calculations
  const {
    safeToSpend,
    totalCommitments,
    totalDebtInstallments,
    safeToSpendRatio,
    status: cashFlowStatus,
  } = calculateSafeToSpend(monthlyIncome, commitments, debts);

  const commitmentsRatio = monthlyIncome > 0
    ? Math.min(100, Math.round((totalCommitments / monthlyIncome) * 100))
    : 0;

  const debtRatio = monthlyIncome > 0
    ? Math.min(100, Math.round((totalDebtInstallments / monthlyIncome) * 100))
    : 0;

  // Staggered GSAP entrance animation
  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;
      gsap.fromTo(
        '.finance-card-anim',
        { opacity: 0, y: 16, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    },
    { scope: containerRef, dependencies: [activeTab, reducedMotion] }
  );

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Heading & High-Level Stats */}
      <PageHeading
        title="Finance Hub"
        description="Command cash flow, eliminate debt liabilities, conquer impulse spending, and build high-conviction sinking funds."
        stats={[
          { label: 'Net Monthly Income', value: Math.round(monthlyIncome), icon: Wallet },
          { label: 'Fixed Commitments', value: Math.round(totalCommitments), icon: CalendarDays },
          { label: 'Debt Installments', value: Math.round(totalDebtInstallments), icon: CreditCard },
          {
            label: 'Safe-to-Spend',
            value: Math.round(safeToSpend),
            icon: ShieldCheck,
            note: `${safeToSpendRatio}% buffer`,
          },
        ]}
      />

      {/* Visual Safe-to-Spend Centerpiece Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Background ambient glowing orbs */}
        <div
          className={`absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            cashFlowStatus === 'healthy'
              ? 'bg-emerald-500/10'
              : cashFlowStatus === 'caution'
              ? 'bg-amber-500/10'
              : 'bg-rose-500/10'
          }`}
        />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                  cashFlowStatus === 'healthy'
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : cashFlowStatus === 'caution'
                    ? 'bg-amber-500/15 border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-rose-500/15 border-rose-400/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                }`}
              >
                {cashFlowStatus === 'healthy' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : cashFlowStatus === 'caution' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Flame className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-content-primary">
                    Safe-to-Spend Cash Flow Radar
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${
                      cashFlowStatus === 'healthy'
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : cashFlowStatus === 'caution'
                        ? 'bg-amber-500/15 border-amber-400/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-rose-500/15 border-rose-400/30 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    }`}
                  >
                    {cashFlowStatus === 'healthy'
                      ? 'HEALTHY CASH FLOW'
                      : cashFlowStatus === 'caution'
                      ? 'CAUTION / TIGHT BUFFER'
                      : 'DEFICIT / CRITICAL RISK'}
                  </span>
                </div>
                <p className="text-xs text-content-secondary mt-0.5">
                  Real-time disposable liquidity calculated directly from your living commitments and debt obligations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Settings2 className="w-4 h-4 text-cyan-400" />
              <span>Configure Income & Payday</span>
            </button>
          </div>

          {/* Visual Gauge & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: SVG Radial Semi-Circle Meter */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
                <svg className="w-48 h-48 -mb-24" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <path
                    d="M 10,50 A 40,40 0 0,1 90,50"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Animated Progress Arc */}
                  <path
                    d="M 10,50 A 40,40 0 0,1 90,50"
                    fill="none"
                    stroke={
                      cashFlowStatus === 'healthy'
                        ? '#34d399'
                        : cashFlowStatus === 'caution'
                        ? '#fbbf24'
                        : '#f43f5e'
                    }
                    strokeWidth="8"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (126 * Math.min(100, safeToSpendRatio)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 6px ${
                        cashFlowStatus === 'healthy'
                          ? 'rgba(52,211,153,0.5)'
                          : cashFlowStatus === 'caution'
                          ? 'rgba(251,191,36,0.5)'
                          : 'rgba(244,63,94,0.5)'
                      })`,
                    }}
                  />
                </svg>

                {/* Meter Center Numbers */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-center pointer-events-none">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow">
                    {safeToSpendRatio}%
                  </span>
                  <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
                    Discretionary Buffer
                  </span>
                </div>
              </div>

              {/* Big Readout */}
              <div className="mt-3 text-center">
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
                  {formatRM(safeToSpend)}
                </div>
                <div className="text-xs text-content-secondary mt-0.5">
                  Safe unrestricted spending available this monthly cycle
                </div>
              </div>
            </div>

            {/* Right: Multi-Segment Allocation Bar & Detailed Stats */}
            <div className="lg:col-span-7 space-y-4">
              {monthlyIncome > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-content-secondary">Capital Allocation Spectrum</span>
                      <span className="text-content-primary font-mono">{formatRM(monthlyIncome)} Net</span>
                    </div>

                    {/* Gradient Segmented Allocation Bar */}
                    <div className="w-full h-4 rounded-full bg-black/40 overflow-hidden flex border border-white/[0.08] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                      {/* Fixed Commitments */}
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${commitmentsRatio}%` }}
                        title={`Fixed Commitments: ${formatRM(totalCommitments)} (${commitmentsRatio}%)`}
                      />
                      {/* Debt Service */}
                      <div
                        className="bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        style={{ width: `${debtRatio}%` }}
                        title={`Debt Installments: ${formatRM(totalDebtInstallments)} (${debtRatio}%)`}
                      />
                      {/* Safe to Spend */}
                      <div
                        className="bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                        style={{ width: `${Math.min(100, safeToSpendRatio)}%` }}
                        title={`Safe-to-Spend: ${formatRM(safeToSpend)} (${safeToSpendRatio}%)`}
                      />
                    </div>
                  </div>

                  {/* 3 Metric Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                        Fixed Bills
                      </div>
                      <div className="text-base font-bold font-mono text-content-primary">
                        {formatRM(totalCommitments)}
                      </div>
                      <div className="text-[10px] text-content-secondary mt-0.5">
                        {commitmentsRatio}% of Net Income
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 mb-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                        Debt Service
                      </div>
                      <div className="text-base font-bold font-mono text-content-primary">
                        {formatRM(totalDebtInstallments)}
                      </div>
                      <div className="text-[10px] text-content-secondary mt-0.5">
                        {debtRatio}% of Net Income
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                        Safe Discretionary
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-400">
                        {formatRM(safeToSpend)}
                      </div>
                      <div className="text-[10px] text-content-secondary mt-0.5">
                        {safeToSpendRatio}% Remaining
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] text-center space-y-2">
                  <p className="text-sm font-semibold text-content-primary">
                    Net monthly income not yet configured
                  </p>
                  <p className="text-xs text-content-secondary max-w-md mx-auto">
                    Set your monthly take-home pay and salary date to unlock real-time safe-to-spend ratios and capital budgeting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'Overview & All', icon: LayoutGrid },
          { key: 'commitments', label: `Commitments & Bills (${commitments.length})`, icon: CalendarDays },
          { key: 'debts', label: `Debt Payoff (${debts.length})`, icon: CreditCard },
          { key: 'wishlist', label: `Anti-Impulse Vault (${wishlistItems.length})`, icon: ShoppingBag },
          { key: 'savings', label: `Sinking Funds (${savingsGoals.length})`, icon: PiggyBank },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as FinanceTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.08] border border-white/[0.15] text-white shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                  : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-content-tertiary'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        {(activeTab === 'all' || activeTab === 'commitments') && (
          <div className="finance-card-anim">
            <MonthlyCommitmentsCard
              commitments={commitments}
              onAddCommitment={async (data) => {
                await atomicAddCommitment(db, data);
              }}
              onTogglePaid={async (id, isPaid) => {
                await atomicToggleCommitmentPaid(db, id, isPaid);
              }}
              onDeleteCommitment={async (id) => {
                await atomicDeleteCommitment(db, id);
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'debts') && (
          <div className="finance-card-anim">
            <DebtsManagerCard
              debts={debts}
              payments={debtPayments}
              onAddDebt={async (data) => {
                await atomicAddDebt(db, data);
              }}
              onRecordPayment={async (data) => {
                await atomicRecordDebtPayment(db, data);
              }}
              onDeleteDebt={async (id) => {
                await atomicDeleteDebt(db, id);
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'wishlist') && (
          <div className="finance-card-anim">
            <WishlistCard
              wishlistItems={wishlistItems}
              onAddWishlistItem={async (data) => {
                await atomicAddWishlistItem(db, data);
              }}
              onToggleBought={async (id, isBought) => {
                await atomicToggleWishlistBought(db, id, isBought);
              }}
              onConvertToSavings={async (id) => {
                await atomicConvertWishlistToSavings(db, id, {
                  category: 'gadget',
                  color: '#38BDF8',
                });
              }}
              onDeleteWishlistItem={async (id) => {
                await atomicDeleteWishlistItem(db, id);
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'savings') && (
          <div className="finance-card-anim">
            <SavingsGoalsCard
              savingsGoals={savingsGoals}
              deposits={savingsDeposits}
              onAddSavingsGoal={async (data) => {
                await atomicAddSavingsGoal(db, data);
              }}
              onRecordDeposit={async (data) => {
                await atomicRecordSavingsDeposit(db, data);
              }}
              onDeleteSavingsGoal={async (id) => {
                await atomicDeleteSavingsGoal(db, id);
              }}
            />
          </div>
        )}
      </div>

      {/* Financial Profile Modal */}
      <FinancialProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={async (data) => {
          await atomicUpdateFinancialProfile(db, data);
        }}
      />
    </div>
  );
};
