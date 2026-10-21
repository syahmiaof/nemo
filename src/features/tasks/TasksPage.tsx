import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  CheckSquare,
  Plus,
  Search,
} from 'lucide-react';
import { db, atomicSetTaskStatus, atomicDeleteTask } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { getTodayLocalDateString, isOverdue, isUpcoming } from '@/lib/dates';
import { useReducedMotion } from '@/design/useReducedMotion';
import { MotionTitle } from '@/components/ui/MotionTitle';
import { TaskFormModal } from './TaskFormModal';
import { TaskItem } from './TaskItem';
import type { Task } from '@/domain/types';

gsap.registerPlugin(useGSAP);

export const TasksPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const routedFocusId = useRef<string | null>(null);

  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { success } = useToast();
  const todayStr = getTodayLocalDateString();

  // Root container ref for GSAP scope
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  // Store exit animation triggers per task ID
  const exitAnimationTriggers = useRef<Map<string, () => Promise<void>>>(new Map());

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const hourFormat = settings?.hourFormat ?? '24h';

  // GSAP Choreography: Header, Toolbar & Filter Tabs entrance
  useGSAP(
    () => {
      if (reduced || !pageContainerRef.current) return;

      const tl = gsap.timeline();

      // Heading slide and fade in
      tl.fromTo(
        '.module-heading',
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,transform' }
      );

      // Search & action toolbar
      tl.fromTo(
        '.page-toolbar',
        { opacity: 0, y: 10, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out', clearProps: 'opacity,transform' },
        '-=0.25'
      );

      // Staggered filter tabs entrance
      tl.fromTo(
        '.page-filters button',
        { opacity: 0, y: 8, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          stagger: 0.035,
          ease: 'back.out(1.2)',
          clearProps: 'opacity,transform',
        },
        '-=0.2'
      );
    },
    { scope: pageContainerRef, dependencies: [reduced] }
  );

  useEffect(() => {
    const focusRecord = (location.state as { focusRecord?: { type: string; id: string } } | null)?.focusRecord;
    if (focusRecord?.type !== 'task') {
      routedFocusId.current = null;
      return;
    }
    if (routedFocusId.current === focusRecord.id) return;
    const target = tasks.find((task) => task.id === focusRecord.id);
    if (!target) return;
    routedFocusId.current = target.id;
    setActiveFilter('all');
    setSearchQuery(target.title);
    setFocusedTaskId(target.id);
    const timer = window.setTimeout(
      () => document.getElementById(`task-${target.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      120
    );
    const clearTimer = window.setTimeout(() => setFocusedTaskId(null), 3200);
    navigate(location.pathname, { replace: true, state: null });
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [location.state, location.pathname, tasks, navigate]);

  // Reset pagination when active filter or search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter, searchQuery]);

  // Single-pass computation of tab badge counts and parent lookup maps (O(N))
  const { filterTabs, projectMap, assignmentMap, goalMap } = useMemo(() => {
    let allCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let doneCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.status === 'done') {
        doneCount++;
      } else {
        allCount++;
        if (t.dueDate === todayStr) {
          todayCount++;
        } else if (t.dueDate) {
          if (isUpcoming(t.dueDate, 7)) upcomingCount++;
          else if (isOverdue(t.dueDate)) overdueCount++;
        }
      }
    }

    return {
      filterTabs: [
        { key: 'all', label: 'All Tasks', count: allCount },
        { key: 'today', label: 'Due Today', count: todayCount },
        { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
        { key: 'overdue', label: 'Overdue', count: overdueCount },
        { key: 'done', label: 'Completed', count: doneCount },
      ],
      projectMap: new Map(projects.map((p) => [p.id, p.title])),
      assignmentMap: new Map(assignments.map((a) => [a.id, a.title])),
      goalMap: new Map(goals.map((g) => [g.id, g.title])),
    };
  }, [tasks, projects, assignments, goals, todayStr]);

  // Use deferred value for search filtering to maintain 60fps responsive typing
  const deferredSearch = useDeferredValue(searchQuery);

  // Memoized filtering logic
  const filteredTasks = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return tasks.filter((task) => {
      // Status/Date tabs
      if (activeFilter === 'done') {
        if (task.status !== 'done') return false;
      } else {
        if (task.status === 'done' && activeFilter !== 'all') return false;

        if (activeFilter === 'today') {
          if (task.dueDate !== todayStr) return false;
        } else if (activeFilter === 'upcoming') {
          if (!task.dueDate || !isUpcoming(task.dueDate, 7) || task.dueDate === todayStr) return false;
        } else if (activeFilter === 'overdue') {
          if (!task.dueDate || !isOverdue(task.dueDate)) return false;
        }
      }

      // Search query
      if (q) {
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNotes = task.notes?.toLowerCase().includes(q);
        const matchTags = task.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchNotes && !matchTags) return false;
      }

      return true;
    });
  }, [tasks, activeFilter, deferredSearch, todayStr]);

  const visibleTasks = useMemo(() => {
    return filteredTasks.slice(0, visibleCount);
  }, [filteredTasks, visibleCount]);

  // GSAP: Staggered reveal on Dexie async data load or filter change
  useGSAP(
    () => {
      const container = taskListRef.current;
      if (!container || reduced) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>('.task-card')).filter((el) => {
        const b = el.getBoundingClientRect();
        return b.top < window.innerHeight + 100 && b.bottom > -50;
      }).slice(0, 20);

      if (items.length === 0) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 14, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.035,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        }
      );
    },
    {
      scope: taskListRef,
      dependencies: [activeFilter, deferredSearch, visibleTasks.length, reduced],
    }
  );

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await atomicSetTaskStatus(db, task.id, nextStatus);
    success(nextStatus === 'done' ? 'Task completed' : 'Task reopened');
  };

  const handleDeleteRequest = (task: Task, triggerExitAnimation: () => Promise<void>) => {
    exitAnimationTriggers.current.set(task.id, triggerExitAnimation);
    setTaskToDelete(task);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const triggerExit = exitAnimationTriggers.current.get(taskToDelete.id);
    if (triggerExit) {
      await triggerExit();
      exitAnimationTriggers.current.delete(taskToDelete.id);
    }
    await atomicDeleteTask(db, taskToDelete.id);
    setTaskToDelete(null);
    success('Task deleted');
  };

  return (
    <div ref={pageContainerRef} className="tasks-page space-y-6">
      <div className="module-heading" data-enter>
        <MotionTitle text="Tasks" />
        <p>Small steps. Clear priorities.</p>
      </div>

      {/* Top Controls */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel relative z-10">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-content-tertiary" />
          <Input
            placeholder="Search tasks by title, notes, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10"
          />
        </div>

        <Button
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="gap-2 self-end sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="page-filters flex flex-wrap pb-1 gap-1.5">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              aria-pressed={isActive}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white/[0.1] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-transform duration-200 ${
                  tab.key === 'overdue' && tab.count > 0
                    ? 'bg-accent-ember/20 text-accent-ember border border-accent-ember/30'
                    : isActive
                    ? 'bg-white/[0.15] text-white scale-105'
                    : 'bg-white/[0.05] text-content-tertiary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={searchQuery ? 'No matching tasks' : 'No tasks in this view'}
          description={
            searchQuery
              ? 'Try modifying your search query or switching tabs.'
              : 'Add tasks to organize daily actions, link them to projects, or track academic assignments.'
          }
          actionLabel={searchQuery ? undefined : 'Add Task'}
          onAction={
            searchQuery
              ? undefined
              : () => {
                  setTaskToEdit(null);
                  setIsModalOpen(true);
                }
          }
        />
      ) : (
        <div ref={taskListRef} className="space-y-2.5">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isFocused={focusedTaskId === task.id}
              hourFormat={hourFormat}
              projectTitle={task.parentId ? projectMap.get(task.parentId) : undefined}
              assignmentTitle={task.parentId ? assignmentMap.get(task.parentId) : undefined}
              goalTitle={task.parentId ? goalMap.get(task.parentId) : undefined}
              onToggleStatus={handleToggleTask}
              onEdit={(t) => {
                setTaskToEdit(t);
                setIsModalOpen(true);
              }}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}

          {filteredTasks.length > visibleCount && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-content-secondary hover:text-content-primary transition-all border border-white/10 shadow-sm"
              >
                Load more tasks (Showing {visibleTasks.length} of {filteredTasks.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task?"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        variant="danger"
      />
    </div>
  );
};
