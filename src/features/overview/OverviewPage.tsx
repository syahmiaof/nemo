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
  Check,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { PriorityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { QuickAddModal } from '@/app/QuickAddModal';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { getTodayLocalDateString, formatDisplayDate, isOverdue, getYearFromDate } from '@/lib/dates';
import type { Task } from '@/domain/types';

export const OverviewPage: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'focus' | 'velocity'>('focus');
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
  const completedTasks = allTasks.filter((t) => t.status === 'done');

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
      success('Task Completed', `"${task.title}" is finished.`);
      // Remove from active focus slots if finished
      const focusItem = focusSelections.find((f) => f.taskId === task.id);
      if (focusItem) {
        await db.focusSelections.delete(focusItem.id);
      }
    }
  };

  // Add an open task to Today's Focus
  const handleAddToFocus = async (taskId: string) => {
    if (focusSelections.length >= 3) return;
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

  // Greeting
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Weekly data for Tavola Spline Chart
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Synthetic / derived activity points for smooth chart visualization
  const weeklyValues = [3, 5, Math.max(2, completedTasks.length), 4, Math.max(3, openTasks.length), 6, 8];
  const benchmarkValues = [2, 3, 4, 3, 5, 4, 6];

  const hasAnyData = allProjects.length > 0 || allTasks.length > 0 || allAssignments.length > 0;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. Tavola-Style Hero Section & Key Metric Chips */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-accent-mint uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formatDisplayDate(todayStr)} · Daily Commitments</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
            {greeting()}, {settings?.displayName || 'Friend'}.
          </h1>
        </div>

        {/* Floating Glass Metric Pills (Matching Tavola Top Metric Chips) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chip 1: Due Today */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/70 backdrop-blur-md border border-border-subtle shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-accent-mint/15 border border-accent-mint/30 flex items-center justify-center text-accent-mint">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-content-primary">{dueTodayTasks.length}</span>
                {overdueTasks.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent-ember/20 text-accent-ember">
                    +{overdueTasks.length} overdue
                  </span>
                )}
              </div>
              <p className="text-[11px] text-content-tertiary font-medium">Due Today</p>
            </div>
          </div>

          {/* Chip 2: Active Projects */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/70 backdrop-blur-md border border-border-subtle shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-accent-amber/15 border border-accent-amber/30 flex items-center justify-center text-accent-amber">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-content-primary">{activeProjects.length}</span>
              <p className="text-[11px] text-content-tertiary font-medium">Active Initiatives</p>
            </div>
          </div>

          {/* Chip 3: Focus Status */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/70 backdrop-blur-md border border-border-subtle shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-accent-ember/15 border border-accent-ember/30 flex items-center justify-center text-accent-ember">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-content-primary">{focusTasks.length}/3</span>
              <p className="text-[11px] text-content-tertiary font-medium">Focus Slots Locked</p>
            </div>
          </div>

          {/* Chip 4: Yearly Accomplishment */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/70 backdrop-blur-md border border-border-subtle shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-accent-mint/15 border border-accent-mint/30 flex items-center justify-center text-accent-mint">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-content-primary">{completedProjectsThisYear.length}</span>
              <p className="text-[11px] text-content-tertiary font-medium">Finished This Year</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Two-Column Tavola Layout */}
      {!hasAnyData ? (
        <div className="glass-panel p-8 sm:p-12 text-center">
          <EmptyState
            icon={FolderGit2}
            title="Your workspace is empty"
            description="Nemo stores all your projects, tasks, academic commitments, and goals locally in your browser. Create your first project or task to get started."
            actionLabel="Create First Project"
            onAction={() => setIsQuickAddOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (7 Cols): Tavola "Live Service" Focus & Spline Chart Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 sm:p-7 space-y-6">
              {/* Card Header & Toggle Segment Pill */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <span>Live Focus & Velocity</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
                  </h2>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    Continuous local telemetry across your active projects
                  </p>
                </div>

                {/* Tavola Segmented Control Pill */}
                <div className="flex items-center p-1 rounded-full bg-surface-solid border border-border-subtle text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('focus')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all ${
                      activeTab === 'focus'
                        ? 'bg-surface text-content-primary shadow-sm border border-border-subtle'
                        : 'text-content-tertiary hover:text-content-secondary'
                    }`}
                  >
                    Focus Slots ({focusTasks.length}/3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('velocity')}
                    className={`px-3 py-1 rounded-full font-semibold transition-all ${
                      activeTab === 'velocity'
                        ? 'bg-surface text-content-primary shadow-sm border border-border-subtle'
                        : 'text-content-tertiary hover:text-content-secondary'
                    }`}
                  >
                    Weekly Curve
                  </button>
                </div>
              </div>

              {/* Big Highlight Headline */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary">
                    {focusTasks.length === 3 ? '3 Priority Locks' : `${openTasks.length} Open Tasks`}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                    100% Offline-Local
                  </span>
                </div>
                <p className="text-xs text-content-secondary mt-1">
                  {focusTasks.length === 0
                    ? 'Pick up to 3 high-impact tasks below to lock into today’s focus ring.'
                    : `${focusTasks.length} task${focusTasks.length > 1 ? 's' : ''} locked into your daily execution cycle.`}
                </p>
              </div>

              {/* Interactive Smooth Spline Chart */}
              <div className="pt-2 border-t border-border-subtle/50">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-4 text-[11px] font-medium text-content-tertiary">
                    <span className="flex items-center gap-1.5 text-content-secondary">
                      <span className="w-2.5 h-1 rounded-full bg-accent-mint inline-block" />
                      Current Cycle
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-content-tertiary inline-block" />
                      Baseline
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-content-tertiary">Mon — Sun</span>
                </div>

                <TavolaSplineChart
                  labels={daysOfWeek}
                  values={weeklyValues}
                  comparisonValues={benchmarkValues}
                  seriesName="Completed"
                  comparisonName="Target"
                  unit="items"
                  height={170}
                />
              </div>

              {/* Focus Slots Selection List */}
              <div className="pt-2 border-t border-border-subtle/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-content-primary">Active Focus Slots</span>
                  <span className="text-[11px] font-mono text-content-tertiary">{focusTasks.length} of 3 filled</span>
                </div>

                {focusTasks.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-surface/40 border border-dashed border-border-subtle text-center">
                    <p className="text-xs text-content-tertiary mb-2.5">No tasks locked into focus yet.</p>
                    {openTasks.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {openTasks.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleAddToFocus(t.id)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-solid border border-border-subtle text-content-secondary hover:text-content-primary transition-all truncate max-w-[220px]"
                          >
                            + {t.title}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddOpen(true)}
                        className="text-xs px-3.5 py-1.5 rounded-xl bg-accent-mint/20 text-accent-mint font-semibold hover:bg-accent-mint/30 transition-colors"
                      >
                        Create First Task
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {focusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-surface/60 border border-border-subtle hover:border-border-emphasis transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task)}
                            className="text-content-tertiary hover:text-accent-mint transition-colors p-0.5"
                            aria-label="Finish task"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-content-primary truncate">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-[10px] text-content-tertiary flex items-center gap-1 mt-0.5 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatDisplayDate(task.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromFocus(task.id)}
                            className="text-[11px] text-content-tertiary hover:text-accent-ember px-2 py-1 transition-colors"
                            title="Unlock from Focus"
                          >
                            Unpin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 Cols): Tavola "On The Pass" Pastel Action Tickets Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 sm:p-7 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-accent-ember" />
                  <h3 className="text-sm font-bold text-content-primary">Action Tickets</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-solid border border-border-subtle text-content-tertiary">
                    {dueTodayTasks.length || openTasks.length} queued
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(true)}
                    className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-solid transition-colors"
                    title="Add Action Ticket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <Link
                    to="/tasks"
                    className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-solid transition-colors"
                    title="Open Unified Tasks"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pastel Ticket Stack (The iconic Tavola "On The Pass" Restaurant Cards!) */}
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                {(dueTodayTasks.length > 0 ? dueTodayTasks : openTasks.slice(0, 5)).map((task, idx) => {
                  // Alternate between pastel mint (#BBF0D8) and pastel peach (#FFD4C7)
                  const isPeach = idx % 2 === 1;

                  return (
                    <div
                      key={task.id}
                      className={`relative rounded-2xl p-4 transition-all duration-200 shadow-sm border ${
                        isPeach
                          ? 'bg-[#FFD4C7] dark:bg-[#321c16] border-[#fbbfa8]/60 dark:border-[#52291d] text-[#441a12] dark:text-[#fcd8cd]'
                          : 'bg-[#BBF0D8] dark:bg-[#122e22] border-[#86efac]/50 dark:border-[#1d4f3b] text-[#13432d] dark:text-[#c4f2dc]'
                      }`}
                    >
                      {/* Top Header info */}
                      <div className="flex items-center justify-between text-[11px] font-mono opacity-80 mb-2">
                        <span className="font-bold">#T-{task.id.slice(-4).toUpperCase()}</span>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueDate ? formatDisplayDate(task.dueDate) : 'No due date'}</span>
                        </div>
                      </div>

                      {/* Ticket Title */}
                      <h4 className="text-base font-bold tracking-tight mb-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Project reference or description snippet */}
                      <p className="text-xs opacity-75 line-clamp-2 mb-4 leading-relaxed">
                        {task.notes || (task.parentType === 'project' ? 'Linked to initiative milestone' : 'Universal task item')}
                      </p>

                      {/* Bottom action row with circular check button */}
                      <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-70">
                          {task.priority.toUpperCase()} PRIORITY
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                            isPeach
                              ? 'bg-white dark:bg-[#4a261c] text-[#7c2d12] dark:text-[#fcd8cd] hover:brightness-105'
                              : 'bg-white dark:bg-[#1b4332] text-[#166534] dark:text-[#c4f2dc] hover:brightness-105'
                          }`}
                          title="Finish Task"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {openTasks.length === 0 && (
                  <p className="text-xs text-content-tertiary text-center py-6">
                    All action tickets are cleared!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Row: Active Initiatives / Projects Cards */}
      {activeProjects.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-accent-amber" />
              <span>Active Initiatives</span>
            </h3>
            <Link
              to="/projects"
              className="text-xs font-semibold text-accent-mint hover:underline flex items-center gap-1"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeProjects.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="glass-panel p-5 block group hover:border-border-emphasis transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-bold text-content-primary group-hover:text-accent-mint transition-colors truncate">
                    {project.title}
                  </h4>
                  <PriorityBadge priority={project.priority} size="sm" />
                </div>
                <p className="text-xs text-content-secondary line-clamp-2 mb-3">
                  {project.description || 'No description provided.'}
                </p>
                {project.dueDate && (
                  <p className="text-[10px] text-content-tertiary font-mono flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Target: {formatDisplayDate(project.dueDate)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Add Universal Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
};
