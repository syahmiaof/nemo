import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Calendar,
  Edit2,
  Trash2,
  FolderGit2,
  GraduationCap,
  Target,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDisplayDate, isOverdue } from '@/lib/dates';
import { formatClockTime } from '@/lib/timeFormat';
import { useReducedMotion } from '@/design/useReducedMotion';
import { SubtaskSection } from './SubtaskSection';
import type { Task } from '@/domain/types';

gsap.registerPlugin(useGSAP);

export interface TaskItemProps {
  task: Task;
  isFocused?: boolean;
  hourFormat: '12h' | '24h';
  projectTitle?: string;
  assignmentTitle?: string;
  goalTitle?: string;
  onToggleStatus: (task: Task, e: React.MouseEvent<HTMLButtonElement>) => void;
  onEdit: (task: Task) => void;
  onDeleteRequest: (task: Task, triggerExitAnimation: () => Promise<void>) => void;
  onActivate?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isFocused,
  hourFormat,
  projectTitle,
  assignmentTitle,
  goalTitle,
  onToggleStatus,
  onEdit,
  onDeleteRequest,
  onActivate,
}) => {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const checkboxBtnRef = useRef<HTMLButtonElement>(null);
  const checkTickRef = useRef<SVGPathElement>(null);
  const rippleRef = useRef<SVGCircleElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  const isDone = task.status === 'done';
  const isWatchlist = Boolean(task.isWatchlist || task.tags.includes('watchlist'));
  const isTaskOverdue = Boolean(!isWatchlist && task.dueDate && isOverdue(task.dueDate) && !isDone);

  // Determine parent badge
  let parentLabel: string | undefined;
  let ParentIcon = FolderGit2;
  if (task.parentType === 'project' && projectTitle) {
    parentLabel = projectTitle;
    ParentIcon = FolderGit2;
  } else if (task.parentType === 'assignment' && assignmentTitle) {
    parentLabel = assignmentTitle;
    ParentIcon = GraduationCap;
  } else if (task.parentType === 'goal' && goalTitle) {
    parentLabel = goalTitle;
    ParentIcon = Target;
  }

  // 1. Bi-directional scroll-driven in/out animation using IntersectionObserver + GSAP
  useEffect(() => {
    const card = cardRef.current;
    if (!card || reduced) return;

    // Track scroll direction & state
    let hasEnteredOnce = false;
    let isCurrentlyVisible = false;

    // Check if card is already in the viewport on mount
    const rect = card.getBoundingClientRect();
    const inInitialView = rect.top < window.innerHeight && rect.bottom > 0;

    if (!inInitialView) {
      gsap.set(card, { opacity: 0, y: 18, scale: 0.985 });
    } else {
      hasEnteredOnce = true;
      isCurrentlyVisible = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isCurrentlyVisible) {
              isCurrentlyVisible = true;
              hasEnteredOnce = true;
              gsap.killTweensOf(card);
              gsap.to(card, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.45,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
              });
            }
          } else {
            // Bi-directional exit: when scrolled past viewport, smoothly tuck
            if (hasEnteredOnce && isCurrentlyVisible) {
              isCurrentlyVisible = false;
              const currentRect = card.getBoundingClientRect();
              const exitY = currentRect.top < 0 ? -12 : 16;
              gsap.killTweensOf(card);
              gsap.to(card, {
                opacity: 0.25,
                y: exitY,
                scale: 0.985,
                duration: 0.35,
                ease: 'power2.in',
              });
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    observer.observe(card);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(card);
    };
  }, [reduced]);

  // 2. Interactive checkbox completion animation (custom tick draw & celebratory pulse)
  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!reduced) {
      const nextDone = !isDone;
      const btn = checkboxBtnRef.current;
      const tick = checkTickRef.current;
      const ripple = rippleRef.current;

      if (nextDone) {
        // Celebratory pulse & pop on the button
        if (btn) {
          gsap.fromTo(
            btn,
            { scale: 0.75, rotate: -15 },
            { scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2.5)', overwrite: 'auto' }
          );
        }

        // Ripple expansion wave
        if (ripple) {
          gsap.fromTo(
            ripple,
            { r: 8, opacity: 0.8, strokeWidth: 2 },
            { r: 18, opacity: 0, strokeWidth: 0, duration: 0.5, ease: 'power2.out' }
          );
        }

        // Custom tick draw animation
        if (tick) {
          gsap.fromTo(
            tick,
            { strokeDashoffset: 24 },
            { strokeDashoffset: 0, duration: 0.32, ease: 'power2.out', delay: 0.05 }
          );
        }

        // Title strike-through glow & fade
        if (titleRef.current) {
          gsap.fromTo(
            titleRef.current,
            { opacity: 1 },
            { opacity: 0.65, duration: 0.3 }
          );
        }
      } else {
        // Uncheck animation: gentle recoil
        if (btn) {
          gsap.fromTo(
            btn,
            { scale: 0.88 },
            { scale: 1, duration: 0.25, ease: 'power2.out' }
          );
        }
        if (titleRef.current) {
          gsap.to(titleRef.current, { opacity: 1, duration: 0.25 });
        }
      }
    }

    onToggleStatus(task, e);
  };

  // 3. Smooth deletion exit animation
  const triggerExitAnimation = useCallback(async (): Promise<void> => {
    const card = cardRef.current;
    if (!card || reduced) return;

    return new Promise((resolve) => {
      gsap.to(card, {
        x: 28,
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
        overflow: 'hidden',
        duration: 0.28,
        ease: 'power2.inOut',
        onComplete: () => resolve(),
      });
    });
  }, [reduced]);

  const handleDeleteClick = () => {
    onDeleteRequest(task, triggerExitAnimation);
  };

  return (
    <div
      ref={cardRef}
      id={`task-${task.id}`}
      data-task-card
      className={`task-card flex flex-col justify-between p-3.5 rounded-2xl glass-panel relative group transition-all duration-200 gap-3 will-change-transform ${
        isFocused ? 'ring-2 ring-accent-mint border-accent-mint/50' : ''
      } ${
        isDone
          ? 'opacity-70 hover:opacity-90'
          : 'hover:border-white/20 hover:scale-[1.005]'
      }`}
    >
      {/* Top / Main Task Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Checkbox & Info */}
        <div className="flex items-start gap-3.5 min-w-0 relative z-10 flex-1">
          {/* Custom Animated Checkbox */}
          <button
            ref={checkboxBtnRef}
            type="button"
            onClick={handleToggleClick}
            className="text-white/40 hover:text-accent-mint transition-colors p-0.5 mt-0.5 flex-shrink-0 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-mint rounded-full"
            aria-label={`Mark task ${isDone ? 'incomplete' : 'complete'}`}
          >
            <svg
              className="w-5 h-5 overflow-visible"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Optional Celebratory Ripple */}
              <circle
                ref={rippleRef}
                cx="12"
                cy="12"
                r="0"
                className="stroke-accent-mint opacity-0 fill-none"
              />

              {/* Checkbox Outline / Circle */}
              <circle
                cx="12"
                cy="12"
                r="9"
                className={`transition-colors duration-200 ${
                  isDone
                    ? 'fill-accent-mint/20 stroke-accent-mint'
                    : 'stroke-white/40 group-hover:stroke-accent-mint/70'
                }`}
                strokeWidth="2"
              />

              {/* Tick Path with stroke-dasharray animation */}
              <path
                ref={checkTickRef}
                d="M8 12.2l2.8 2.8 5.4-5.6"
                className={`stroke-accent-mint transition-opacity duration-200 ${
                  isDone ? 'opacity-100' : 'opacity-0'
                }`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset={isDone ? '0' : '24'}
              />
            </svg>
          </button>

          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                ref={titleRef}
                className={`text-sm font-semibold truncate transition-all ${
                  isDone
                    ? 'line-through text-content-tertiary'
                    : 'text-content-primary'
                }`}
              >
                {task.title}
              </span>

              {isWatchlist && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 font-mono flex-shrink-0">
                  <Bookmark className="w-3 h-3 text-sky-400" />
                  Watchlist
                </span>
              )}

              {parentLabel && (
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-content-secondary font-mono truncate max-w-[160px]">
                  <ParentIcon className="w-3 h-3 text-accent-mint" />
                  <span className="truncate">{parentLabel}</span>
                </span>
              )}
            </div>

            {task.notes && (
              <p className="text-xs text-content-secondary line-clamp-1">
                {task.notes}
              </p>
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
                  {task.dueTime && (
                    <span>at {formatClockTime(task.dueTime, hourFormat)}</span>
                  )}
                </span>
              )}

              {task.tags.length > 0 && <span>#{task.tags.join(' #')}</span>}
            </div>
          </div>
        </div>

        {/* Right: Badges & Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center relative z-10 flex-shrink-0">
          {onActivate && isWatchlist && !isDone && (
            <button
              type="button"
              onClick={() => onActivate(task)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Activate task to Today's queue"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Activate</span>
            </button>
          )}

          <PriorityBadge priority={task.priority} size="sm" />
          <StatusBadge status={task.status} size="sm" />

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-white/[0.08] transition-colors"
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-accent-ember hover:bg-white/[0.08] transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Subtasks Section */}
      <SubtaskSection task={task} />
    </div>
  );
};
