import React, { useState } from 'react';
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
import type { Priority } from '@/domain/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'task' | 'project' | 'assignment' | 'event';
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'task',
}) => {
  const [itemType, setItemType] = useState<'task' | 'project' | 'assignment' | 'event'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(getTodayLocalDateString());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(getTodayLocalDateString());
    setSelectedProjectId('');
    setSelectedSubjectId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Title is required');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      if (itemType === 'task') {
        const id = generateId('task');
        await db.tasks.add({
          id,
          title: title.trim(),
          notes: description.trim() || undefined,
          status: 'todo',
          priority,
          dueDate: dueDate || undefined,
          parentType: selectedProjectId ? 'project' : undefined,
          parentId: selectedProjectId || undefined,
          tags: [],
          createdAt: now,
          updatedAt: now,
        });
        success('Task created', `"${title.trim()}" added to tasks.`);
      } else if (itemType === 'project') {
        const id = generateId('proj');
        await db.projects.add({
          id,
          title: title.trim(),
          description: description.trim() || undefined,
          status: 'not_started',
          priority,
          dueDate: dueDate || undefined,
          tags: [],
          techStack: [],
          createdAt: now,
          updatedAt: now,
        });
        success('Project created', `"${title.trim()}" created.`);
      } else if (itemType === 'assignment') {
        const targetSubjectId = selectedSubjectId || subjects[0]?.id;
        if (!targetSubjectId) {
          error('Subject required', 'Please create a subject in Academics before creating assignments.');
          setIsSubmitting(false);
          return;
        }
        const id = generateId('assign');
        await db.assignments.add({
          id,
          subjectId: targetSubjectId,
          title: title.trim(),
          description: description.trim() || undefined,
          status: 'not_started',
          dueDate: dueDate || undefined,
          createdAt: now,
          updatedAt: now,
        });
        success('Assignment created', `"${title.trim()}" added to academics.`);
      } else if (itemType === 'event') {
        const id = generateId('event');
        await db.calendarEvents.add({
          id,
          title: title.trim(),
          description: description.trim() || undefined,
          startAt: dueDate,
          endAt: dueDate,
          isAllDay: true,
          createdAt: now,
          updatedAt: now,
        });
        success('Event created', `"${title.trim()}" added to calendar.`);
      }

      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save item';
      error('Error saving item', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add" description="Create a commitment quickly from anywhere in Nemo.">
      {/* Type Selector Tabs */}
      <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-5">
        {(['task', 'project', 'assignment', 'event'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setItemType(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
              itemType === t
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/15'
                : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Title`}
          placeholder={`e.g. ${itemType === 'project' ? 'Nemo Redesign' : itemType === 'assignment' ? 'Algorithm Analysis' : 'Finish auth flow'}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due / Target Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        {/* Task-specific parent linking */}
        {itemType === 'task' && projects.length > 0 && (
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

        {/* Assignment-specific subject selector */}
        {itemType === 'assignment' && (
          subjects.length > 0 ? (
            <Select
              label="Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              options={subjects.map((s) => ({ value: s.id, label: `${s.code ? s.code + ' - ' : ''}${s.title}` }))}
            />
          ) : (
            <p className="text-xs text-accent-amber bg-surface p-2 rounded-lg border border-border-subtle">
              Note: You can add subjects in the Academics tab to organize assignments.
            </p>
          )
        )}

        <Textarea
          label="Notes / Description (Optional)"
          placeholder="Add details, links, or expectations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
