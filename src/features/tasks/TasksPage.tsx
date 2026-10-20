import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Edit2,
  Trash2,
  FolderGit2,
  GraduationCap,
  Target,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { getTodayLocalDateString, formatDisplayDate, isOverdue, isUpcoming } from '@/lib/dates';
import { animateTaskCompletion } from '@/design/motion';
import { TaskFormModal } from './TaskFormModal';
import type { Task } from '@/domain/types';

export const TasksPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { success } = useToast();
  const todayStr = getTodayLocalDateString();

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];

  // Project map for quick parent lookup
  const projectMap = new Map(projects.map((p) => [p.id, p.title]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a.title]));
  const goalMap = new Map(goals.map((g) => [g.id, g.title]));

  // Filtering logic
  const filteredTasks = tasks.filter((task) => {
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = task.notes?.toLowerCase().includes(q);
      const matchTags = task.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchTags) return false;
    }

    return true;
  });

  const handleToggleTask = async (task: Task, e: React.MouseEvent<HTMLButtonElement>) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : undefined;

    if (nextStatus === 'done') {
      animateTaskCompletion(e.currentTarget);
    }

    await db.transaction('rw', [db.tasks, db.focusSelections], async () => {
      await db.tasks.update(task.id, {
        status: nextStatus,
        completedAt,
        updatedAt: new Date().toISOString(),
      });
      if (nextStatus === 'done') {
        await db.focusSelections.where('taskId').equals(task.id).delete();
      }
    });

    success(nextStatus === 'done' ? 'Task completed' : 'Task reopened');
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    await db.tasks.delete(taskToDelete.id);
    // Delete any focus selection referencing this task
    await db.focusSelections.where('taskId').equals(taskToDelete.id).delete();
    // Delete any goal task links
    await db.goalTaskLinks.where('taskId').equals(taskToDelete.id).delete();

    setTaskToDelete(null);
    success('Task deleted');
  };

  const filterTabs = [
    { key: 'all', label: 'All Tasks', count: tasks.filter((t) => t.status !== 'done').length },
    { key: 'today', label: 'Due Today', count: tasks.filter((t) => t.dueDate === todayStr && t.status !== 'done').length },
    { key: 'upcoming', label: 'Upcoming', count: tasks.filter((t) => t.dueDate && isUpcoming(t.dueDate, 7) && t.dueDate !== todayStr && t.status !== 'done').length },
    { key: 'overdue', label: 'Overdue', count: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'done').length },
    { key: 'done', label: 'Completed', count: tasks.filter((t) => t.status === 'done').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel relative z-10">
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
      <div className="flex overflow-x-auto pb-1 gap-1.5 border-b border-white/[0.08]">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.1] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  tab.key === 'overdue' && tab.count > 0
                    ? 'bg-accent-ember/20 text-accent-ember border border-accent-ember/30'
                    : isActive
                    ? 'bg-white/[0.15] text-white'
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
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && !isDone;

            let parentLabel: string | undefined;
            let ParentIcon = FolderGit2;

            if (task.parentType === 'project' && task.parentId) {
              parentLabel = projectMap.get(task.parentId);
              ParentIcon = FolderGit2;
            } else if (task.parentType === 'assignment' && task.parentId) {
              parentLabel = assignmentMap.get(task.parentId);
              ParentIcon = GraduationCap;
            } else if (task.parentType === 'goal' && task.parentId) {
              parentLabel = goalMap.get(task.parentId);
              ParentIcon = Target;
            }

            return (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl glass-panel relative group transition-all duration-200 gap-3 ${
                  isDone
                    ? 'opacity-65 hover:opacity-85'
                    : 'hover:border-white/20 hover:scale-[1.005]'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-3.5 min-w-0 relative z-10">
                  <button
                    onClick={(e) => handleToggleTask(task, e)}
                    className="text-white/40 hover:text-accent-mint transition-colors p-0.5 mt-0.5 flex-shrink-0"
                    aria-label={`Mark task ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isDone ? 'line-through text-content-tertiary' : 'text-content-primary'
                        }`}
                      >
                        {task.title}
                      </span>

                      {parentLabel && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-content-secondary font-mono truncate max-w-[160px]">
                          <ParentIcon className="w-3 h-3 text-accent-mint" />
                          <span className="truncate">{parentLabel}</span>
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-content-secondary line-clamp-1">{task.notes}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-content-tertiary pt-0.5 flex-wrap font-mono">
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            isTaskOverdue ? 'text-accent-ember font-semibold' : ''
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDisplayDate(task.dueDate)}</span>
                          {task.dueTime && <span>at {task.dueTime}</span>}
                        </span>
                      )}

                      {task.tags.length > 0 && (
                        <span>#{task.tags.join(' #')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center relative z-10">
                  <PriorityBadge priority={task.priority} size="sm" />
                  <StatusBadge status={task.status} size="sm" />

                  <button
                    onClick={() => {
                      setTaskToEdit(task);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-white/[0.08] transition-colors"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 rounded-lg text-content-tertiary hover:text-accent-ember hover:bg-white/[0.08] transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
