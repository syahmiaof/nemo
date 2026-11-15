export interface RoadmapNotesPayload {
  bestVersionDays?: number[];
  personalDiary?: string;
  diaryUpdatedAt?: string;
  rawSmartGoal?: string;
  rawAchieved?: string;
  rawWant?: string;
}

export function parseRoadmapNotes(notesStr?: string): RoadmapNotesPayload {
  if (!notesStr) return {};
  try {
    const parsed = JSON.parse(notesStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        bestVersionDays: Array.isArray(parsed.bestVersionDays)
          ? parsed.bestVersionDays.filter((d: unknown): d is number => typeof d === 'number' && d >= 1 && d <= 31)
          : [],
        personalDiary: typeof parsed.personalDiary === 'string' ? parsed.personalDiary : undefined,
        diaryUpdatedAt: typeof parsed.diaryUpdatedAt === 'string' ? parsed.diaryUpdatedAt : undefined,
        rawSmartGoal: typeof parsed.rawSmartGoal === 'string' ? parsed.rawSmartGoal : undefined,
        rawAchieved: typeof parsed.rawAchieved === 'string' ? parsed.rawAchieved : undefined,
        rawWant: typeof parsed.rawWant === 'string' ? parsed.rawWant : undefined,
      };
    }
  } catch {
    // Fallback for legacy plain text notes
  }
  return {};
}

export function serializeRoadmapNotes(payload: RoadmapNotesPayload): string {
  return JSON.stringify(payload);
}
