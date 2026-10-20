import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  FolderGit2,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  Target,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { QuickAddModal } from '@/app/QuickAddModal';
import { getTodayLocalDateString, formatDisplayDate, isOverdue, getYearFromDate } from '@/lib/dates';
import type { Task } from '@/domain/types';

export const OverviewPage: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const todayStr = getTodayLocalDateString();
  const currentYear = new Date().getFullYear();
  const { success } = useToast();

  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const allProjects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const allAssignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const focusSelections = useLiveQuery(() => db.focusSelections.where('effectiveLocalDate').equals(todayStr).toArray(), [todayStr]) || [];

  // Filter tasks
  const openTasks = allTasks.filter((t) => t.status !== 'done');
  const dueTodayTasks = allTasks.filter((t) => t.dueDate === todayStr && t.status !== 'done');
  const overdueTasks = allTasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'done');

  // Projects stats
  const activeProjects = allProjects.filter((p) => p.status === 'in_progress' && !p.archivedAt);
  const completedProjectsThisYear = allProjects.filter((p) => p.completedAt && getYearFromDate(p.completedAt) === currentYear);

  // Today's Focus tasks (max 3 unfinished tasks)
  const focusTaskIds = focusSelections.map((f) => f.taskId);
  const focusTasks = allTasks.filter((t) => focusTaskIds.includes(t.id));

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : undefined;
    await db.tasks.update(task.id, {
      status: nextStatus,
      completedAt,
      updatedAt: new Date().toISOString(),
    });

    if (nextStatus === 'done') {
      success('Task completed', `"${task.title}" is finished.`);
      // Remove from active focus slots if finished
      const focusItem = focusSelections.find((f) => f.taskId === task.id);
      if (focusItem) {
        await db.focusSelections.delete(focusItem.id);
      }
    }
  };

  // Add an open task to Today's Focus
  const handleAddToFocus = async (taskId: string) => {
    if (focusSelections.length >= 3) {
      return;
    }
    await db.focusSelections.add({
      id: `${todayStr}_${taskId}`,
      taskId,
      effectiveLocalDate: todayStr,
      chosenAt: new Date().toISOString(),
    });
  };

  // Remove a task from Today's Focus
  const handleRemoveFromFocus = async (taskId: string) => {
    const match = focusSelections.find((f) => f.taskId === taskId);
    if (match) {
      await db.focusSelections.delete(match.id);
    }
  };

  // Format greeting
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const hasAnyData = allProjects.length > 0 || allTasks.length > 0 || allAssignments.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface/80 border border-border-subtle shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-accent-mint uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formatDisplayDate(todayStr)}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-content-primary">
            {greeting()}, {settings?.displayName || 'Friend'}.
          </h2>
          <p className="text-xs text-content-secondary mt-1">
            {openTasks.length === 0
              ? 'No pending tasks. You are completely clear for the moment.'
              : `You have ${dueTodayTasks.length} task${dueTodayTasks.length === 1 ? '' : 's'} due today and ${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} in total.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsQuickAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </Button>
        </div>
      </div>

      {/* Honest Empty Workspace State */}
      {!hasAnyData ? (
        <EmptyState
          icon={FolderGit2}
          title="Your workspace is empty"
          description="Nemo stores all your projects, tasks, academic commitments, and goals locally in your browser. Create your first project or task to get started."
          actionLabel="Create First Project"
          onAction={() => setIsQuickAddOpen(true)}
        />
      ) : (
        <>
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-[11px] font-mono uppercase tracking-wider text-content-tertiary">Due Today</p>
              <p className="text-2xl font-bold text-content-primary mt-1">{dueTodayTasks.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-[11px] font-mono uppercase tracking-wider text-content-tertiary">Overdue</p>
              <p className={`text-2xl font-bold mt-1 ${overdueTasks.length > 0 ? 'text-accent-ember' : 'text-content-primary'}`}>
                {overdueTasks.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-[11px] font-mono uppercase tracking-wider text-content-tertiary">Active Projects</p>
              <p className="text-2xl font-bold text-content-primary mt-1">{activeProjects.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-[11px] font-mono uppercase tracking-wider text-content-tertiary">Completed This Year</p>
              <p className="text-2xl font-bold text-accent-mint mt-1">{completedProjectsThisYear.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Today's Focus & Due Today */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Focus Card (Max 3 slots) */}
              <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent-mint" />
                    <h3 className="text-sm font-semibold text-content-primary">Today's Focus</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-hover border border-border-subtle text-content-tertiary">
                      {focusTasks.length}/3 slots
                    </span>
                  </div>
                  {focusTasks.length < 3 && openTasks.length > focusTasks.length && (
                    <span className="text-[11px] text-content-tertiary">
                      Select up to 3 priority actions for today
                    </span>
                  )}
                </div>

                {focusTasks.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-content-tertiary mb-3">No tasks chosen for today's focus yet.</p>
                    {openTasks.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {openTasks.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleAddToFocus(t.id)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-surface-solid border border-border-subtle text-content-secondary transition-colors truncate max-w-[200px]"
                          >
                            + {t.title}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setIsQuickAddOpen(true)}>
                        Create a Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {focusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/70 border border-border-subtle group hover:border-border-emphasis transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="text-content-tertiary hover:text-accent-mint transition-colors p-0.5"
                            aria-label="Toggle task status"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-content-primary truncate">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-[10px] text-content-tertiary flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDisplayDate(task.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <button
                            onClick={() => handleRemoveFromFocus(task.id)}
                            className="text-[11px] text-content-tertiary hover:text-accent-ember p-1 transition-colors"
                            title="Remove from Today's Focus"
                          >
                            Unpin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Today & Immediate Priorities */}
              <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-amber" />
                    <h3 className="text-sm font-semibold text-content-primary">Due Today & Upcoming</h3>
                  </div>
                  <Link to="/tasks" className="text-xs text-accent-mint hover:underline flex items-center gap-1">
                    <span>View all tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {dueTodayTasks.length === 0 ? (
                  <p className="text-xs text-content-tertiary py-4 text-center">No tasks due today.</p>
                ) : (
                  <div className="space-y-2">
                    {dueTodayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface/50 border border-border-subtle hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="text-content-tertiary hover:text-accent-mint p-0.5"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-content-primary truncate">{task.title}</span>
                        </div>
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Active Projects & Quick Jump */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-accent-mint" />
                    <h3 className="text-sm font-semibold text-content-primary">Active Projects</h3>
                  </div>
                  <Link to="/projects" className="text-xs text-accent-mint hover:underline flex items-center gap-1">
                    <span>All projects</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {activeProjects.length === 0 ? (
                  <p className="text-xs text-content-tertiary py-4 text-center">No active projects currently.</p>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.slice(0, 4).map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="block p-3 rounded-xl bg-surface-hover/50 border border-border-subtle hover:border-border-emphasis transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-semibold text-content-primary group-hover:text-accent-mint transition-colors truncate">
                            {project.title}
                          </p>
                          <PriorityBadge priority={project.priority} size="sm" />
                        </div>
                        {project.dueDate && (
                          <p className="text-[10px] text-content-tertiary mt-1.5 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Target: {formatDisplayDate(project.dueDate)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Add Universal Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
};
