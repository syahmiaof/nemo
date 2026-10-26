import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { db } from '@/db/nemoDb';
import {
  atomicSaveIbadahDailyLog,
  atomicUpdateQadhaPrayer,
  atomicSetQadhaPrayerRemaining,
  atomicBulkSetQadhaPrayers,
  atomicUpsertQadhaFastingRecord,
  atomicDeleteQadhaFastingRecord,
} from '@/db/operations';
import { PageHeading } from '@/components/ui/PageHeading';
import { useReducedMotion } from '@/design/useReducedMotion';
import { PrayerTrackerCard } from './components/PrayerTrackerCard';
import { QuranTrackerCard } from './components/QuranTrackerCard';
import { QadhaPrayerSection } from './components/QadhaPrayerSection';
import { QadhaFastingSection } from './components/QadhaFastingSection';
import { DhikrSedekahCard } from './components/DhikrSedekahCard';
import { IslamicMotivationCard } from './components/IslamicMotivationCard';
import {
  Moon,
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  LayoutGrid,
} from 'lucide-react';
import {
  PrayerTimeName,
  DailyPrayerRecord,
  DailySunnahPrayers,
} from '@/domain/types';

gsap.registerPlugin(useGSAP);

type IbadahTab = 'all' | 'daily' | 'qadha_solat' | 'qadha_puasa' | 'motivation';

export const IbadahPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IbadahTab>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const todayStr = new Date().toISOString().split('T')[0];

  // Reactive Dexie queries
  const todayLogs = useLiveQuery(
    () => db.ibadahDailyLogs.where('date').equals(todayStr).toArray(),
    [todayStr]
  ) ?? [];
  const qadhaPrayers = useLiveQuery(() => db.qadhaPrayers.toArray(), []) ?? [];
  const qadhaFastings = useLiveQuery(() => db.qadhaFastings.toArray(), []) ?? [];

  const currentLog = todayLogs[0] ?? undefined;

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

  // Solat handler
  const handleUpdatePrayers = async (prayers: Record<PrayerTimeName, DailyPrayerRecord>) => {
    await atomicSaveIbadahDailyLog(db, {
      id: currentLog?.id || `ibd_${todayStr}`,
      date: todayStr,
      prayers,
      sunnahPrayers: currentLog?.sunnahPrayers || {},
      quranPagesRead: currentLog?.quranPagesRead || 0,
      quranLastSurah: currentLog?.quranLastSurah,
      quranLastAyah: currentLog?.quranLastAyah,
      dhikrCount: currentLog?.dhikrCount || 0,
      sedekahDone: currentLog?.sedekahDone || false,
      notes: currentLog?.notes,
    });
  };

  const handleUpdateSunnah = async (sunnahPrayers: DailySunnahPrayers) => {
    await atomicSaveIbadahDailyLog(db, {
      id: currentLog?.id || `ibd_${todayStr}`,
      date: todayStr,
      prayers: currentLog?.prayers || ({} as Record<PrayerTimeName, DailyPrayerRecord>),
      sunnahPrayers,
      quranPagesRead: currentLog?.quranPagesRead || 0,
      quranLastSurah: currentLog?.quranLastSurah,
      quranLastAyah: currentLog?.quranLastAyah,
      dhikrCount: currentLog?.dhikrCount || 0,
      sedekahDone: currentLog?.sedekahDone || false,
      notes: currentLog?.notes,
    });
  };

  // Quran handler
  const handleUpdateQuran = async (data: {
    quranPagesRead: number;
    quranLastSurah?: string;
    quranLastAyah?: number;
    notes?: string;
  }) => {
    await atomicSaveIbadahDailyLog(db, {
      id: currentLog?.id || `ibd_${todayStr}`,
      date: todayStr,
      prayers: currentLog?.prayers || ({} as Record<PrayerTimeName, DailyPrayerRecord>),
      sunnahPrayers: currentLog?.sunnahPrayers || {},
      quranPagesRead: data.quranPagesRead,
      quranLastSurah: data.quranLastSurah,
      quranLastAyah: data.quranLastAyah,
      dhikrCount: currentLog?.dhikrCount || 0,
      sedekahDone: currentLog?.sedekahDone || false,
      notes: data.notes ?? currentLog?.notes,
    });
  };

  // Dhikr & Sedekah handler
  const handleUpdateDhikr = async (count: number) => {
    await atomicSaveIbadahDailyLog(db, {
      id: currentLog?.id || `ibd_${todayStr}`,
      date: todayStr,
      prayers: currentLog?.prayers || ({} as Record<PrayerTimeName, DailyPrayerRecord>),
      sunnahPrayers: currentLog?.sunnahPrayers || {},
      quranPagesRead: currentLog?.quranPagesRead || 0,
      quranLastSurah: currentLog?.quranLastSurah,
      quranLastAyah: currentLog?.quranLastAyah,
      dhikrCount: count,
      sedekahDone: currentLog?.sedekahDone || false,
      notes: currentLog?.notes,
    });
  };

  const handleToggleSedekah = async (done: boolean) => {
    await atomicSaveIbadahDailyLog(db, {
      id: currentLog?.id || `ibd_${todayStr}`,
      date: todayStr,
      prayers: currentLog?.prayers || ({} as Record<PrayerTimeName, DailyPrayerRecord>),
      sunnahPrayers: currentLog?.sunnahPrayers || {},
      quranPagesRead: currentLog?.quranPagesRead || 0,
      quranLastSurah: currentLog?.quranLastSurah,
      quranLastAyah: currentLog?.quranLastAyah,
      dhikrCount: currentLog?.dhikrCount || 0,
      sedekahDone: done,
      notes: currentLog?.notes,
    });
  };

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

  // KPI Calculations
  const completedFardhuCount = currentLog?.prayers
    ? Object.values(currentLog.prayers).filter((p) => p.completed || (p.status && p.status !== 'missed')).length
    : 0;
  const totalQadhaPrayersRemaining = qadhaPrayers.reduce((s, p) => s + (p.remainingCount || 0), 0);
  const totalQadhaFastingRemaining = qadhaFastings.reduce((s, f) => s + (f.remainingDays || 0), 0);

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Heading */}
      <PageHeading
        title="Ibadah & Spiritual Hub"
        description="Track daily 5 obligatory prayers, Quran recitation, missed prayer makeup ledger, compounding fasting fidyah calculator, and spiritual habits."
        stats={[
          { label: 'Fardhu Prayers', value: completedFardhuCount, icon: Clock, note: 'out of 5 daily' },
          { label: "Today's Quran", value: currentLog?.quranPagesRead || 0, icon: BookOpen, note: 'pages read' },
          { label: 'Qadha Prayers Debt', value: totalQadhaPrayersRemaining, icon: Flame, note: 'prayers left' },
          { label: 'Missed Fasting Debt', value: totalQadhaFastingRemaining, icon: Moon, note: 'days left' },
        ]}
      />

      {/* Daily Motivation Banner */}
      <div className="ibadah-card-anim">
        <IslamicMotivationCard />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Sections', icon: LayoutGrid },
          { key: 'daily', label: 'Daily Habits & Prayers', icon: Clock },
          { key: 'qadha_solat', label: `Missed Prayers (${totalQadhaPrayersRemaining})`, icon: Flame },
          { key: 'qadha_puasa', label: `Fasting & Fidyah (${totalQadhaFastingRemaining}d)`, icon: Moon },
          { key: 'motivation', label: 'Spiritual Reflections', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as IbadahTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
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
          <>
            <div className="ibadah-card-anim">
              <PrayerTrackerCard
                currentLog={currentLog}
                onUpdatePrayers={handleUpdatePrayers}
                onUpdateSunnah={handleUpdateSunnah}
              />
            </div>

            <div className="ibadah-card-anim">
              <QuranTrackerCard
                currentLog={currentLog}
                onUpdateQuran={handleUpdateQuran}
              />
            </div>

            <div className="ibadah-card-anim">
              <DhikrSedekahCard
                currentLog={currentLog}
                onUpdateDhikr={handleUpdateDhikr}
                onToggleSedekah={handleToggleSedekah}
              />
            </div>
          </>
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
