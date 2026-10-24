import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bookmark } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/db/nemoDb';
import { generateId } from '@/lib/ids';
import { getTodayLocalDateString } from '@/lib/dates';
import type { Task, Priority, TaskStatus } from '@/domain/types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultParentType?: 'project' | 'assignment' | 'goal';
  defaultParentId?: string;
  isWatchlistMode?: boolean;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultParentType,
  defaultParentId,
  isWatchlistMode = false,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setNotes(taskToEdit.notes || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setTagsInput(taskToEdit.tags.join(', '));
      setSelectedProjectId(taskToEdit.parentType === 'project' ? taskToEdit.parentId || '' : '');
      setIsWatchlist(Boolean(taskToEdit.isWatchlist || taskToEdit.tags?.includes('watchlist')));
    } else {
      setTitle('');
      setNotes('');
      setStatus('todo');
      setPriority('medium');
      setDueDate(isWatchlistMode ? '' : getTodayLocalDateString());
      setDueTime('');
      setTagsInput(isWatchlistMode ? 'watchlist' : '');
      setSelectedProjectId(defaultParentType === 'project' ? defaultParentId || '' : '');
      setIsWatchlist(Boolean(isWatchlistMode));
    }
  }, [taskToEdit, defaultParentType, defaultParentId, isOpen, isWatchlistMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Title required', 'Please provide a task title.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      let tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (isWatchlist) {
        if (!tags.includes('watchlist')) {
          tags.push('watchlist');
        }
      } else {
        tags = tags.filter((t) => t.toLowerCase() !== 'watchlist');
      }

      let parentType: 'project' | 'assignment' | 'goal' | undefined = taskToEdit ? taskToEdit.parentType : defaultParentType;
      let parentId: string | undefined = taskToEdit ? taskToEdit.parentId : defaultParentId;

      if (selectedProjectId) {
        parentType = 'project';
        parentId = selectedProjectId;
      } else if (parentType === 'project') {
        parentType = undefined;
        parentId = undefined;
      }

      if (taskToEdit) {
        const isCompletingNow = status === 'done' && taskToEdit.status !== 'done';
        const isReopeningNow = status !== 'done' && taskToEdit.status === 'done';

        let completedAt = taskToEdit.completedAt;
        if (isCompletingNow) {
          completedAt = now;
        } else if (isReopeningNow) {
          completedAt = undefined;
        }

        await db.transaction('rw', [db.focusSelections, db.tasks, db.syncMutations], async () => {
          if (isCompletingNow) {
            await db.focusSelections.where('taskId').equals(taskToEdit.id).delete();
          }
          await db.tasks.update(taskToEdit.id, {
            title: title.trim(),
            notes: notes.trim() || undefined,
            status,
            priority,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            parentType,
            parentId,
            tags,
            isWatchlist,
            completedAt,
            updatedAt: now,
          });
        });

        success('Task updated', `"${title.trim()}" saved.`);
      } else {
        const id = generateId('task');
        await db.tasks.add({
          id,
          title: title.trim(),
          notes: notes.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          parentType,
          parentId,
          tags,
          isWatchlist,
          completedAt: status === 'done' ? now : undefined,
          createdAt: now,
          updatedAt: now,
        });

        if (isWatchlist) {
          success('Added to Watchlist', `"${title.trim()}" parked for later.`);
        } else {
          success('Task created', `"${title.trim()}" added.`);
        }
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      error('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        taskToEdit
          ? (isWatchlist ? 'Edit Watchlist Item' : 'Edit Task')
          : (isWatchlist ? 'Add to Watchlist' : 'New Task')
      }
      description={
        isWatchlist
          ? 'Park this idea or task to do later without deadline pressure or overdue alerts.'
          : 'Single canonical task with date, priority, and parent context.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder={isWatchlist ? 'e.g. Explore machine learning tutorials' : 'e.g. Implement user authentication'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        {/* Watchlist Toggle */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 transition-colors cursor-pointer select-none"
          onClick={() => setIsWatchlist(!isWatchlist)}
        >
          <input
            type="checkbox"
            id="task-watchlist-toggle"
            checked={isWatchlist}
            onChange={(e) => setIsWatchlist(e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded border-white/20 text-sky-400 focus:ring-sky-400 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <label htmlFor="task-watchlist-toggle" className="flex flex-col cursor-pointer">
            <span className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sky-400" />
              Park in Task Watchlist (Do Later)
            </span>
            <span className="text-[11px] text-content-tertiary">
              Park this idea safely. It won't trigger overdue alarms or crowd your daily queue until activated.
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due Date (Optional for Watchlist)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Due Time (Optional)"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>

        {projects.length > 0 && (
          <Select
            label="Link to Project (Optional)"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { value: '', label: 'None (Standalone Task)' },
              ...projects.map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        )}

        <Input
          label="Tags (comma separated)"
          placeholder="watchlist, idea, reading"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <Textarea
          label="Notes / Subtasks / References"
          placeholder="Add extra context, links, or ideas to explore later..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {taskToEdit ? 'Save Changes' : (isWatchlist ? 'Add to Watchlist' : 'Create Task')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
