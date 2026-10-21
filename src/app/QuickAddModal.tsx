import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
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
import { useReducedMotion } from '@/design/useReducedMotion';

gsap.registerPlugin(useGSAP);

type QuickAddType = 'task' | 'project' | 'assignment' | 'event';

interface QuickAddDraft {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  selectedProjectId: string;
  selectedSubjectId: string;
}

const createDraft = (): QuickAddDraft => ({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: getTodayLocalDateString(),
  selectedProjectId: '',
  selectedSubjectId: '',
});

const TYPES: QuickAddType[] = ['task', 'project', 'assignment', 'event'];

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
  const [itemType, setItemType] = useState<QuickAddType>(defaultType);
  const [drafts, setDrafts] = useState<Record<QuickAddType, QuickAddDraft>>(() => ({
    task: createDraft(), project: createDraft(), assignment: createDraft(), event: createDraft(),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reducedMotion = useReducedMotion();

  const { title, description, priority, dueDate, selectedProjectId, selectedSubjectId } = drafts[itemType];

  const updateDraft = (patch: Partial<QuickAddDraft>) => {
    setDrafts((current) => ({
      ...current,
      [itemType]: { ...current[itemType], ...patch },
    }));
  };

  useGSAP(() => {
    const tabs = tabsRef.current;
    const indicator = indicatorRef.current;
    const panel = panelRef.current;
    const selectedIndex = TYPES.indexOf(itemType);
    const selectedTab = tabButtonRefs.current[selectedIndex];
    if (!tabs || !indicator || !panel || !selectedTab) return;

    const left = selectedTab.offsetLeft;
    const width = selectedTab.offsetWidth;
    if (reducedMotion) {
      gsap.set(indicator, { x: left, width, opacity: 1 });
      gsap.set(panel, { clearProps: 'opacity,transform' });
      return;
    }

    gsap.to(indicator, {
      x: left,
      width,
      opacity: 1,
      duration: 0.36,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    gsap.fromTo(panel,
      { opacity: 0.35, y: 5 },
      { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', clearProps: 'opacity,transform', overwrite: 'auto' },
    );
  }, { scope: rootRef, dependencies: [itemType, isOpen, reducedMotion], revertOnUpdate: false });

  const { success, error } = useToast();

  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];

  const resetForm = () => {
    setDrafts((current) => ({ ...current, [itemType]: createDraft() }));
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TYPES.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TYPES.length) % TYPES.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TYPES.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    setItemType(TYPES[nextIndex]);
    tabButtonRefs.current[nextIndex]?.focus();
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
      <div ref={rootRef}>
      {/* Type Selector Tabs */}
      <div ref={tabsRef} role="tablist" aria-label="Commitment type" className="relative flex p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-5 isolate">
        <span ref={indicatorRef} aria-hidden="true" className="absolute inset-y-1 left-0 rounded-lg bg-white/[0.12] border border-white/15 shadow-sm pointer-events-none opacity-0" />
        {TYPES.map((t, index) => (
          <button
            key={t}
            ref={(element) => { tabButtonRefs.current[index] = element; }}
            type="button"
            onClick={() => setItemType(t)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            role="tab"
            id={`quick-add-tab-${t}`}
            aria-controls="quick-add-tab-panel"
            aria-selected={itemType === t}
            tabIndex={itemType === t ? 0 : -1}
            className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors duration-200 ${
              itemType === t
                ? 'text-white'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div ref={panelRef} id="quick-add-tab-panel" role="tabpanel" aria-labelledby={`quick-add-tab-${itemType}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Title`}
          placeholder={`e.g. ${itemType === 'project' ? 'Nemo Redesign' : itemType === 'assignment' ? 'Algorithm Analysis' : 'Finish auth flow'}`}
          value={title}
          onChange={(e) => updateDraft({ title: e.target.value })}
          autoFocus={isOpen}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due / Target Date"
            type="date"
            value={dueDate}
            onChange={(e) => updateDraft({ dueDate: e.target.value })}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => updateDraft({ priority: e.target.value as Priority })}
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
            onChange={(e) => updateDraft({ selectedProjectId: e.target.value })}
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
              onChange={(e) => updateDraft({ selectedSubjectId: e.target.value })}
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
          onChange={(e) => updateDraft({ description: e.target.value })}
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
      </div>
      </div>
    </Modal>
  );
};
