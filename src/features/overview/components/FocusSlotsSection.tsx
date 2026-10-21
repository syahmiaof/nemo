import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, ArrowUpRight, Target, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';
import {
  animateTaskCompletionPop,
  animateFocusTicketsEntrance,
  animateTicketRemoval,
} from '../motion/overviewMotion';
import type { Task, Project, FocusSelection } from '@/domain/types';

interface FocusSlotsSectionProps {
  focused: Task[];
  projects: Project[];
  selections: FocusSelection[];
  openTasks: Task[];
  onComplete: (task: Task) => Promise<void>;
  onRemoveFocus: (taskId: string) => Promise<void>;
  onAddFocus: (taskId: string) => void;
}

export const FocusSlotsSection: React.FC<FocusSlotsSectionProps> = ({
  focused,
  projects,
  openTasks,
  onComplete,
  onRemoveFocus,
  onAddFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Cascading ticket deal entrance
  useGSAP(
    () => {
      if (reduced || !stackRef.current) return;
      animateFocusTicketsEntrance(stackRef.current);
    },
    { scope: containerRef, dependencies: [focused.map((f) => f.id).join(','), reduced] }
  );

  const handleComplete = async (e: React.MouseEvent<HTMLButtonElement>, task: Task) => {
    animateTaskCompletionPop(e.currentTarget);
    await onComplete(task);
  };

  const handleRemove = (task: Task, element: HTMLElement) => {
    setRemovingIds((prev) => new Set(prev).add(task.id));
    animateTicketRemoval(element, async () => {
      await onRemoveFocus(task.id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    });
  };

  return (
    <section
      ref={containerRef}
      className="glass-panel focus-panel"
      data-enter
      aria-labelledby="focus-title"
    >
      <div className="panel-heading">
        <h2 id="focus-title">Today's focus</h2>
        <span className="panel-meta">{focused.length} of 3 active slots</span>
        <Link to="/tasks" className="icon-button" aria-label="Manage tasks">
          <ArrowUpRight size={20} />
        </Link>
      </div>

      <div ref={stackRef} className="focus-stack">
        {focused.map((task, index) => {
          const project = projects.find((p) => p.id === task.parentId);
          return (
            <article
              className={`focus-ticket tone-${index % 3}`}
              key={task.id}
              id={`ticket-${task.id}`}
              style={{
                pointerEvents: removingIds.has(task.id) ? 'none' : 'auto',
              }}
            >
              <div className="ticket-meta">
                <span className="ticket-badge">
                  <Target size={13} />
                  #{String(index + 1).padStart(2, '0')} · ⏱ {task.estimatedMinutes || 25} min
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${task.title} from focus`}
                  onClick={(e) => {
                    const article = e.currentTarget.closest<HTMLElement>('.focus-ticket');
                    if (article) handleRemove(task, article);
                  }}
                  className="ticket-remove"
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="ticket-title">{task.title}</h3>

              <div className="ticket-context">
                <span>{project ? project.title : 'Standalone focus'}</span>
                <span className="ticket-priority-tag">{task.priority}</span>
              </div>

              <div className="ticket-bottom">
                <span className="ticket-status-label">
                  {task.status === 'in_progress' ? 'In progress' : 'Focus slot'}
                </span>
                <button
                  type="button"
                  className="ticket-complete"
                  onClick={(e) => void handleComplete(e, task)}
                  aria-label={`Complete ${task.title}`}
                >
                  <Check size={18} strokeWidth={2.8} />
                </button>
              </div>
            </article>
          );
        })}

        {focused.length === 0 && (
          <div className="focus-empty">
            <Target size={24} />
            <h3>One thing at a time.</h3>
            <p>Choose up to three tasks and give them your complete focus.</p>
          </div>
        )}

        {focused.length < 3 && (
          <div className="focus-slot-picker">
            <label htmlFor="focus-choice" className="sr-only">
              Add task to focus
            </label>
            <div className="focus-picker-inner">
              <Plus size={16} className="text-content-secondary" />
              <select
                id="focus-choice"
                value=""
                onChange={(e) => {
                  if (e.target.value) onAddFocus(e.target.value);
                }}
                className="focus-picker-select"
              >
                <option value="">+ Assign next focus task…</option>
                {openTasks
                  .filter((t) => !focused.some((f) => f.id === t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
