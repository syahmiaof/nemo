import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultParentType,
  defaultParentId,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
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
    } else {
      setTitle('');
      setNotes('');
      setStatus('todo');
      setPriority('medium');
      setDueDate(getTodayLocalDateString());
      setDueTime('');
      setTagsInput('');
      setSelectedProjectId(defaultParentType === 'project' ? defaultParentId || '' : '');
    }
  }, [taskToEdit, defaultParentType, defaultParentId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Title required', 'Please provide a task title.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const parentType = selectedProjectId ? 'project' : taskToEdit?.parentType;
      const parentId = selectedProjectId ? selectedProjectId : taskToEdit?.parentId;

      if (taskToEdit) {
        const isCompletingNow = status === 'done' && taskToEdit.status !== 'done';
        const isReopeningNow = status !== 'done' && taskToEdit.status === 'done';

        let completedAt = taskToEdit.completedAt;
        if (isCompletingNow) completedAt = now;
        else if (isReopeningNow) completedAt = undefined;

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
          completedAt,
          updatedAt: now,
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
          completedAt: status === 'done' ? now : undefined,
          createdAt: now,
          updatedAt: now,
        });

        success('Task created', `"${title.trim()}" added.`);
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
      title={taskToEdit ? 'Edit Task' : 'New Task'}
      description="Single canonical task with date, priority, and parent context."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Implement user authentication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

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
            label="Due Date"
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
          placeholder="backend, bug, design"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <Textarea
          label="Notes / Subtasks / References"
          placeholder="Add extra context or check items..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
