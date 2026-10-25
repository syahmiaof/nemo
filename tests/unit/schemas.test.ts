import { describe, it, expect } from 'vitest';
import { ProjectSchema, TaskSchema, BackupSchema, VisionItemSchema, MonthlyRoadmapItemSchema, RoadmapMascotSchema, RoadmapStatusSchema } from '@/domain/schemas';
import { toRemoteVisionItem, toLocalVisionItem, toRemoteMonthlyRoadmap, toLocalMonthlyRoadmap } from '@/sync/mappers';
import type { VisionItem, MonthlyRoadmapItem } from '@/domain/types';

describe('Zod Domain Schemas', () => {
  it('validates a valid project', () => {
    const valid = {
      id: 'p1',
      title: 'Nemo Core',
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['typescript', 'react'],
      techStack: ['dexie', 'tailwind'],
    };
    const result = ProjectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an empty project title', () => {
    const invalid = {
      id: 'p1',
      title: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = ProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates task with strict local date format', () => {
    const validTask = {
      id: 't1',
      title: 'Implement database layer',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2026-10-25',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
    expect(TaskSchema.safeParse(validTask).success).toBe(true);

    const invalidDateTask = {
      ...validTask,
      dueDate: '10/25/2026', // Invalid format
    };
    expect(TaskSchema.safeParse(invalidDateTask).success).toBe(false);
  });

  it('validates backup schema envelope and rejects corrupted versions', () => {
    const invalidBackup = {
      version: 999, // unsupported version
      exportedAt: new Date().toISOString(),
      app: 'nemo',
      data: {},
    };
    expect(BackupSchema.safeParse(invalidBackup).success).toBe(false);
  });

  it('validates a valid vision board item', () => {
    const validVisionItem: VisionItem = {
      id: 'vis_test_1',
      title: 'Solo Trip to Kyoto in Autumn',
      description: 'Visit Arashiyama bamboo forest and quiet shrines in late November.',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
      imageThumbnailUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
      horizon: 'short_term',
      category: 'travel_adventure',
      targetDate: '2026-11-20',
      estimatedCost: 3500,
      linkedGoalId: 'goal_kyoto',
      linkedSavingsGoalId: 'svg_trip',
      whyItMatters: 'Deep contemplation and reconnection with nature.',
      status: 'in_progress',
      order: 0,
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
    };

    const result = VisionItemSchema.safeParse(validVisionItem);
    expect(result.success).toBe(true);
  });

  it('rejects vision items with invalid category, horizon, or missing required fields', () => {
    const invalidCategory = {
      id: 'vis_invalid',
      title: 'Invalid Category Item',
      imageUrl: 'https://example.com/img.jpg',
      horizon: 'short_term',
      category: 'astrology', // invalid category
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(VisionItemSchema.safeParse(invalidCategory).success).toBe(false);

    const invalidHorizon = {
      id: 'vis_invalid_2',
      title: 'Invalid Horizon Item',
      imageUrl: 'https://example.com/img.jpg',
      horizon: 'infinite', // invalid horizon
      category: 'wealth_finance',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(VisionItemSchema.safeParse(invalidHorizon).success).toBe(false);

    const missingImage = {
      id: 'vis_invalid_3',
      title: 'Missing Image',
      imageUrl: '',
      horizon: 'north_star',
      category: 'personal_spiritual',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(VisionItemSchema.safeParse(missingImage).success).toBe(false);
  });

  it('correctly maps vision item between local and remote representations', () => {
    const localItem: VisionItem = {
      id: 'vis_sync_1',
      title: 'Financial Independence Portfolio',
      description: 'Passive income covering living expenses.',
      imageUrl: 'https://example.com/portfolio.jpg',
      imageThumbnailUrl: 'https://example.com/portfolio_thumb.jpg',
      horizon: 'long_term',
      category: 'wealth_finance',
      targetDate: '2030-01-01',
      estimatedCost: 500000,
      linkedGoalId: 'goal_fi',
      linkedSavingsGoalId: 'svg_investments',
      whyItMatters: 'Complete creative autonomy and freedom.',
      status: 'in_progress',
      manifestedAt: undefined,
      order: 2,
      createdAt: '2026-10-25T01:00:00.000Z',
      updatedAt: '2026-10-25T02:00:00.000Z',
      archivedAt: undefined,
    };

    const userId = '11111111-2222-3333-4444-555555555555';
    const remote = toRemoteVisionItem(localItem, userId);

    expect(remote.id).toBe(localItem.id);
    expect(remote.user_id).toBe(userId);
    expect(remote.title).toBe(localItem.title);
    expect(remote.image_url).toBe(localItem.imageUrl);
    expect(remote.image_thumbnail_url).toBe(localItem.imageThumbnailUrl);
    expect(remote.horizon).toBe('long_term');
    expect(remote.category).toBe('wealth_finance');
    expect(remote.target_date).toBe('2030-01-01');
    expect(remote.estimated_cost).toBe(500000);
    expect(remote.linked_goal_id).toBe('goal_fi');
    expect(remote.linked_savings_goal_id).toBe('svg_investments');
    expect(remote.why_it_matters).toBe(localItem.whyItMatters);
    expect(remote.status).toBe('in_progress');
    expect(remote.version).toBe(1);
    expect(remote.is_deleted).toBe(false);

    const roundtripLocal = toLocalVisionItem(remote);
    expect(roundtripLocal.id).toBe(localItem.id);
    expect(roundtripLocal.title).toBe(localItem.title);
    expect(roundtripLocal.imageUrl).toBe(localItem.imageUrl);
    expect(roundtripLocal.horizon).toBe(localItem.horizon);
    expect(roundtripLocal.category).toBe(localItem.category);
    expect(roundtripLocal.targetDate).toBe(localItem.targetDate);
    expect(roundtripLocal.estimatedCost).toBe(localItem.estimatedCost);
    expect(roundtripLocal.linkedGoalId).toBe(localItem.linkedGoalId);
    expect(roundtripLocal.linkedSavingsGoalId).toBe(localItem.linkedSavingsGoalId);
    expect(roundtripLocal.whyItMatters).toBe(localItem.whyItMatters);
    expect(roundtripLocal.status).toBe(localItem.status);
    expect(roundtripLocal.order).toBe(localItem.order);
    expect(roundtripLocal.createdAt).toBe(localItem.createdAt);
    expect(roundtripLocal.updatedAt).toBe(localItem.updatedAt);
  });

  it('validates a monthly roadmap item and handles invalid mascot or status', () => {
    expect(RoadmapMascotSchema.safeParse('rocket').success).toBe(true);
    expect(RoadmapMascotSchema.safeParse('invalid_mascot').success).toBe(false);
    expect(RoadmapStatusSchema.safeParse('in_progress').success).toBe(true);
    expect(RoadmapStatusSchema.safeParse('unknown').success).toBe(false);

    const validRoadmap: MonthlyRoadmapItem = {
      id: 'rm_2026_01',
      year: 2026,
      month: 1,
      theme: 'Habit Reboot',
      primaryGoal: 'Morning routine locked in',
      strategy: '6am wake-up, 90m deep work block',
      mascot: 'rocket',
      status: 'completed',
      completedAt: '2026-01-31T23:59:59.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-31T23:59:59.000Z',
    };
    expect(MonthlyRoadmapItemSchema.safeParse(validRoadmap).success).toBe(true);

    const invalidMascot = { ...validRoadmap, mascot: 'dragon' };
    expect(MonthlyRoadmapItemSchema.safeParse(invalidMascot).success).toBe(false);

    const invalidMonth = { ...validRoadmap, month: 13 };
    expect(MonthlyRoadmapItemSchema.safeParse(invalidMonth).success).toBe(false);

    const emptyGoal = { ...validRoadmap, primaryGoal: '' };
    expect(MonthlyRoadmapItemSchema.safeParse(emptyGoal).success).toBe(false);
  });

  it('correctly maps monthly roadmap between local and remote representations', () => {
    const localRoadmap: MonthlyRoadmapItem = {
      id: 'rm_2026_10',
      year: 2026,
      month: 10,
      theme: 'System Polish & Launch',
      primaryGoal: 'Ship vision board & monthly roadmap modules with 0 regressions',
      strategy: 'Verify end-to-end with visual screenshots and test coverage',
      mascot: 'coder',
      status: 'in_progress',
      notes: 'October high velocity sprint',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z',
    };

    const userId = '11111111-2222-3333-4444-555555555555';
    const remote = toRemoteMonthlyRoadmap(localRoadmap, userId);

    expect(remote.id).toBe(localRoadmap.id);
    expect(remote.user_id).toBe(userId);
    expect(remote.year).toBe(2026);
    expect(remote.month).toBe(10);
    expect(remote.theme).toBe('System Polish & Launch');
    expect(remote.primary_goal).toBe(localRoadmap.primaryGoal);
    expect(remote.strategy).toBe(localRoadmap.strategy);
    expect(remote.mascot).toBe('coder');
    expect(remote.status).toBe('in_progress');
    expect(remote.notes).toBe(localRoadmap.notes);

    const roundtripLocal = toLocalMonthlyRoadmap(remote);
    expect(roundtripLocal.id).toBe(localRoadmap.id);
    expect(roundtripLocal.year).toBe(localRoadmap.year);
    expect(roundtripLocal.month).toBe(localRoadmap.month);
    expect(roundtripLocal.theme).toBe(localRoadmap.theme);
    expect(roundtripLocal.primaryGoal).toBe(localRoadmap.primaryGoal);
    expect(roundtripLocal.strategy).toBe(localRoadmap.strategy);
    expect(roundtripLocal.mascot).toBe(localRoadmap.mascot);
    expect(roundtripLocal.status).toBe(localRoadmap.status);
    expect(roundtripLocal.notes).toBe(localRoadmap.notes);
    expect(roundtripLocal.createdAt).toBe(localRoadmap.createdAt);
    expect(roundtripLocal.updatedAt).toBe(localRoadmap.updatedAt);
  });
});
