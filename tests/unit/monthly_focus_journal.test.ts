import { describe, it, expect } from 'vitest';
import { parseRoadmapNotes, serializeRoadmapNotes } from '@/features/overview/data/roadmapNotes';
import { MonthlyRoadmapItemSchema } from '@/domain/schemas';

describe('Monthly Focus & Personal Journal Data Architecture', () => {
  it('parses and serializes roadmap notes with best version days, journal, and raw inputs', () => {
    const payload = {
      bestVersionDays: [1, 2, 5, 15, 28],
      personalDiary: 'Aku adalah seorang developer yang berdisiplin dan fokus pada impian besar.',
      diaryUpdatedAt: '2026-11-15T12:00:00.000Z',
      rawSmartGoal: 'Simpan RM 10,000 dan siapkan MVP',
      rawAchieved: '1. Selesai projek portfolio\n2. Bayar kereta Affin',
      rawWant: '1. Siapkan backend\n2. Konsisten gym',
    };

    const serialized = serializeRoadmapNotes(payload);
    expect(typeof serialized).toBe('string');

    const parsed = parseRoadmapNotes(serialized);
    expect(parsed.bestVersionDays).toEqual([1, 2, 5, 15, 28]);
    expect(parsed.personalDiary).toBe(payload.personalDiary);
    expect(parsed.diaryUpdatedAt).toBe(payload.diaryUpdatedAt);
    expect(parsed.rawSmartGoal).toBe(payload.rawSmartGoal);
    expect(parsed.rawAchieved).toBe(payload.rawAchieved);
    expect(parsed.rawWant).toBe(payload.rawWant);
  });

  it('handles empty or legacy plain text gracefully without throwing errors', () => {
    expect(parseRoadmapNotes(undefined)).toEqual({});
    expect(parseRoadmapNotes('')).toEqual({});
    expect(parseRoadmapNotes('plain text legacy note')).toEqual({});
    expect(parseRoadmapNotes('{"invalidJson":')).toEqual({});
  });

  it('validates MonthlyRoadmapItemSchema with serialized JSON notes up to 100,000 characters', () => {
    const longDiary = 'A'.repeat(5000);
    const notesJson = serializeRoadmapNotes({
      bestVersionDays: [1, 2, 3, 4, 5],
      personalDiary: longDiary,
      diaryUpdatedAt: new Date().toISOString(),
    });

    const item = {
      id: 'rm_2026_11',
      year: 2026,
      month: 11,
      theme: 'Wealth & Asset Growth',
      primaryGoal: 'Allocate year-end reserve',
      strategy: 'Auto-transfer on payday',
      mascot: 'wealth' as const,
      status: 'in_progress' as const,
      notes: notesJson,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-15T00:00:00.000Z',
    };

    const result = MonthlyRoadmapItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });
});
