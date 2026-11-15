import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { parseRoadmapNotes, serializeRoadmapNotes } from '../data/roadmapNotes';

const LOCAL_STORAGE_KEY = 'nemo_personal_diary';
const LOCAL_STORAGE_UPDATED_KEY = 'nemo_personal_diary_updated_at';

export function usePersonalDiary(currentYear: number, currentMonth: number) {
  const [diaryText, setDiaryText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  });

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LOCAL_STORAGE_UPDATED_KEY);
  });

  // Query roadmap items to find any remote diary updates (e.g. synced from another device)
  const roadmapItems = useLiveQuery(() => db.monthlyRoadmaps.toArray(), []);

  useEffect(() => {
    if (!roadmapItems || roadmapItems.length === 0) return;

    let newestText: string | null = null;
    let newestTime = lastUpdatedAt ? new Date(lastUpdatedAt).getTime() : 0;

    for (const item of roadmapItems) {
      if (!item.notes) continue;
      const parsed = parseRoadmapNotes(item.notes);
      if (parsed.personalDiary !== undefined && parsed.diaryUpdatedAt) {
        const itemTime = new Date(parsed.diaryUpdatedAt).getTime();
        if (itemTime > newestTime) {
          newestTime = itemTime;
          newestText = parsed.personalDiary;
        }
      }
    }

    if (newestText !== null) {
      setDiaryText(newestText);
      const isoTime = new Date(newestTime).toISOString();
      setLastUpdatedAt(isoTime);
      localStorage.setItem(LOCAL_STORAGE_KEY, newestText);
      localStorage.setItem(LOCAL_STORAGE_UPDATED_KEY, isoTime);
    }
  }, [roadmapItems, lastUpdatedAt]);

  const saveDiary = useCallback(
    async (newText: string) => {
      const now = new Date().toISOString();
      setDiaryText(newText);
      setLastUpdatedAt(now);
      localStorage.setItem(LOCAL_STORAGE_KEY, newText);
      localStorage.setItem(LOCAL_STORAGE_UPDATED_KEY, now);

      // Persist into the active monthlyRoadmaps record for multi-device sync
      const targetId = `rm_${currentYear}_${String(currentMonth).padStart(2, '0')}`;
      try {
        const existing = await db.monthlyRoadmaps.get(targetId);
        if (existing) {
          const notesObj = parseRoadmapNotes(existing.notes);
          notesObj.personalDiary = newText;
          notesObj.diaryUpdatedAt = now;
          await db.monthlyRoadmaps.put({
            ...existing,
            notes: serializeRoadmapNotes(notesObj),
            updatedAt: now,
          });
        } else {
          // If no month record yet, create one so sync works immediately
          const notesObj = {
            bestVersionDays: [],
            personalDiary: newText,
            diaryUpdatedAt: now,
          };
          await db.monthlyRoadmaps.put({
            id: targetId,
            year: currentYear,
            month: currentMonth,
            theme: 'Monthly Focus',
            primaryGoal: '-',
            strategy: '-',
            mascot: 'rocket',
            status: 'in_progress',
            notes: serializeRoadmapNotes(notesObj),
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (err) {
        console.warn('Failed to sync personal diary to monthlyRoadmaps:', err);
      }
    },
    [currentYear, currentMonth]
  );

  return {
    diaryText,
    lastUpdatedAt,
    saveDiary,
  };
}
