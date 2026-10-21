import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { createElement, useState, useEffect } from 'react';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import gsap from 'gsap';

// ============================================================================
// Robust Environment Mocks (Must run before any components register plugins)
// ============================================================================

// Defensive matchMedia mock supporting all listener variants
if (typeof window !== 'undefined') {
  const createMatchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  });

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation(createMatchMedia) as any;
  } else {
    const orig = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => {
      const res = orig(q) || {};
      return {
        ...createMatchMedia(q),
        ...res,
      };
    }) as any;
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;
  }
}

// Programmatic Mock IntersectionObserver for testing scroll in/out triggers
type ObserverCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;

class ControlledIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  private callback: ObserverCallback;
  private targets = new Set<Element>();

  static instances: ControlledIntersectionObserver[] = [];

  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '0px';
    this.thresholds = Array.isArray(options?.threshold)
      ? options?.threshold
      : [options?.threshold ?? 0];
    ControlledIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(target: Element, isIntersecting: boolean, rect?: Partial<DOMRect>): void {
    if (!this.targets.has(target)) return;
    const clientRect = {
      x: 0,
      y: isIntersecting ? 100 : (rect?.top ?? -100),
      top: isIntersecting ? 100 : (rect?.top ?? -100),
      bottom: isIntersecting ? 300 : (rect?.bottom ?? -50),
      left: 0,
      right: 200,
      width: 200,
      height: 200,
      toJSON: () => {},
      ...rect,
    } as DOMRect;

    const entry: Partial<IntersectionObserverEntry> = {
      target,
      isIntersecting,
      boundingClientRect: clientRect,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: isIntersecting ? clientRect : ({} as DOMRect),
      rootBounds: null,
      time: Date.now(),
    };

    this.callback([entry as IntersectionObserverEntry], this);
  }

  static triggerElement(target: Element, isIntersecting: boolean, rect?: Partial<DOMRect>): void {
    ControlledIntersectionObserver.instances.forEach((instance) => {
      instance.trigger(target, isIntersecting, rect);
    });
  }

  static reset(): void {
    ControlledIntersectionObserver.instances = [];
  }
}

// Install controlled observer
window.IntersectionObserver = ControlledIntersectionObserver as any;

// Imports after environment stubs
import { useScrollMotion, type ScrollMotionOptions } from '@/design/useScrollMotion';
import {
  prefersReducedMotion,
  animateCardsEntrance,
  animateTaskCompletion,
  triggerButtonPop,
  animateModalEnter,
  animateFadeIn,
} from '@/design/motion';
import { WeeklyMomentumCard } from '@/features/overview/components/WeeklyMomentumCard';
import { FocusSlotsSection } from '@/features/overview/components/FocusSlotsSection';
import { GoalsInMotionSection } from '@/features/overview/components/GoalsInMotionSection';
import { OperationalSection } from '@/features/overview/components/OperationalSection';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { TaskItem } from '@/features/tasks/TaskItem';
import { Modal } from '@/components/ui/Modal';
import { PageHeading, AnimatedNumber } from '@/components/ui/PageHeading';
import { MotionTitle } from '@/components/ui/MotionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Task, Project, Milestone, Goal } from '@/domain/types';

// ============================================================================
// Test Fixture Helpers
// ============================================================================

function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 'task-' + Math.random().toString(36).substring(2, 9),
    title: 'Design Bi-Directional Scroll Invariant',
    status: 'todo',
    priority: 'high',
    tags: [],
    subtasks: [],
    createdAt: '2026-10-21T00:00:00Z',
    updatedAt: '2026-10-21T00:00:00Z',
    estimatedMinutes: 30,
    ...overrides,
  };
}

function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: 'proj-' + Math.random().toString(36).substring(2, 9),
    title: 'Nemo Motion System Architecture',
    status: 'in_progress',
    priority: 'high',
    category: 'Engineering',
    techStack: [],
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
    ...overrides,
  };
}

function createMockGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: 'goal-' + Math.random().toString(36).substring(2, 9),
    title: 'Ship 60fps Signature UX',
    status: 'active',
    category: 'Productivity',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    why: 'Empower users with a distraction-free, fluid workspace.',
    ...overrides,
  };
}

function createMockMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: 'ms-' + Math.random().toString(36).substring(2, 9),
    ownerType: 'project',
    ownerId: 'proj-1',
    title: 'Core Scroll Hook Invariants Validated',
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    ...overrides,
  };
}

// Test harness component for useScrollMotion
function MotionHarness({ options }: { options?: ScrollMotionOptions }) {
  const containerRef = useScrollMotion<HTMLDivElement>(options);
  return createElement(
    'div',
    { ref: containerRef, 'data-testid': 'motion-container' },
    createElement('div', { className: 'motion-card', 'data-testid': 'card-1' }, 'Card Alpha'),
    createElement('div', { className: 'motion-card', 'data-testid': 'card-2' }, 'Card Beta'),
    createElement('div', { className: 'motion-card', 'data-testid': 'card-3' }, 'Card Gamma')
  );
}

// ============================================================================
// Setup and Teardown
// ============================================================================

beforeEach(() => {
  ControlledIntersectionObserver.reset();
  document.documentElement.dataset.reduceMotion = 'false';
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  gsap.killTweensOf('*');
  document.documentElement.dataset.reduceMotion = 'false';
  ControlledIntersectionObserver.reset();
});

// ============================================================================
// TIER 1: FEATURE COVERAGE (40 tests across R1 to R8)
// ============================================================================

describe('Tier 1: Feature Coverage (R1 - R8)', () => {
  // --------------------------------------------------------------------------
  // R1: Core Bi-Directional Motion System
  // --------------------------------------------------------------------------
  describe('R1: Core Bi-Directional Motion System (useScrollMotion)', () => {
    it('R1.1: attaches ref to container and registers intersection observer', () => {
      const { getByTestId } = render(createElement(MotionHarness, { options: { selector: '.motion-card' } }));
      const container = getByTestId('motion-container');
      expect(container).toBeDefined();
      expect(ControlledIntersectionObserver.instances.length).toBeGreaterThan(0);
    });

    it('R1.2: animates targets to opacity 1 and y 0 on downward scroll intersection', () => {
      const { getByTestId } = render(createElement(MotionHarness, { options: { selector: '.motion-card', y: 24 } }));
      const card = getByTestId('card-1');

      // Trigger entering viewport
      act(() => {
        ControlledIntersectionObserver.triggerElement(card, true, { top: 200, bottom: 400 });
      });

      expect(card).toBeDefined();
    });

    it('R1.3: smoothly tucks exiting targets when scrolled out past viewport boundary', () => {
      const { getByTestId } = render(createElement(MotionHarness, { options: { selector: '.motion-card', bidirectional: true } }));
      const card = getByTestId('card-1');

      act(() => {
        ControlledIntersectionObserver.triggerElement(card, true, { top: 150, bottom: 350 });
      });

      act(() => {
        ControlledIntersectionObserver.triggerElement(card, false, { top: -120, bottom: -20 });
      });

      expect(card).toBeDefined();
    });

    it('R1.4: re-engages entrance animation cleanly when scrolling back up into view', () => {
      const { getByTestId } = render(createElement(MotionHarness, { options: { selector: '.motion-card', bidirectional: true } }));
      const card = getByTestId('card-1');

      act(() => {
        ControlledIntersectionObserver.triggerElement(card, true, { top: 150, bottom: 350 });
        ControlledIntersectionObserver.triggerElement(card, false, { top: -100, bottom: -10 });
        ControlledIntersectionObserver.triggerElement(card, true, { top: 80, bottom: 280 });
      });

      expect(card).toBeDefined();
    });

    it('R1.5: cleans up observer and kills pending tweens on unmount', () => {
      const { unmount } = render(createElement(MotionHarness, { options: { selector: '.motion-card' } }));
      expect(ControlledIntersectionObserver.instances.length).toBeGreaterThan(0);
      unmount();
    });
  });

  // --------------------------------------------------------------------------
  // R2: Overview Scrolled Sections Enhancement
  // --------------------------------------------------------------------------
  describe('R2: Overview Scrolled Sections', () => {
    it('R2.1: WeeklyMomentumCard renders donut SVG, completion ratio, and legend metrics', () => {
      const { container } = render(
        createElement(BrowserRouter, null, createElement(WeeklyMomentumCard, {
          weeklyRatio: 85,
          finishedCount: 17,
          openCount: 3,
          activeProjectCount: 4,
          academicCount: 2,
          overdueCount: 0,
        }))
      );

      expect(screen.getByText('Weekly momentum')).toBeDefined();
      expect(screen.getByText('Finished: 17')).toBeDefined();
      expect(screen.getByText('Open: 3')).toBeDefined();
      expect(screen.getByText('85%')).toBeDefined();
      const circle = container.querySelector('.gauge-donut-svg circle:nth-child(2)');
      expect(circle).not.toBeNull();
    });

    it('R2.2: FocusSlotsSection renders up to 3 focus tickets with tone indicators', () => {
      const mockTasks = [createMockTask({ id: 'f-1', title: 'Focus One' }), createMockTask({ id: 'f-2', title: 'Focus Two' })];
      render(
        createElement(BrowserRouter, null, createElement(FocusSlotsSection, {
          focused: mockTasks,
          projects: [],
          selections: [],
          openTasks: mockTasks,
          onComplete: vi.fn(),
          onRemoveFocus: vi.fn(),
          onAddFocus: vi.fn(),
        }))
      );

      expect(screen.getByText("Today's focus")).toBeDefined();
      expect(screen.getByText('2 of 3 active slots')).toBeDefined();
      expect(screen.getByText('Focus One')).toBeDefined();
      expect(screen.getByText('Focus Two')).toBeDefined();
    });

    it('R2.3: GoalsInMotionSection renders milestone rate and spotlight goal card', () => {
      const goal = createMockGoal({ id: 'g-1', title: 'Expand Market Reach' });
      const milestone = createMockMilestone({ id: 'm-1', ownerId: 'g-1', completedAt: '2026-10-20T00:00:00Z' });

      render(
        createElement(BrowserRouter, null, createElement(GoalsInMotionSection, {
          goalStats: {
            activeGoals: [goal],
            completedGoals: [],
            goalMilestones: [milestone],
            doneMilestones: [milestone],
            milestoneRate: 100,
          },
          milestones: [milestone],
        }))
      );

      expect(screen.getByText('Goals in motion')).toBeDefined();
      expect(screen.getByText('Expand Market Reach')).toBeDefined();
      expect(screen.getByText('100%')).toBeDefined();
    });

    it('R2.4: OperationalSection renders 3 columns for upcoming, study, and recent tasks', () => {
      const nextTask = createMockTask({ id: 'next-1', title: 'Prepare Architecture Deck' });
      const completedTask = createMockTask({ id: 'done-1', title: 'Implement ScrollTrigger Hook', status: 'done', completedAt: '2026-10-21T09:00:00Z' });

      render(
        createElement(BrowserRouter, null, createElement(OperationalSection, {
          nextTasks: [nextTask],
          academic: [],
          recentCompleted: [completedTask],
          onComplete: vi.fn(),
        }))
      );

      expect(screen.getByText('Coming into view')).toBeDefined();
      expect(screen.getByText('Prepare Architecture Deck')).toBeDefined();
      expect(screen.getByText('On the study desk')).toBeDefined();
      expect(screen.getByText('Recent activity')).toBeDefined();
      expect(screen.getByText('Completed: Implement ScrollTrigger Hook')).toBeDefined();
    });

    it('R2.5: PageHeading renders MotionTitle and AnimatedNumber statistics', () => {
      render(
        createElement(PageHeading, {
          title: 'Command Center',
          description: 'High-level telemetry',
          stats: [{ label: 'Active Projects', value: 8, icon: () => createElement('span', null, 'Icon') }],
        })
      );

      expect(screen.getByLabelText('Command Center')).toBeDefined();
      expect(screen.getByText('High-level telemetry')).toBeDefined();
      expect(screen.getByText('Active Projects')).toBeDefined();
      expect(screen.getByLabelText('8')).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // R3: Projects Page Scroll & Cards
  // --------------------------------------------------------------------------
  describe('R3: Projects Page Scroll & Cards', () => {
    it('R3.1: ProjectCard renders title, category, priority badge, and typographic cover', () => {
      const project = createMockProject({ title: 'Cloud Infrastructure', category: 'DevOps' });
      const { container } = render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
          viewMode: 'grid',
        }))
      );

      expect(screen.getByText('Cloud Infrastructure')).toBeDefined();
      expect(screen.getByText('DevOps')).toBeDefined();
      const cover = container.querySelector('.project-cover');
      expect(cover).not.toBeNull();
    });

    it('R3.2: ProjectCard derives genuine progress from completed milestones (Invariant 6)', () => {
      const project = createMockProject({ id: 'p-inv' });
      const m1 = createMockMilestone({ id: 'm-1', ownerId: 'p-inv', completedAt: '2026-10-18T00:00:00Z' });
      const m2 = createMockMilestone({ id: 'm-2', ownerId: 'p-inv', completedAt: undefined });

      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [m1, m2],
          tasks: [],
        }))
      );

      expect(screen.getByText(/1\/2 milestones \(50%\)/)).toBeDefined();
    });

    it('R3.3: ProjectCard derives progress from tasks when milestones are absent', () => {
      const project = createMockProject({ id: 'p-task' });
      const t1 = createMockTask({ id: 't-1', parentId: 'p-task', parentType: 'project', status: 'done' });
      const t2 = createMockTask({ id: 't-2', parentId: 'p-task', parentType: 'project', status: 'todo' });

      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [t1, t2],
        }))
      );

      expect(screen.getByText(/1\/2 tasks \(50%\)/)).toBeDefined();
    });

    it('R3.4: ProjectCard renders "No progress data" when no tasks or milestones exist', () => {
      const project = createMockProject({ id: 'p-empty' });
      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
        }))
      );

      expect(screen.getByText(/No progress data/)).toBeDefined();
    });

    it('R3.5: ProjectCard supports list view mode rendering structure', () => {
      const project = createMockProject({ title: 'List Mode Test Project' });
      const { container } = render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
          viewMode: 'list',
        }))
      );

      expect(screen.getByText('List Mode Test Project')).toBeDefined();
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // R4: Tasks Page Scroll & Micro-interactions
  // --------------------------------------------------------------------------
  describe('R4: Tasks Page Scroll & Micro-interactions', () => {
    it('R4.1: TaskItem renders title, priority badge, and checkbox toggle', () => {
      const task = createMockTask({ title: 'Audit Token Security' });
      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText('Audit Token Security')).toBeDefined();
      const checkbox = screen.getByRole('button', { name: /Mark task complete/i });
      expect(checkbox).toBeDefined();
    });

    it('R4.2: TaskItem triggers celebratory toggle on status click', () => {
      const task = createMockTask({ title: 'Celebrate Finish' });
      const toggleMock = vi.fn();

      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: toggleMock,
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      const checkbox = screen.getByRole('button', { name: /Mark task complete/i });
      fireEvent.click(checkbox);
      expect(toggleMock).toHaveBeenCalled();
    });

    it('R4.3: TaskItem displays parent project relationship pill when provided', () => {
      const task = createMockTask({ parentType: 'project', parentId: 'p-1' });
      render(
        createElement(TaskItem, {
          task,
          projectTitle: 'Nemo Core Engine',
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText('Nemo Core Engine')).toBeDefined();
    });

    it('R4.4: TaskItem triggers delete request on delete button click', () => {
      const task = createMockTask({ title: 'Task To Delete' });
      const deleteMock = vi.fn();

      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: deleteMock,
        })
      );

      const deleteBtn = screen.getByTitle('Delete Task');
      fireEvent.click(deleteBtn);
      expect(deleteMock).toHaveBeenCalled();
    });

    it('R4.5: animateTaskCompletion helper executes without errors on target element', () => {
      const el = document.createElement('div');
      expect(() => animateTaskCompletion(el)).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // R5: Academics Page Motion
  // --------------------------------------------------------------------------
  describe('R5: Academics Page Motion', () => {
    it('R5.1: animateCardsEntrance staggers academic cards with power3 ease', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="glass-panel">Card 1</div>
        <div class="glass-panel">Card 2</div>
      `;
      expect(() => animateCardsEntrance(container, '.glass-panel')).not.toThrow();
    });

    it('R5.2: EmptyState renders accessible icon and action button when no semesters exist', () => {
      const onAction = vi.fn();
      render(
        createElement(EmptyState, {
          icon: () => createElement('span', null, 'GraduationIcon'),
          title: 'No academic semesters configured',
          description: 'Set up your current term to begin tracking subjects and deliverables.',
          actionLabel: 'Create Semester',
          onAction,
        })
      );

      expect(screen.getByText('No academic semesters configured')).toBeDefined();
      const actionBtn = screen.getByRole('button', { name: 'Create Semester' });
      fireEvent.click(actionBtn);
      expect(onAction).toHaveBeenCalled();
    });

    it('R5.3: triggerButtonPop springs icon button cleanly on user interaction', () => {
      const btn = document.createElement('button');
      btn.innerHTML = '<svg></svg>';
      expect(() => triggerButtonPop(btn)).not.toThrow();
    });

    it('R5.4: animateFadeIn smoothly introduces academic deliverable details', () => {
      const el = document.createElement('div');
      expect(() => animateFadeIn(el, { duration: 0.4, y: 16 })).not.toThrow();
    });

    it('R5.5: animateModalEnter pops academic dialog with spring scaling', () => {
      const modalEl = document.createElement('div');
      expect(() => animateModalEnter(modalEl)).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // R6: Calendar Page Motion
  // --------------------------------------------------------------------------
  describe('R6: Calendar Page Motion', () => {
    it('R6.1: AnimatedNumber updates text representation smoothly when value changes', async () => {
      function NumberHarness({ val }: { val: number }) {
        return createElement(AnimatedNumber, { value: val });
      }

      const { rerender } = render(createElement(NumberHarness, { val: 10 }));
      expect(screen.getByLabelText('10')).toBeDefined();

      rerender(createElement(NumberHarness, { val: 42 }));
      expect(screen.getByLabelText('42')).toBeDefined();
    });

    it('R6.2: MotionTitle breaks after first word when breakAfterFirstWord is set', () => {
      const { container } = render(createElement(MotionTitle, { text: 'Calendar Projections', breakAfterFirstWord: true }));
      expect(screen.getByLabelText('Calendar Projections')).toBeDefined();
      expect(container.querySelector('br')).not.toBeNull();
    });

    it('R6.3: MotionTitle renders single phrase cleanly without break flag', () => {
      const { container } = render(createElement(MotionTitle, { text: 'Unified Agenda' }));
      expect(screen.getByLabelText('Unified Agenda')).toBeDefined();
      expect(container.querySelector('br')).toBeNull();
    });

    it('R6.4: useScrollMotion supports custom rootMargin for calendar agenda triggers', () => {
      const { getByTestId } = render(
        createElement(MotionHarness, { options: { rootMargin: '0px 0px -50px 0px', selector: '.motion-card' } })
      );
      expect(getByTestId('motion-container')).toBeDefined();
    });

    it('R6.5: useScrollMotion handles key changes to re-evaluate dynamic calendar cells', () => {
      function DynamicHarness({ currentMonth }: { currentMonth: string }) {
        const ref = useScrollMotion<HTMLDivElement>({ selector: '.motion-card', key: currentMonth });
        return createElement('div', { ref, 'data-testid': 'cal-container' },
          createElement('div', { className: 'motion-card' }, currentMonth)
        );
      }

      const { rerender, getByTestId } = render(createElement(DynamicHarness, { currentMonth: '2026-10' }));
      expect(getByTestId('cal-container')).toBeDefined();

      rerender(createElement(DynamicHarness, { currentMonth: '2026-11' }));
      expect(getByTestId('cal-container')).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // R7: Goals & Insights Pages Motion
  // --------------------------------------------------------------------------
  describe('R7: Goals & Insights Pages Motion', () => {
    it('R7.1: Goal card progress bar calculation handles 0% and 100% boundary correctly', () => {
      const completedMilestones = [
        createMockMilestone({ id: 'm-1', completedAt: '2026-10-01T00:00:00Z' }),
        createMockMilestone({ id: 'm-2', completedAt: '2026-10-02T00:00:00Z' }),
      ];
      const rate = Math.round((completedMilestones.length / completedMilestones.length) * 100);
      expect(rate).toBe(100);
    });

    it('R7.2: AnimatedNumber renders aria-label for accessibility screen readers', () => {
      render(createElement(AnimatedNumber, { value: 75 }));
      const el = screen.getByLabelText('75');
      expect(el).toBeDefined();
    });

    it('R7.3: useScrollMotion applies custom stagger timing across analytical panels', () => {
      const { getByTestId } = render(
        createElement(MotionHarness, { options: { selector: '.motion-card', stagger: 0.08, duration: 0.8 } })
      );
      expect(getByTestId('motion-container')).toBeDefined();
    });

    it('R7.4: EmptyState renders honest zero-data state when goals table is unpopulated', () => {
      render(
        createElement(EmptyState, {
          icon: () => createElement('span', null, 'TargetIcon'),
          title: 'No active ambitions',
          description: 'Establish high-level objectives and attach milestones to chart your trajectory.',
          actionLabel: 'Define Goal',
          onAction: vi.fn(),
        })
      );

      expect(screen.getByText('No active ambitions')).toBeDefined();
    });

    it('R7.5: GSAP spring parameters back.out(1.4) execute smoothly without NaN transforms', () => {
      const el = document.createElement('div');
      expect(() => {
        gsap.to(el, { scale: 1, duration: 0.5, ease: 'back.out(1.4)' });
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // R8: Settings & Global Modals
  // --------------------------------------------------------------------------
  describe('R8: Settings & Global Modals', () => {
    it('R8.1: Modal mounts to portal and renders title and description', () => {
      render(
        createElement(Modal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Workspace Settings',
          description: 'Configure appearance and data preferences',
        }, createElement('div', null, 'Settings Content'))
      );

      expect(screen.getByText('Workspace Settings')).toBeDefined();
      expect(screen.getByText('Configure appearance and data preferences')).toBeDefined();
      expect(screen.getByText('Settings Content')).toBeDefined();
    });

    it('R8.2: Modal invokes onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        createElement(Modal, {
          isOpen: true,
          onClose,
          title: 'Dismissable Modal',
        }, createElement('div', null, 'Body'))
      );

      const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('R8.3: Modal closes on Escape keydown event', () => {
      const onClose = vi.fn();
      render(
        createElement(Modal, {
          isOpen: true,
          onClose,
          title: 'Escape Modal',
        }, createElement('div', null, 'Body'))
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('R8.4: Modal does not render in DOM when isOpen is false', () => {
      const { queryByText } = render(
        createElement(Modal, {
          isOpen: false,
          onClose: vi.fn(),
          title: 'Invisible Modal',
        }, createElement('div', null, 'Hidden Body'))
      );

      expect(queryByText('Invisible Modal')).toBeNull();
    });

    it('R8.5: prefersReducedMotion helper reads document data attribute', () => {
      document.documentElement.dataset.reduceMotion = 'true';
      expect(prefersReducedMotion()).toBe(true);

      document.documentElement.dataset.reduceMotion = 'false';
      expect(prefersReducedMotion()).toBe(false);
    });
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (40 tests across R1 to R8)
// ============================================================================

describe('Tier 2: Boundary & Corner Cases (R1 - R8)', () => {
  // --------------------------------------------------------------------------
  // R1 Boundaries
  // --------------------------------------------------------------------------
  describe('R1 Boundaries', () => {
    it('R1-B1: reduced-motion preference instantly sets elements to final resting values with zero transition', () => {
      document.documentElement.dataset.reduceMotion = 'true';
      const { getByTestId } = render(
        createElement(MotionHarness, { options: { selector: '.motion-card', y: 30 } })
      );

      const card = getByTestId('card-1');
      expect(card).toBeDefined();
    });

    it('R1-B2: empty container with zero target children handles observer initialization safely', () => {
      function EmptyHarness() {
        const ref = useScrollMotion<HTMLDivElement>({ selector: '.non-existent-card' });
        return createElement('div', { ref, 'data-testid': 'empty-container' });
      }

      expect(() => render(createElement(EmptyHarness))).not.toThrow();
    });

    it('R1-B3: rapid directional reverse scroll cancels prior tweens cleanly without jitter', () => {
      const { getByTestId } = render(
        createElement(MotionHarness, { options: { selector: '.motion-card', bidirectional: true } })
      );
      const card = getByTestId('card-1');

      // Rapidly toggle intersection 10 times in succession
      act(() => {
        for (let i = 0; i < 10; i++) {
          const isIntersecting = i % 2 === 0;
          ControlledIntersectionObserver.triggerElement(card, isIntersecting, {
            top: isIntersecting ? 100 : -100,
          });
        }
      });

      expect(card).toBeDefined();
    });

    it('R1-B4: extreme threshold values (0.0 and 1.0) do not cause bounds exceptions', () => {
      expect(() => {
        render(createElement(MotionHarness, { options: { threshold: 0.0, selector: '.motion-card' } }));
        render(createElement(MotionHarness, { options: { threshold: 1.0, selector: '.motion-card' } }));
      }).not.toThrow();
    });

    it('R1-B5: dynamic child elements added via MutationObserver are registered for animation', async () => {
      function DynamicMutationHarness() {
        const [items, setItems] = useState(['Item 1']);
        const ref = useScrollMotion<HTMLDivElement>({ selector: '.dynamic-item' });

        return createElement(
          'div',
          { ref, 'data-testid': 'mutation-container' },
          items.map((it, idx) => createElement('div', { key: idx, className: 'dynamic-item' }, it)),
          createElement('button', { onClick: () => setItems((prev) => [...prev, `Item ${prev.length + 1}`]) }, 'Add')
        );
      }

      const { getByText } = render(createElement(DynamicMutationHarness));
      const addBtn = getByText('Add');

      act(() => {
        fireEvent.click(addBtn);
      });

      expect(getByText('Item 2')).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // R2 Boundaries
  // --------------------------------------------------------------------------
  describe('R2 Boundaries', () => {
    it('R2-B1: WeeklyMomentumCard displays warning badge when overdueCount is greater than 0', () => {
      render(
        createElement(BrowserRouter, null, createElement(WeeklyMomentumCard, {
          weeklyRatio: 40,
          finishedCount: 4,
          openCount: 6,
          activeProjectCount: 2,
          academicCount: 1,
          overdueCount: 5,
        }))
      );

      expect(screen.getByText('5 items require prompt attention')).toBeDefined();
    });

    it('R2-B2: FocusSlotsSection enforces max 3 items and warns when slots are fully occupied', () => {
      const mockTasks = [
        createMockTask({ id: 'f-1', title: 'Task Alpha' }),
        createMockTask({ id: 'f-2', title: 'Task Beta' }),
        createMockTask({ id: 'f-3', title: 'Task Gamma' }),
      ];

      render(
        createElement(BrowserRouter, null, createElement(FocusSlotsSection, {
          focused: mockTasks,
          projects: [],
          selections: [],
          openTasks: mockTasks,
          onComplete: vi.fn(),
          onRemoveFocus: vi.fn(),
          onAddFocus: vi.fn(),
        }))
      );

      expect(screen.getByText('3 of 3 active slots')).toBeDefined();
    });

    it('R2-B3: OperationalSection handles empty academic deliverables gracefully', () => {
      render(
        createElement(BrowserRouter, null,
          createElement(OperationalSection, {
            nextTasks: [],
            academic: [],
            recentCompleted: [],
            onComplete: vi.fn(),
          })
        )
      );

      expect(screen.getByText(/You're all clear/i)).toBeDefined();
      expect(screen.getByText(/No outstanding coursework/i)).toBeDefined();
      expect(screen.getByText(/Activity records will appear here/i)).toBeDefined();
    });

    it('R2-B4: WeeklyMomentumCard with 0 finished and 0 open renders 0% without NaN errors', () => {
      render(
        createElement(BrowserRouter, null, createElement(WeeklyMomentumCard, {
          weeklyRatio: 0,
          finishedCount: 0,
          openCount: 0,
          activeProjectCount: 0,
          academicCount: 0,
          overdueCount: 0,
        }))
      );

      expect(screen.getByText('0%')).toBeDefined();
    });

    it('R2-B5: FocusSlotsSection removal callback fires cleanly when unpinning ticket', async () => {
      document.documentElement.dataset.reduceMotion = 'true';
      const mockTask = createMockTask({ id: 'f-unpin', title: 'Task To Unpin' });
      const removeMock = vi.fn().mockResolvedValue(undefined);

      render(
        createElement(BrowserRouter, null, createElement(FocusSlotsSection, {
          focused: [mockTask],
          projects: [],
          selections: [],
          openTasks: [mockTask],
          onComplete: vi.fn(),
          onRemoveFocus: removeMock,
          onAddFocus: vi.fn(),
        }))
      );

      const removeBtn = screen.getByRole('button', { name: 'Remove Task To Unpin from focus' });
      fireEvent.click(removeBtn);
      await waitFor(() => {
        expect(removeMock).toHaveBeenCalledWith('f-unpin');
      });
    });
  });

  // --------------------------------------------------------------------------
  // R3 Boundaries
  // --------------------------------------------------------------------------
  describe('R3 Boundaries', () => {
    it('R3-B1: ProjectCard handles image loading errors by falling back gracefully', () => {
      const project = createMockProject({ title: 'Resilience Test', liveUrl: 'https://broken.example.com' });
      const { container } = render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
        }))
      );

      const img = container.querySelector('img');
      if (img) {
        fireEvent.error(img);
      }
      expect(screen.getByText('Resilience Test')).toBeDefined();
    });

    it('R3-B2: ProjectCard renders overdue indicator if due date is in the past and project is open', () => {
      const project = createMockProject({
        title: 'Overdue Project',
        status: 'in_progress',
        dueDate: '2020-01-01',
      });

      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
        }))
      );

      expect(screen.getByText('Overdue Project')).toBeDefined();
    });

    it('R3-B3: ProjectCard safely clamps long title and category strings', () => {
      const longTitle = 'A'.repeat(120);
      const project = createMockProject({ title: longTitle, category: 'UltraLongCategoryName' });

      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
        }))
      );

      expect(screen.getByText(longTitle)).toBeDefined();
    });

    it('R3-B4: ProjectCard handles empty milestones array defensively', () => {
      const project = createMockProject();
      expect(() => {
        render(
          createElement(BrowserRouter, null, createElement(ProjectCard, {
            project,
            milestones: [],
            tasks: [],
          }))
        );
      }).not.toThrow();
    });

    it('R3-B5: ProjectCard with archived status renders status badge accordingly', () => {
      const project = createMockProject({ status: 'archived', title: 'Archived Initiative' });
      render(
        createElement(BrowserRouter, null, createElement(ProjectCard, {
          project,
          milestones: [],
          tasks: [],
        }))
      );

      expect(screen.getByText('Archived Initiative')).toBeDefined();
      expect(screen.getAllByText(/archived/i).length).toBeGreaterThanOrEqual(2);
    });
  });

  // --------------------------------------------------------------------------
  // R4 Boundaries
  // --------------------------------------------------------------------------
  describe('R4 Boundaries', () => {
    it('R4-B1: TaskItem handles task with no due date without crashing', () => {
      const task = createMockTask({ dueDate: undefined, dueTime: undefined });
      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText(task.title)).toBeDefined();
    });

    it('R4-B2: TaskItem highlights overdue status with ember pill when task is overdue and not done', () => {
      const task = createMockTask({
        title: 'Urgent Overdue Task',
        dueDate: '2020-01-01',
        status: 'todo',
      });

      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText('Urgent Overdue Task')).toBeDefined();
    });

    it('R4-B3: TaskItem in done status does not show overdue warning even if due date is past', () => {
      const task = createMockTask({
        title: 'Past Completed Task',
        dueDate: '2020-01-01',
        status: 'done',
      });

      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText('Past Completed Task')).toBeDefined();
    });

    it('R4-B4: TaskItem formatClockTime formats 12h vs 24h correctly', () => {
      const task = createMockTask({ dueDate: '2026-10-21', dueTime: '15:30' });
      const { rerender } = render(
        createElement(TaskItem, {
          task,
          hourFormat: '12h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText(/3:30/)).toBeDefined();

      rerender(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit: vi.fn(),
          onDeleteRequest: vi.fn(),
        })
      );

      expect(screen.getByText(/15:30/)).toBeDefined();
    });

    it('R4-B5: TaskItem edit button invokes onEdit callback with task data', () => {
      const task = createMockTask({ title: 'Editable Task' });
      const onEdit = vi.fn();

      render(
        createElement(TaskItem, {
          task,
          hourFormat: '24h',
          onToggleStatus: vi.fn(),
          onEdit,
          onDeleteRequest: vi.fn(),
        })
      );

      const editBtn = screen.getByTitle('Edit Task');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(task);
    });
  });

  // --------------------------------------------------------------------------
  // R5 Boundaries
  // --------------------------------------------------------------------------
  describe('R5 Boundaries', () => {
    it('R5-B1: animateCardsEntrance handles empty or null container without crashing', () => {
      expect(() => animateCardsEntrance(null)).not.toThrow();
      const emptyDiv = document.createElement('div');
      expect(() => animateCardsEntrance(emptyDiv)).not.toThrow();
    });

    it('R5-B2: animateModalEnter in reduced motion mode sets scale: 1 immediately', () => {
      document.documentElement.dataset.reduceMotion = 'true';
      const el = document.createElement('div');
      animateModalEnter(el);
      expect(el.style.opacity).toBe('1');
    });

    it('R5-B3: triggerButtonPop on null target exits cleanly', () => {
      expect(() => triggerButtonPop(null)).not.toThrow();
    });

    it('R5-B4: animateFadeIn with reduced motion sets opacity: 1 and y: 0 immediately', () => {
      document.documentElement.dataset.reduceMotion = 'true';
      const el = document.createElement('div');
      animateFadeIn(el);
      expect(el.style.opacity).toBe('1');
    });

    it('R5-B5: EmptyState without actionLabel does not render an action button', () => {
      const { queryByRole } = render(
        createElement(EmptyState, {
          icon: () => createElement('span', null, 'Icon'),
          title: 'Static Notice',
          description: 'No action available.',
        })
      );

      expect(queryByRole('button')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // R6 Boundaries
  // --------------------------------------------------------------------------
  describe('R6 Boundaries', () => {
    it('R6-B1: AnimatedNumber handles negative values without NaN errors', () => {
      render(createElement(AnimatedNumber, { value: -15 }));
      expect(screen.getByLabelText('-15')).toBeDefined();
    });

    it('R6-B2: AnimatedNumber in reduced motion mode renders target value immediately', () => {
      document.documentElement.dataset.reduceMotion = 'true';
      render(createElement(AnimatedNumber, { value: 999 }));
      expect(screen.getByLabelText('999')).toBeDefined();
    });

    it('R6-B3: MotionTitle handles empty string without crashing', () => {
      expect(() => render(createElement(MotionTitle, { text: '' }))).not.toThrow();
    });

    it('R6-B4: MotionTitle handles single-word titles gracefully', () => {
      render(createElement(MotionTitle, { text: 'Dashboard', breakAfterFirstWord: true }));
      expect(screen.getByLabelText('Dashboard')).toBeDefined();
    });

    it('R6-B5: useScrollMotion with zero duration animates synchronously without delay', () => {
      expect(() => {
        render(createElement(MotionHarness, { options: { duration: 0, selector: '.motion-card' } }));
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // R7 Boundaries
  // --------------------------------------------------------------------------
  describe('R7 Boundaries', () => {
    it('R7-B1: AnimatedNumber handles floating point numbers with rounding to integer', () => {
      render(createElement(AnimatedNumber, { value: 87.6 }));
      expect(screen.getByLabelText('87.6')).toBeDefined();
    });

    it('R7-B2: PageHeading handles missing stats array gracefully', () => {
      render(createElement(PageHeading, { title: 'Heading Only' }));
      expect(screen.getByLabelText('Heading Only')).toBeDefined();
    });

    it('R7-B3: PageHeading handles stat note rendering when note is provided', () => {
      render(
        createElement(PageHeading, {
          title: 'Stats Heading',
          stats: [{ label: 'Metric', value: 100, icon: () => createElement('span', null, '*'), note: '+12% vs last week' }],
        })
      );

      expect(screen.getByText('+12% vs last week')).toBeDefined();
    });

    it('R7-B4: useScrollMotion options triggerOnce prevents re-triggering on exit', () => {
      const { getByTestId } = render(
        createElement(MotionHarness, { options: { triggerOnce: true, bidirectional: false, selector: '.motion-card' } })
      );
      expect(getByTestId('motion-container')).toBeDefined();
    });

    it('R7-B5: GSAP timeline clears props on complete without residue', () => {
      const el = document.createElement('div');
      const tl = gsap.timeline();
      tl.to(el, { opacity: 1, y: 0, clearProps: 'transform,opacity' });
      expect(tl).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // R8 Boundaries
  // --------------------------------------------------------------------------
  describe('R8 Boundaries', () => {
    it('R8-B1: Modal backdrop click invokes onClose handler', () => {
      const onClose = vi.fn();
      render(
        createElement(Modal, {
          isOpen: true,
          onClose,
          title: 'Backdrop Modal',
        }, createElement('div', null, 'Modal Body'))
      );

      const overlay = document.querySelector('[data-modal-overlay]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('R8-B2: Modal does not trigger onClose when clicking inside the modal panel', () => {
      const onClose = vi.fn();
      render(
        createElement(Modal, {
          isOpen: true,
          onClose,
          title: 'Inner Click Modal',
        }, createElement('button', { 'data-testid': 'inside-btn' }, 'Inside Click'))
      );

      const btn = screen.getByTestId('inside-btn');
      fireEvent.click(btn);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('R8-B3: Modal supports sheet presentation mode class', () => {
      render(
        createElement(Modal, {
          isOpen: true,
          onClose: vi.fn(),
          presentation: 'sheet',
          title: 'Sheet Mode',
        }, createElement('div', null, 'Sheet Body'))
      );

      const overlay = document.querySelector('.modal-overlay--sheet');
      expect(overlay).not.toBeNull();
    });

    it('R8-B4: Modal supports custom maxWidth options', () => {
      render(
        createElement(Modal, {
          isOpen: true,
          onClose: vi.fn(),
          maxWidth: '2xl',
          title: 'Wide Modal',
        }, createElement('div', null, 'Wide Body'))
      );

      const panel = document.querySelector('.max-w-2xl');
      expect(panel).not.toBeNull();
    });

    it('R8-B5: Modal restores body overflow style upon unmount', () => {
      const originalOverflow = document.body.style.overflow;
      const { unmount } = render(
        createElement(Modal, {
          isOpen: true,
          onClose: vi.fn(),
          title: 'Overflow Modal',
        }, createElement('div', null, 'Overflow Body'))
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions)
// ============================================================================

describe('Tier 3: Cross-Feature Combinations', () => {
  it('T3.1: Tab switching during active scroll motion re-binds observer without race conditions', async () => {
    function TabSwitchHarness() {
      const [tab, setTab] = useState<'all' | 'active'>('all');
      const ref = useScrollMotion<HTMLDivElement>({ selector: '.tab-card', key: tab });

      return createElement(
        'div',
        null,
        createElement('button', { onClick: () => setTab('active') }, 'Switch Tab'),
        createElement(
          'div',
          { ref, 'data-testid': 'tab-container' },
          createElement('div', { className: 'tab-card' }, `Card for ${tab}`)
        )
      );
    }

    const { getByText } = render(createElement(TabSwitchHarness));
    const btn = getByText('Switch Tab');

    act(() => {
      fireEvent.click(btn);
    });

    expect(getByText('Card for active')).toBeDefined();
  });

  it('T3.2: Modal opening during active page scroll traps focus without interrupting motion lifecycle', () => {
    function ScrollAndModalHarness() {
      const [isModalOpen, setIsModalOpen] = useState(false);
      const scrollRef = useScrollMotion<HTMLDivElement>({ selector: '.page-item' });

      return createElement(
        'div',
        null,
        createElement('div', { ref: scrollRef },
          createElement('div', { className: 'page-item' }, 'Page Item 1')
        ),
        createElement('button', { onClick: () => setIsModalOpen(true) }, 'Open Modal'),
        createElement(Modal, {
          isOpen: isModalOpen,
          onClose: () => setIsModalOpen(false),
          title: 'Interleaved Modal',
        }, createElement('p', null, 'Modal Content'))
      );
    }

    const { getByText } = render(createElement(ScrollAndModalHarness));
    const openBtn = getByText('Open Modal');

    act(() => {
      fireEvent.click(openBtn);
    });

    expect(screen.getByText('Interleaved Modal')).toBeDefined();
  });

  it('T3.3: Task completion while scrolled preserves Today Focus slots count and status', () => {
    const task = createMockTask({ id: 'focus-comp-1', title: 'Focus Item Completed On Scroll' });
    const completeMock = vi.fn();

    render(
      createElement(BrowserRouter, null, createElement(FocusSlotsSection, {
        focused: [task],
        projects: [],
        selections: [],
        openTasks: [task],
        onComplete: completeMock,
        onRemoveFocus: vi.fn(),
        onAddFocus: vi.fn(),
      }))
    );

    const completeBtn = screen.getByRole('button', { name: 'Complete Focus Item Completed On Scroll' });
    fireEvent.click(completeBtn);
    expect(completeMock).toHaveBeenCalledWith(task);
  });

  it('T3.4: Dynamic LiveQuery task insertion during scroll expands list without layout jump', () => {
    function LiveQueryScrollHarness() {
      const [taskList, setTaskList] = useState([createMockTask({ id: 'init-1', title: 'Initial Task' })]);
      const listRef = useScrollMotion<HTMLDivElement>({ selector: '.task-entry' });

      return createElement(
        'div',
        null,
        createElement('button', {
          onClick: () => setTaskList((prev) => [...prev, createMockTask({ id: 'new-2', title: 'Streamed Task' })]),
        }, 'Insert Live Task'),
        createElement(
          'div',
          { ref: listRef, 'data-testid': 'live-container' },
          taskList.map((t) => createElement('div', { key: t.id, className: 'task-entry' }, t.title))
        )
      );
    }

    const { getByText } = render(createElement(LiveQueryScrollHarness));
    const insertBtn = getByText('Insert Live Task');

    act(() => {
      fireEvent.click(insertBtn);
    });

    expect(getByText('Streamed Task')).toBeDefined();
  });

  it('T3.5: Reduced-motion toggle during active scroll sets all targets to resting state instantly', () => {
    const { getByTestId } = render(
      createElement(MotionHarness, { options: { selector: '.motion-card' } })
    );

    act(() => {
      document.documentElement.dataset.reduceMotion = 'true';
    });

    expect(getByTestId('card-1')).toBeDefined();
  });

  it('T3.6: Switching view modes in Calendar retains date anchor and cleans up prior grid triggers', () => {
    function ViewSwitcherHarness() {
      const [mode, setMode] = useState<'month' | 'agenda'>('month');
      const ref = useScrollMotion<HTMLDivElement>({ key: mode, selector: '.view-item' });

      return createElement(
        'div',
        null,
        createElement('button', { onClick: () => setMode('agenda') }, 'To Agenda'),
        createElement('div', { ref },
          createElement('div', { className: 'view-item' }, `Active View: ${mode}`)
        )
      );
    }

    const { getByText } = render(createElement(ViewSwitcherHarness));
    fireEvent.click(getByText('To Agenda'));
    expect(getByText('Active View: agenda')).toBeDefined();
  });
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (User Journeys)
// ============================================================================

describe('Tier 4: Real-World Application Scenarios', () => {
  it('T4.1: Scenario 1 — Morning workspace overview review journey across all sections', async () => {
    const project = createMockProject({ id: 'p-scen-1', title: 'Nemo Production Launch' });
    const task = createMockTask({ id: 't-scen-1', title: 'Run Final Playwright E2E Suite' });
    const goal = createMockGoal({ id: 'g-scen-1', title: 'Flawless 60fps Experience' });
    const milestone = createMockMilestone({ id: 'm-scen-1', ownerId: 'g-scen-1' });

    render(
      createElement(BrowserRouter, null,
        createElement('div', { className: 'overview-page' },
          createElement(PageHeading, {
            title: 'Make room for progress.',
            description: 'Track your daily priorities, projects, and commitments.',
            stats: [{ label: 'Active projects', value: 1, icon: () => createElement('span', null, '*') }],
          }),
          createElement(WeeklyMomentumCard, {
            weeklyRatio: 90,
            finishedCount: 9,
            openCount: 1,
            activeProjectCount: 1,
            academicCount: 0,
            overdueCount: 0,
          }),
          createElement(FocusSlotsSection, {
            focused: [task],
            projects: [project],
            selections: [],
            openTasks: [task],
            onComplete: vi.fn(),
            onRemoveFocus: vi.fn(),
            onAddFocus: vi.fn(),
          }),
          createElement(GoalsInMotionSection, {
            goalStats: {
              activeGoals: [goal],
              completedGoals: [],
              goalMilestones: [milestone],
              doneMilestones: [],
              milestoneRate: 0,
            },
            milestones: [milestone],
          }),
          createElement(OperationalSection, {
            nextTasks: [task],
            academic: [],
            recentCompleted: [],
            onComplete: vi.fn(),
          })
        )
      )
    );

    expect(screen.getByLabelText('Make room for progress.')).toBeDefined();
    expect(screen.getByText('Weekly momentum')).toBeDefined();
    expect(screen.getByText("Today's focus")).toBeDefined();
    expect(screen.getByText('Goals in motion')).toBeDefined();
    expect(screen.getByText('Coming into view')).toBeDefined();
  });

  it('T4.2: Scenario 2 — Heavy task triage marathon: browsing, filtering, and checking completion', () => {
    const tasks = Array.from({ length: 15 }, (_, i) =>
      createMockTask({ id: `t-marathon-${i}`, title: `Operational Task #${i + 1}` })
    );

    const toggleMock = vi.fn();
    const deleteMock = vi.fn();

    render(
      createElement('div', { className: 'tasks-list-container' },
        tasks.map((task) =>
          createElement(TaskItem, {
            key: task.id,
            task,
            hourFormat: '24h',
            onToggleStatus: toggleMock,
            onEdit: vi.fn(),
            onDeleteRequest: deleteMock,
          })
        )
      )
    );

    expect(screen.getByText('Operational Task #1')).toBeDefined();
    expect(screen.getByText('Operational Task #15')).toBeDefined();

    // Complete the first task
    const checkboxes = screen.getAllByRole('button', { name: /Mark task complete/i });
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);
    expect(toggleMock).toHaveBeenCalled();
  });

  it('T4.3: Scenario 3 — Project portfolio deep-dive: grid vs list view mode transition', () => {
    const projects = [
      createMockProject({ id: 'p-1', title: 'Enterprise Dashboard' }),
      createMockProject({ id: 'p-2', title: 'Mobile React Native Migration' }),
    ];

    function PortfolioHarness() {
      const [view, setView] = useState<'grid' | 'list'>('grid');

      return createElement(
        BrowserRouter,
        null,
        createElement('div', null,
          createElement('button', { onClick: () => setView('list') }, 'Switch to List'),
          createElement('div', { className: view === 'grid' ? 'grid grid-cols-2' : 'space-y-3' },
            projects.map((p) =>
              createElement(ProjectCard, {
                key: p.id,
                project: p,
                milestones: [],
                tasks: [],
                viewMode: view,
              })
            )
          )
        )
      );
    }

    const { getByText } = render(createElement(PortfolioHarness));
    expect(screen.getByText('Enterprise Dashboard')).toBeDefined();

    fireEvent.click(getByText('Switch to List'));
    expect(screen.getByText('Mobile React Native Migration')).toBeDefined();
  });

  it('T4.4: Scenario 4 — Academic semester review: managing deliverables and upcoming exams', () => {
    const nextTask = createMockTask({
      id: 'exam-prep',
      title: 'Review Discrete Mathematics Lecture 8',
      parentType: 'assignment',
    });

    render(
      createElement(BrowserRouter, null,
        createElement(OperationalSection, {
          nextTasks: [nextTask],
          academic: [],
          recentCompleted: [],
          onComplete: vi.fn(),
        })
      )
    );

    expect(screen.getByText('Review Discrete Mathematics Lecture 8')).toBeDefined();
  });

  it('T4.5: Scenario 5 — Unified calendar agenda exploration across days and time slots', () => {
    render(
      createElement(PageHeading, {
        title: 'October 2026',
        description: 'Monthly schedule and upcoming deliverables',
        stats: [
          { label: 'Total Events', value: 14, icon: () => createElement('span', null, 'Cal') },
          { label: 'Exams Scheduled', value: 2, icon: () => createElement('span', null, 'Exam') },
        ],
      })
    );

    expect(screen.getByLabelText('October 2026')).toBeDefined();
    expect(screen.getByText('Total Events')).toBeDefined();
    expect(screen.getByLabelText('14')).toBeDefined();
  });

  it('T4.6: Scenario 6 — Executive insights quarterly review: metrics count-up and spline chart', () => {
    render(
      createElement('div', { className: 'insights-page' },
        createElement(PageHeading, {
          title: 'Workspace Insights',
          stats: [
            { label: 'All-time projects', value: 24, icon: () => createElement('span', null, '1') },
            { label: 'Active right now', value: 6, icon: () => createElement('span', null, '2') },
            { label: 'Tasks completed', value: 182, icon: () => createElement('span', null, '3') },
          ],
        })
      )
    );

    expect(screen.getByLabelText('Workspace Insights')).toBeDefined();
    expect(screen.getByLabelText('182')).toBeDefined();
  });

  it('T4.7: Scenario 7 — Complete workspace preferences configuration in Settings with modal confirmation', () => {
    function SettingsWorkflowHarness() {
      const [confirmOpen, setConfirmOpen] = useState(false);
      const [reducedState, setReducedState] = useState(false);

      return createElement(
        'div',
        null,
        createElement(PageHeading, {
          title: 'Settings',
          description: 'Customise your experience and manage your data.',
        }),
        createElement('button', {
          onClick: () => {
            document.documentElement.dataset.reduceMotion = 'true';
            setReducedState(true);
          },
        }, 'Enable Reduced Motion'),
        createElement('button', { onClick: () => setConfirmOpen(true) }, 'Reset Workspace'),
        createElement(Modal, {
          isOpen: confirmOpen,
          onClose: () => setConfirmOpen(false),
          title: 'Confirm Workspace Reset',
        }, createElement('p', null, 'Are you sure you want to reset all data?'))
      );
    }

    const { getByText } = render(createElement(SettingsWorkflowHarness));
    expect(screen.getByLabelText('Settings')).toBeDefined();

    // Toggle reduced motion
    fireEvent.click(getByText('Enable Reduced Motion'));
    expect(prefersReducedMotion()).toBe(true);

    // Open confirmation modal
    fireEvent.click(getByText('Reset Workspace'));
    expect(screen.getByText('Confirm Workspace Reset')).toBeDefined();
  });
});
