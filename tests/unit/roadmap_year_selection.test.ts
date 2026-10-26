import { describe, it, expect } from 'vitest';
import { createDefaultRoadmapForYear, DEFAULT_ROADMAP_ITEMS_2026 } from '@/features/overview/data/defaultRoadmaps';
import { MonthlyRoadmapItemSchema } from '@/domain/schemas';

describe('Annual Journey Roadmap Multi-Year & Auto-Rollover Logic', () => {
  it('returns exact curated 2026 items when year is 2026', () => {
    const items = createDefaultRoadmapForYear(2026);
    expect(items).toHaveLength(12);
    expect(items).toEqual(DEFAULT_ROADMAP_ITEMS_2026);
    items.forEach((item) => {
      expect(item.year).toBe(2026);
      expect(MonthlyRoadmapItemSchema.safeParse(item).success).toBe(true);
    });
  });

  it('generates 12 valid roadmap items for a past year (e.g. 2025) with completed statuses', () => {
    const items = createDefaultRoadmapForYear(2025);
    expect(items).toHaveLength(12);
    items.forEach((item, index) => {
      expect(item.year).toBe(2025);
      expect(item.month).toBe(index + 1);
      expect(item.id).toBe(`rm_2025_${String(index + 1).padStart(2, '0')}`);
      expect(item.status).toBe('completed');
      expect(item.completedAt).toBeDefined();
      expect(MonthlyRoadmapItemSchema.safeParse(item).success).toBe(true);
    });
  });

  it('generates 12 valid roadmap items for a future year (e.g. 2027) with upcoming statuses', () => {
    const items = createDefaultRoadmapForYear(2027);
    expect(items).toHaveLength(12);
    items.forEach((item, index) => {
      expect(item.year).toBe(2027);
      expect(item.month).toBe(index + 1);
      expect(item.id).toBe(`rm_2027_${String(index + 1).padStart(2, '0')}`);
      expect(item.status).toBe('upcoming');
      expect(item.completedAt).toBeUndefined();
      expect(MonthlyRoadmapItemSchema.safeParse(item).success).toBe(true);
    });
  });

  it('ensures all 12 mascots and themes are non-empty and well-structured across any arbitrary year', () => {
    const year2030 = createDefaultRoadmapForYear(2030);
    expect(year2030).toHaveLength(12);
    const months = year2030.map((it) => it.month);
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    year2030.forEach((it) => {
      expect(it.theme.length).toBeGreaterThan(3);
      expect(it.primaryGoal.length).toBeGreaterThan(10);
      expect(it.strategy.length).toBeGreaterThan(10);
      expect(['rocket', 'coder', 'scholar', 'wealth', 'archer', 'zen', 'sprinter', 'champion']).toContain(it.mascot);
    });
  });
});
