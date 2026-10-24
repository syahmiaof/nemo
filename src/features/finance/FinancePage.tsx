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
import { Button } from '@/components/ui/Button';
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
        title="Pengurusan Kewangan"
        description="Kawal komitmen bulanan, pantau bayaran hutang, rancang simpanan dan kawal nafsu belanja secara bijak."
        stats={[
          { label: 'Gaji Bersih (RM)', value: Math.round(monthlyIncome), icon: Wallet },
          { label: 'Komitmen Bil (RM)', value: Math.round(totalCommitments), icon: CalendarDays },
          { label: 'Ansuran Hutang (RM)', value: Math.round(totalDebtInstallments), icon: CreditCard },
          {
            label: 'Safe-to-Spend (RM)',
            value: Math.round(safeToSpend),
            icon: ShieldCheck,
            note: `${safeToSpendRatio}% baki`,
          },
        ]}
      />

      {/* Safe-to-Spend Cash Flow Banner */}
      <div className="bg-surface-elevated/70 backdrop-blur-md border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                cashFlowStatus === 'healthy'
                  ? 'bg-accent-mint/10 border border-accent-mint/20 text-accent-mint'
                  : cashFlowStatus === 'caution'
                  ? 'bg-accent-amber/10 border border-accent-amber/20 text-accent-amber'
                  : 'bg-accent-ember/10 border border-accent-ember/20 text-accent-ember'
              }`}
            >
              {cashFlowStatus === 'healthy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : cashFlowStatus === 'caution' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-content-primary">
                  Safe-to-Spend (Baki Selamat Dibelanja): {formatRM(safeToSpend)}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    cashFlowStatus === 'healthy'
                      ? 'bg-accent-mint/10 border-accent-mint/20 text-accent-mint'
                      : cashFlowStatus === 'caution'
                      ? 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber'
                      : 'bg-accent-ember/10 border-accent-ember/20 text-accent-ember'
                  }`}
                >
                  {cashFlowStatus === 'healthy'
                    ? 'ALIRAN TUNAI SIHAT'
                    : cashFlowStatus === 'caution'
                    ? 'SEDERHANA BERHATI-HATI'
                    : 'KRITIKAL / KETAT'}
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                {monthlyIncome <= 0
                  ? 'Sila kemas kini gaji bersih anda untuk mengira peruntukan selamat berbelanja.'
                  : `Selepas ditolak bil komitmen (${formatRM(totalCommitments)}) dan ansuran pinjaman (${formatRM(
                      totalDebtInstallments
                    )}), anda mempunyai baki selamat sebanyak ${formatRM(safeToSpend)} untuk perbelanjaan harian & simpanan.`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Kemas Kini Gaji & Hari Gaji</span>
          </Button>
        </div>

        {/* Visual Allocation Bar */}
        {monthlyIncome > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 rounded-full bg-surface-solid overflow-hidden flex border border-border-subtle">
              {/* Commitments Bar */}
              <div
                className="bg-accent-amber transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalCommitments / monthlyIncome) * 100))}%` }}
                title={`Komitmen Bil: ${formatRM(totalCommitments)}`}
              />
              {/* Debt Installments Bar */}
              <div
                className="bg-accent-ember transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalDebtInstallments / monthlyIncome) * 100))}%` }}
                title={`Ansuran Hutang: ${formatRM(totalDebtInstallments)}`}
              />
              {/* Safe to spend Bar */}
              <div
                className="bg-accent-mint transition-all duration-500"
                style={{ width: `${Math.min(100, safeToSpendRatio)}%` }}
                title={`Safe to Spend: ${formatRM(safeToSpend)}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-content-tertiary pt-1 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-amber inline-block" />
                Komitmen ({Math.round((totalCommitments / monthlyIncome) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-ember inline-block" />
                Ansuran Hutang ({Math.round((totalDebtInstallments / monthlyIncome) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-accent-mint">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-mint inline-block" />
                Safe-to-Spend ({safeToSpendRatio}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'Semua & Ringkasan', icon: LayoutGrid },
          { key: 'commitments', label: `Komitmen (${commitments.length})`, icon: CalendarDays },
          { key: 'debts', label: `Hutang (${debts.length})`, icon: CreditCard },
          { key: 'wishlist', label: `Hajat & Anti-Impuls (${wishlistItems.length})`, icon: ShoppingBag },
          { key: 'savings', label: `Tabung (${savingsGoals.length})`, icon: PiggyBank },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as FinanceTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-surface-solid border border-border-emphasis text-content-primary shadow-xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
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
