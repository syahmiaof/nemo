import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { db } from '@/db/nemoDb';
import {
  atomicUpdateQadhaPrayer,
  atomicSetQadhaPrayerRemaining,
  atomicBulkSetQadhaPrayers,
  atomicUpsertQadhaFastingRecord,
  atomicDeleteQadhaFastingRecord,
} from '@/db/operations';
import { PageHeading } from '@/components/ui/PageHeading';
import { useReducedMotion } from '@/design/useReducedMotion';
import { IbadahChecklistCard } from './components/IbadahChecklistCard';
import { QadhaPrayerSection } from './components/QadhaPrayerSection';
import { QadhaFastingSection } from './components/QadhaFastingSection';
import {
  Moon,
  Sparkles,
  Flame,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { PrayerTimeName } from '@/domain/types';

gsap.registerPlugin(useGSAP);

type IbadahTab = 'all' | 'daily' | 'qadha_solat' | 'qadha_puasa';

export const IbadahPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IbadahTab>('all');
  const [ibadahStats, setIbadahStats] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 15,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const todayStr = new Date().toISOString().split('T')[0];

  // Reactive Dexie queries for Qadha debts
  const qadhaPrayers = useLiveQuery(() => db.qadhaPrayers.toArray(), []) ?? [];
  const qadhaFastings = useLiveQuery(() => db.qadhaFastings.toArray(), []) ?? [];

  // Staggered GSAP entrance animation
  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;
      gsap.fromTo(
        '.ibadah-card-anim',
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

  // Qadha Prayer handlers
  const handleUpdateQadhaPrayerCount = async (prayerType: PrayerTimeName, deltaCompleted: number) => {
    await atomicUpdateQadhaPrayer(db, prayerType, deltaCompleted, 0);
  };

  const handleAdjustTotalMissedPrayer = async (prayerType: PrayerTimeName, deltaTotal: number) => {
    await atomicUpdateQadhaPrayer(db, prayerType, 0, deltaTotal);
  };

  const handleSetPrayerRemaining = async (prayerType: PrayerTimeName, count: number) => {
    await atomicSetQadhaPrayerRemaining(db, prayerType, count);
  };

  const handleBulkSetPrayers = async (records: Array<{ prayerType: PrayerTimeName; remainingCount: number }>) => {
    await atomicBulkSetQadhaPrayers(db, records);
  };

  // Qadha Fasting handler
  const handleAddFastingRecord = async (data: {
    yearHijri: number;
    yearGregorian: number;
    missedDays: number;
    yearsDelayed: number;
    fidyahRate: number;
    totalFidyahAmount: number;
    notes?: string;
  }) => {
    await atomicUpsertQadhaFastingRecord(db, {
      id: `qf_${data.yearGregorian}`,
      yearHijri: data.yearHijri,
      yearGregorian: data.yearGregorian,
      missedDays: data.missedDays,
      qadhaCompletedDays: 0,
      remainingDays: data.missedDays,
      yearsDelayed: data.yearsDelayed,
      fidyahRate: data.fidyahRate,
      totalFidyahAmount: data.totalFidyahAmount,
      isFidyahPaid: false,
      notes: data.notes,
    });
  };

  const handleLogQadhaDay = async (id: string, deltaDays: number) => {
    const record = qadhaFastings.find((r) => r.id === id);
    if (!record) return;
    const nextCompleted = (record.qadhaCompletedDays || 0) + deltaDays;
    const nextRemaining = Math.max(0, (record.remainingDays || 0) - deltaDays);
    await atomicUpsertQadhaFastingRecord(db, {
      ...record,
      qadhaCompletedDays: nextCompleted,
      remainingDays: nextRemaining,
    });
  };

  const handleToggleFidyahPaid = async (id: string, isPaid: boolean) => {
    const record = qadhaFastings.find((r) => r.id === id);
    if (!record) return;
    await atomicUpsertQadhaFastingRecord(db, {
      ...record,
      isFidyahPaid: isPaid,
      fidyahPaidAt: isPaid ? new Date().toISOString() : undefined,
    });
  };

  const handleDeleteFastingRecord = async (id: string) => {
    await atomicDeleteQadhaFastingRecord(db, id);
  };

  // Debt Calculations
  const totalQadhaPrayersRemaining = qadhaPrayers.reduce((s, p) => s + (p.remainingCount || 0), 0);
  const totalQadhaFastingRemaining = qadhaFastings.reduce((s, f) => s + (f.remainingDays || 0), 0);

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Heading */}
      <PageHeading
        title="Ibadah & Spiritual Hub"
        description="Checklist amalan harian, rekod qadha solat fardhu, dan kiraan qadha puasa & fidyah."
        stats={[
          {
            label: 'Checklist Harian',
            value: ibadahStats.completed,
            icon: Moon,
            note: `of ${ibadahStats.total} selesai`,
          },
          {
            label: 'Qadha Solat Debt',
            value: totalQadhaPrayersRemaining,
            icon: Flame,
            note: 'waktu tinggal',
          },
          {
            label: 'Missed Fasting Debt',
            value: totalQadhaFastingRemaining,
            icon: Sparkles,
            note: 'hari tinggal',
          },
        ]}
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Sections', icon: LayoutGrid },
          { key: 'daily', label: `Checklist Harian (${ibadahStats.completed}/${ibadahStats.total})`, icon: CheckCircle2 },
          { key: 'qadha_solat', label: `Missed Prayers (${totalQadhaPrayersRemaining})`, icon: Flame },
          { key: 'qadha_puasa', label: `Fasting & Fidyah (${totalQadhaFastingRemaining}d)`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as IbadahTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white/[0.08] border border-white/[0.15] text-white shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                  : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-content-tertiary'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        {(activeTab === 'all' || activeTab === 'daily') && (
          <div className="ibadah-card-anim">
            <IbadahChecklistCard
              todayStr={todayStr}
              onCountChange={(completed, total) => setIbadahStats({ completed, total })}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'qadha_solat') && (
          <div className="ibadah-card-anim">
            <QadhaPrayerSection
              items={qadhaPrayers}
              onUpdatePrayerCount={handleUpdateQadhaPrayerCount}
              onAdjustTotalMissed={handleAdjustTotalMissedPrayer}
              onSetPrayerRemaining={handleSetPrayerRemaining}
              onBulkSetPrayers={handleBulkSetPrayers}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'qadha_puasa') && (
          <div className="ibadah-card-anim">
            <QadhaFastingSection
              records={qadhaFastings}
              onAddRecord={handleAddFastingRecord}
              onLogQadhaDay={handleLogQadhaDay}
              onToggleFidyahPaid={handleToggleFidyahPaid}
              onDeleteRecord={handleDeleteFastingRecord}
            />
          </div>
        )}
      </div>
    </div>
  );
};
