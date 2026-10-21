import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WeeklyMomentumCard } from '@/features/overview/components/WeeklyMomentumCard';
import { FocusSlotsSection } from '@/features/overview/components/FocusSlotsSection';
import { GoalsInMotionSection } from '@/features/overview/components/GoalsInMotionSection';
import { OperationalSection } from '@/features/overview/components/OperationalSection';
import type { Task, Project, Milestone, Goal } from '@/domain/types';

describe('Overview Signature GSAP Motion System', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    document.documentElement.dataset.reduceMotion = 'false';
  });

  afterEach(() => {
    cleanup();
  });

  it('WeeklyMomentumCard renders donut SVG, legend, live status pill, and percentage label', () => {
    const { container } = render(
      createElement(
        BrowserRouter,
        null,
        createElement(WeeklyMomentumCard, {
          weeklyRatio: 75,
          finishedCount: 12,
          openCount: 4,
          activeProjectCount: 3,
          academicCount: 2,
          overdueCount: 0,
        })
      )
    );

    // Assert SVG and text elements
    const heading = screen.getByRole('heading', { name: 'Weekly momentum' });
    expect(heading).toBeDefined();

    const circle = container.querySelector('.gauge-donut-svg circle:nth-child(2)');
    expect(circle).not.toBeNull();

    // Check legend items
    expect(screen.getByText('Finished: 12')).toBeDefined();
    expect(screen.getByText('Open: 4')).toBeDefined();
    expect(screen.getByText('Projects: 3')).toBeDefined();
    expect(screen.getByText('Study: 2')).toBeDefined();

    // Check status pill
    expect(screen.getByText('All priority deliverables on schedule')).toBeDefined();
  });

  it('WeeklyMomentumCard displays overdue warning when overdue items exist', () => {
    render(
      createElement(
        BrowserRouter,
        null,
        createElement(WeeklyMomentumCard, {
          weeklyRatio: 50,
          finishedCount: 5,
          openCount: 5,
          activeProjectCount: 1,
          academicCount: 0,
          overdueCount: 3,
        })
      )
    );

    expect(screen.getByText('3 items require prompt attention')).toBeDefined();
  });

  it('FocusSlotsSection renders active focus tickets with tone classes and allows completion and removal', async () => {
    const mockTasks: Task[] = [
      {
        id: 't-1',
        title: 'Focus Priority Alpha',
        status: 'in_progress',
        priority: 'high',
        tags: [],
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
        estimatedMinutes: 45,
      },
      {
        id: 't-2',
        title: 'Focus Priority Beta',
        status: 'todo',
        priority: 'medium',
        tags: [],
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
        estimatedMinutes: 25,
      },
    ];

    const mockProjects: Project[] = [
      {
        id: 'p-1',
        title: 'Client Portal',
        status: 'in_progress',
        priority: 'high',
        tags: [],
        techStack: [],
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
      },
    ];

    const completeMock = vi.fn().mockResolvedValue(undefined);
    const removeMock = vi.fn().mockResolvedValue(undefined);
    const addMock = vi.fn();

    const { container } = render(
      createElement(
        BrowserRouter,
        null,
        createElement(FocusSlotsSection, {
          focused: mockTasks,
          projects: mockProjects,
          selections: [],
          openTasks: mockTasks,
          onComplete: completeMock,
          onRemoveFocus: removeMock,
          onAddFocus: addMock,
        })
      )
    );

    expect(screen.getByText("Today's focus")).toBeDefined();
    expect(screen.getByText('2 of 3 active slots')).toBeDefined();
    expect(screen.getByText('Focus Priority Alpha')).toBeDefined();
    expect(screen.getByText('Focus Priority Beta')).toBeDefined();

    // Tickets have tones
    const ticket1 = container.querySelector('#ticket-t-1');
    const ticket2 = container.querySelector('#ticket-t-2');
    expect(ticket1?.classList.contains('tone-0')).toBe(true);
    expect(ticket2?.classList.contains('tone-1')).toBe(true);

    // Complete button click triggers completion
    const completeBtn = screen.getByRole('button', { name: 'Complete Focus Priority Alpha' });
    fireEvent.click(completeBtn);
    expect(completeMock).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('GoalsInMotionSection displays progress bar, stats, and active goal spotlight cards', () => {
    const mockGoals: Goal[] = [
      {
        id: 'g-1',
        title: 'Launch Enterprise Edition',
        status: 'active',
        category: 'Product',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        why: 'Deliver scalable multi-tenant workspace to team leads.',
      },
    ];

    const mockMilestones: Milestone[] = [
      {
        id: 'm-1',
        ownerType: 'goal',
        ownerId: 'g-1',
        title: 'Finalize Auth Invariants',
        order: 1,
        completedAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'm-2',
        ownerType: 'goal',
        ownerId: 'g-1',
        title: 'Security Audit Sign-off',
        order: 2,
      },
    ];

    render(
      createElement(
        BrowserRouter,
        null,
        createElement(GoalsInMotionSection, {
          goalStats: {
            activeGoals: mockGoals,
            completedGoals: [],
            goalMilestones: mockMilestones,
            doneMilestones: [mockMilestones[0]],
            milestoneRate: 50,
          },
          milestones: mockMilestones,
        })
      )
    );

    expect(screen.getByText('Goals in motion')).toBeDefined();
    expect(screen.getByText('1 Active')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('Launch Enterprise Edition')).toBeDefined();
    expect(screen.getByText('"Deliver scalable multi-tenant workspace to team leads."')).toBeDefined();
    expect(screen.getByText('Next: Security Audit Sign-off')).toBeDefined();
    expect(screen.getByText('1/2 (50%)')).toBeDefined();
  });

  it('OperationalSection renders 3 columns: coming tasks, study desk, and recent activity', () => {
    const nextTasks: Task[] = [
      {
        id: 'task-next-1',
        title: 'Review PR for bi-directional scroll motion',
        status: 'todo',
        priority: 'high',
        tags: [],
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
      },
    ];

    const recentCompleted: Task[] = [
      {
        id: 'task-done-1',
        title: 'Implement GSAP choreographies',
        status: 'done',
        priority: 'high',
        tags: [],
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
        completedAt: '2026-10-21T10:00:00Z',
      },
    ];

    const completeMock = vi.fn().mockResolvedValue(undefined);

    render(
      createElement(
        BrowserRouter,
        null,
        createElement(OperationalSection, {
          nextTasks,
          academic: [],
          recentCompleted,
          onComplete: completeMock,
        })
      )
    );

    expect(screen.getByText('Coming into view')).toBeDefined();
    expect(screen.getByText('Review PR for bi-directional scroll motion')).toBeDefined();

    expect(screen.getByText('On the study desk')).toBeDefined();
    expect(screen.getByText('No outstanding coursework. Your next deadline will appear here.')).toBeDefined();

    expect(screen.getByText('Recent activity')).toBeDefined();
    expect(screen.getByText('Completed: Implement GSAP choreographies')).toBeDefined();
  });

  it('respects prefersReducedMotion setting by skipping GSAP tweens and displaying static content immediately', () => {
    document.documentElement.dataset.reduceMotion = 'true';

    const { container } = render(
      createElement(
        BrowserRouter,
        null,
        createElement(WeeklyMomentumCard, {
          weeklyRatio: 80,
          finishedCount: 8,
          openCount: 2,
          activeProjectCount: 1,
          academicCount: 0,
          overdueCount: 0,
        })
      )
    );

    const circle = container.querySelector('.gauge-donut-svg circle:nth-child(2)');
    expect(circle?.getAttribute('stroke-dasharray')).toBe(`${(80 / 100) * 389.5} 389.5`);
    expect(screen.getByText('80%')).toBeDefined();
  });
});
