import React, { useState, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Plus, Check, Trash2, ListChecks, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/design/useReducedMotion';
import { db } from '@/db/nemoDb';
import type { Task } from '@/domain/types';

gsap.registerPlugin(useGSAP);

export interface SubtaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface SubtaskSectionProps {
  task: Task;
  isOpenDefault?: boolean;
}

/**
 * Parses markdown-style checklist lines from task.notes:
 * e.g. "- [ ] Design wireframes" or "- [x] Setup repository"
 * Also preserves any general non-subtask notes.
 */
export function parseNotesSubtasks(notes?: string): {
  subtasks: SubtaskItem[];
  otherNotes: string[];
} {
  if (!notes) return { subtasks: [], otherNotes: [] };

  const lines = notes.split('\n');
  const subtasks: SubtaskItem[] = [];
  const otherNotes: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const checkboxMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkboxMatch) {
      subtasks.push({
        id: `sub_${index}_${line.length}`,
        completed: checkboxMatch[1].toLowerCase() === 'x',
        text: checkboxMatch[2].trim(),
      });
    } else {
      otherNotes.push(line);
    }
  });

  return { subtasks, otherNotes };
}

/**
 * Serializes subtasks and other notes back into canonical notes string.
 */
export function serializeNotesSubtasks(subtasks: SubtaskItem[], otherNotes: string[]): string {
  const subtaskLines = subtasks.map(
    (st) => `- [${st.completed ? 'x' : ' '}] ${st.text}`
  );
  const parts: string[] = [];

  const otherTrimmed = otherNotes.join('\n').trim();
  if (otherTrimmed) {
    parts.push(otherTrimmed);
  }
  if (subtaskLines.length > 0) {
    parts.push(subtaskLines.join('\n'));
  }

  return parts.join('\n\n').trim();
}

export const SubtaskSection: React.FC<SubtaskSectionProps> = ({ task }) => {
  const reduced = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { subtasks, otherNotes } = useMemo(
    () => parseNotesSubtasks(task.notes),
    [task.notes]
  );

  const totalCount = subtasks.length;
  const completedCount = subtasks.filter((st) => st.completed).length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Animate progress bar fill smoothly
  useGSAP(
    () => {
      if (!progressBarRef.current) return;
      if (reduced) {
        gsap.set(progressBarRef.current, { width: `${progressPercent}%` });
        return;
      }
      gsap.to(progressBarRef.current, {
        width: `${progressPercent}%`,
        duration: 0.45,
        ease: 'power2.out',
      });
    },
    { dependencies: [progressPercent, reduced], scope: containerRef }
  );

  // Accordion toggle animation
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (reduced || !contentRef.current) return;

    if (nextState) {
      gsap.fromTo(
        contentRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.35, ease: 'power3.out' }
      );
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });
    }
  };

  const handleToggleSubtask = async (
    index: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const isNowCompleted = !subtasks[index].completed;

    if (!reduced && isNowCompleted) {
      // Micro celebratory bounce on the subtask checkbox
      gsap.fromTo(
        button,
        { scale: 0.75, rotate: -10 },
        { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2.5)' }
      );
    }

    const updated = subtasks.map((st, i) =>
      i === index ? { ...st, completed: isNowCompleted } : st
    );
    const newNotes = serializeNotesSubtasks(updated, otherNotes);

    await db.tasks.update(task.id, {
      notes: newNotes || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newSubtaskText.trim()) return;

    const updated = [
      ...subtasks,
      {
        id: `st_${Date.now()}`,
        text: newSubtaskText.trim(),
        completed: false,
      },
    ];
    const newNotes = serializeNotesSubtasks(updated, otherNotes);

    setNewSubtaskText('');
    setIsAdding(false);

    await db.tasks.update(task.id, {
      notes: newNotes,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteSubtask = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subtasks.filter((_, i) => i !== index);
    const newNotes = serializeNotesSubtasks(updated, otherNotes);

    await db.tasks.update(task.id, {
      notes: newNotes || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  // If no subtasks exist yet and not expanded, show subtle "+ Subtasks" affordance
  if (totalCount === 0 && !isAdding) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
            setIsAdding(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="inline-flex items-center gap-1.5 text-[11px] text-content-tertiary hover:text-accent-mint transition-colors font-mono py-0.5 px-1.5 rounded hover:bg-white/[0.04]"
        >
          <Plus className="w-3 h-3" />
          <span>Add subtasks</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="subtask-section pt-2 border-t border-white/[0.06] mt-2">
      {/* Subtasks Summary Bar / Toggle */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={handleToggleExpand}
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors group cursor-pointer"
          aria-expanded={isExpanded}
        >
          <ListChecks className="w-3.5 h-3.5 text-accent-mint" />
          <span className="font-semibold text-[11px]">
            Subtasks ({completedCount}/{totalCount})
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-content-tertiary transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-content-primary' : ''
            }`}
          />
        </button>

        {/* Mini Progress Track */}
        <div className="flex items-center gap-2 flex-1 max-w-[130px]">
          <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden relative">
            <div
              ref={progressBarRef}
              className="h-full bg-accent-mint rounded-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-content-tertiary w-7 text-right">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Collapsible Subtasks Content */}
      <div
        ref={contentRef}
        style={{ height: isExpanded ? 'auto' : 0 }}
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'mt-2.5 opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-1.5 pl-1.5">
          {subtasks.map((st, index) => (
            <div
              key={st.id || index}
              className="group/st flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => handleToggleSubtask(index, e)}
                  aria-label={`Mark subtask "${st.text}" as ${
                    st.completed ? 'incomplete' : 'complete'
                  }`}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    st.completed
                      ? 'bg-accent-mint border-accent-mint text-[#080d19]'
                      : 'border-white/30 hover:border-accent-mint/80 bg-white/[0.04]'
                  }`}
                >
                  {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>
                <span
                  className={`text-xs truncate ${
                    st.completed
                      ? 'line-through text-content-tertiary'
                      : 'text-content-primary'
                  }`}
                >
                  {st.text}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteSubtask(index, e)}
                aria-label={`Delete subtask "${st.text}"`}
                className="opacity-0 group-hover/st:opacity-100 p-1 text-content-tertiary hover:text-accent-ember transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Inline Add Subtask Form */}
          {isAdding ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1.5">
              <input
                ref={inputRef}
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="New subtask title..."
                className="flex-1 px-2.5 py-1 text-xs bg-white/[0.05] border border-white/15 rounded-lg text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-accent-mint"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent-mint text-[#080d19] hover:bg-accent-mint/90 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSubtaskText('');
                }}
                className="px-2 py-1 text-xs text-content-tertiary hover:text-content-primary transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-content-tertiary hover:text-accent-mint transition-colors font-mono py-1 px-1.5 rounded hover:bg-white/[0.04] mt-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add another subtask</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
