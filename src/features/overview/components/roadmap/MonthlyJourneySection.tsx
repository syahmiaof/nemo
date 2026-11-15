import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { MonthlyFocusCard } from './MonthlyFocusCard';
import { BestVersionCalendarCard } from './BestVersionCalendarCard';
import { PersonalJournalCard } from './PersonalJournalCard';
import { usePersonalDiary } from '@/features/overview/hooks/usePersonalDiary';
import { parseRoadmapNotes, serializeRoadmapNotes } from '@/features/overview/data/roadmapNotes';
import { useToast } from '@/components/ui/Toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthlyJourneySection: React.FC = () => {
  const currentCalendarDate = new Date();
  const currentCalendarMonth = currentCalendarDate.getMonth() + 1; // 1 to 12
  const currentCalendarYear = currentCalendarDate.getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentCalendarMonth);
  const { error } = useToast();

  const targetId = `rm_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;

  // Query the roadmap item for selectedYear and selectedMonth
  const activeRoadmapItem = useLiveQuery(
    () => db.monthlyRoadmaps.get(targetId),
    [targetId]
  );

  // Clean out legacy seeded dummy blueprints from Dexie so only user-authored months exist
  useEffect(() => {
    const purgeDummyRoadmaps = async () => {
      try {
        const all = await db.monthlyRoadmaps.toArray();
        const dummyIds: string[] = [];
        for (const item of all) {
          if (item.id === 'rm_2026_11') continue;
          const parsed = parseRoadmapNotes(item.notes);
          if (
            !parsed.rawAchieved &&
            !parsed.rawWant &&
            (!parsed.bestVersionDays || parsed.bestVersionDays.length === 0)
          ) {
            dummyIds.push(item.id);
          }
        }
        if (dummyIds.length > 0) {
          await db.monthlyRoadmaps.bulkDelete(dummyIds);
        }
      } catch (err) {
        console.warn('Failed to clean dummy roadmaps:', err);
      }
    };
    void purgeDummyRoadmaps();
  }, []);

  // Hook for the continuous, persistent Personal Journal
  const { diaryText, lastUpdatedAt, saveDiary } = usePersonalDiary(
    selectedYear,
    selectedMonth
  );

  const monthName = MONTH_NAMES[selectedMonth - 1] || 'Current Month';
  const isCurrentMonth =
    selectedYear === currentCalendarYear && selectedMonth === currentCalendarMonth;

  // Extract parsed notes for bestVersionDays & raw inputs
  const parsedNotes = useMemo(() => {
    return parseRoadmapNotes(activeRoadmapItem?.notes);
  }, [activeRoadmapItem?.notes]);

  const tickedDays = useMemo(() => {
    return parsedNotes.bestVersionDays || [];
  }, [parsedNotes]);

  const achievedText = useMemo(() => {
    if (parsedNotes.rawAchieved !== undefined) return parsedNotes.rawAchieved;
    if (targetId === 'rm_2026_11') {
      return activeRoadmapItem?.strategy === '-' ? '' : activeRoadmapItem?.strategy || '';
    }
    return '';
  }, [parsedNotes.rawAchieved, activeRoadmapItem?.strategy, targetId]);

  const wantAchieveText = useMemo(() => {
    if (parsedNotes.rawWant !== undefined) return parsedNotes.rawWant;
    if (targetId === 'rm_2026_11') {
      return activeRoadmapItem?.primaryGoal === '-' ? '' : activeRoadmapItem?.primaryGoal || '';
    }
    return '';
  }, [parsedNotes.rawWant, activeRoadmapItem?.primaryGoal, targetId]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth > 1) {
      setSelectedMonth((prev) => prev - 1);
    } else {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) {
      setSelectedMonth((prev) => prev + 1);
    } else {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(currentCalendarYear);
    setSelectedMonth(currentCalendarMonth);
  };

  // Toggle circular day in "I Be My Best Version"
  const handleToggleDay = async (day: number) => {
    try {
      const currentSet = new Set(tickedDays);
      if (currentSet.has(day)) {
        currentSet.delete(day);
      } else {
        currentSet.add(day);
      }
      const nextTicked = Array.from(currentSet).sort((a, b) => a - b);
      const now = new Date().toISOString();

      const updatedNotes = serializeRoadmapNotes({
        ...parsedNotes,
        bestVersionDays: nextTicked,
      });

      if (activeRoadmapItem) {
        await db.monthlyRoadmaps.put({
          ...activeRoadmapItem,
          notes: updatedNotes,
          updatedAt: now,
        });
      } else {
        // Create fresh entry for the month
        await db.monthlyRoadmaps.put({
          id: targetId,
          year: selectedYear,
          month: selectedMonth,
          theme: '-',
          primaryGoal: '-',
          strategy: '-',
          mascot: 'rocket',
          status: 'in_progress',
          notes: updatedNotes,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (err) {
      error('Gagal mengemaskini kalendar', err instanceof Error ? err.message : 'Sila cuba lagi.');
    }
  };

  // Save Monthly Focus (Achieved, Want to Achieve)
  const handleSaveFocus = async (data: {
    achievedText: string;
    wantAchieveText: string;
  }) => {
    const now = new Date().toISOString();
    const updatedNotes = serializeRoadmapNotes({
      ...parsedNotes,
      rawAchieved: data.achievedText,
      rawWant: data.wantAchieveText,
    });

    const theme = activeRoadmapItem?.theme || '-';
    const strategy = data.achievedText.trim() || '-';
    const primaryGoal = data.wantAchieveText.trim() || '-';

    if (activeRoadmapItem) {
      await db.monthlyRoadmaps.put({
        ...activeRoadmapItem,
        theme,
        strategy,
        primaryGoal,
        notes: updatedNotes,
        updatedAt: now,
      });
    } else {
      await db.monthlyRoadmaps.put({
        id: targetId,
        year: selectedYear,
        month: selectedMonth,
        theme,
        primaryGoal,
        strategy,
        mascot: 'rocket',
        status: 'in_progress',
        notes: updatedNotes,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  return (
    <div className="mt-6 sm:mt-8 flex flex-col gap-6" data-enter>
      {/* Part 1: Minimalist Monthly Focus (2-Column VS Layout) */}
      <MonthlyFocusCard
        year={selectedYear}
        month={selectedMonth}
        monthName={monthName}
        achievedText={achievedText}
        wantAchieveText={wantAchieveText}
        onSave={handleSaveFocus}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onResetToCurrentMonth={handleResetToCurrentMonth}
        isCurrentMonth={isCurrentMonth}
      />

      {/* Part 2: Side-by-Side Dual Section ("I Be My Best Version" + "Journal") */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: "I Be My Best Version" with Circular Ticks */}
        <BestVersionCalendarCard
          year={selectedYear}
          month={selectedMonth}
          monthName={monthName}
          tickedDays={tickedDays}
          onToggleDay={handleToggleDay}
        />

        {/* Right: Personal Journal & Manifesto (Continuous & Persistent) */}
        <PersonalJournalCard
          diaryText={diaryText}
          lastUpdatedAt={lastUpdatedAt}
          onSaveDiary={saveDiary}
        />
      </div>
    </div>
  );
};
