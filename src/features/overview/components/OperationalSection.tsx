import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, Activity, ArrowUpRight, Check, CheckCircle2 } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/design/useReducedMotion';
import { formatShortDate } from '@/lib/dates';
import { animateTaskCompletionPop } from '../motion/overviewMotion';
import type { Task, Assignment } from '@/domain/types';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface OperationalSectionProps {
  nextTasks: Task[];
  academic: Assignment[];
  recentCompleted: Task[];
  onComplete: (task: Task) => Promise<void>;
}

export const OperationalSection: React.FC<OperationalSectionProps> = ({
  nextTasks,
  academic,
  recentCompleted,
  onComplete,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;

      if (reduced) {
        gsap.set(grid, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        const panels = grid.querySelectorAll('.operational-panel');
        gsap.set(panels, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        return;
      }

      const panels = grid.querySelectorAll('.operational-panel');

      const hasST = typeof window !== 'undefined' && typeof ScrollTrigger !== 'undefined';
      const tl = gsap.timeline({
        scrollTrigger: hasST
          ? {
              trigger: grid,
              start: 'top 88%',
              end: 'bottom 10%',
              toggleActions: 'play reverse play reverse',
            }
          : undefined,
      });

      // 1. Stagger panels in
      tl.fromTo(
        panels,
        { opacity: 0, y: 20, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.09,
          ease: 'power3.out',
          force3D: true,
        },
        0
      );

      // 2. Cascade list items within panels
      panels.forEach((panel, pIdx) => {
        const rows = panel.querySelectorAll(
          '.commitment-row, .academic-deadline, .activity-row, .empty-copy'
        );
        if (rows.length > 0) {
          tl.fromTo(
            rows,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.04,
              ease: 'power2.out',
            },
            0.15 + pIdx * 0.05
          );
        }
      });
    },
    {
      scope: gridRef,
      dependencies: [nextTasks.length, academic.length, recentCompleted.length, reduced],
      revertOnUpdate: true,
    }
  );

  const handleTaskComplete = (e: React.MouseEvent<HTMLButtonElement>, task: Task) => {
    animateTaskCompletionPop(e.currentTarget);
    void onComplete(task);
  };

  return (
    <div ref={gridRef} className="overview-bottom-grid">
      {/* Column 1: Upcoming Tasks */}
      <section className="glass-panel operational-panel" aria-labelledby="commitments-title">
        <div className="panel-heading">
          <h2 id="commitments-title">Coming into view</h2>
          <Link to="/calendar" className="icon-button" aria-label="Open calendar">
            <CalendarDays size={18} />
          </Link>
        </div>
        <div className="operational-list">
          {nextTasks.map((t) => (
            <div className="commitment-row" key={t.id}>
              <button
                type="button"
                className="completion-ring"
                aria-label={`Complete ${t.title}`}
                onClick={(e) => handleTaskComplete(e, t)}
              >
                <Check size={14} />
              </button>
              <Link to="/tasks" className="commitment-text">
                <span className="commitment-title">{t.title}</span>
                <span className="commitment-meta">
                  {t.dueDate ? formatShortDate(t.dueDate) : 'No deadline'} · {t.priority} priority
                </span>
              </Link>
              <ArrowUpRight size={16} className="commitment-arrow" />
            </div>
          ))}
          {nextTasks.length === 0 && (
            <p className="empty-copy">You're all clear. Capture your next task when you're ready.</p>
          )}
        </div>
      </section>

      {/* Column 2: Academic Deadlines */}
      <section className="glass-panel operational-panel" aria-labelledby="study-title">
        <div className="panel-heading">
          <h2 id="study-title">On the study desk</h2>
          <Link to="/academics" className="icon-button" aria-label="Open academics">
            <GraduationCap size={18} />
          </Link>
        </div>
        <div className="operational-list">
          {academic.map((a) => (
            <Link className="academic-deadline" key={a.id} to={`/academics/assignments/${a.id}`}>
              <span className="deadline-date">{formatShortDate(a.dueDate)}</span>
              <div className="academic-copy">
                <h3>{a.title}</h3>
                <p>{String(a.status).replace(/_/g, ' ')}</p>
              </div>
              <ArrowUpRight size={16} className="commitment-arrow" />
            </Link>
          ))}
          {academic.length === 0 && (
            <p className="empty-copy">
              No outstanding coursework. Your next deadline will appear here.
            </p>
          )}
        </div>
      </section>

      {/* Column 3: Workspace Activity Stream */}
      <section className="glass-panel operational-panel" aria-labelledby="activity-title">
        <div className="panel-heading">
          <h2 id="activity-title">Recent activity</h2>
          <div className="icon-button" aria-hidden="true">
            <Activity size={18} />
          </div>
        </div>
        <div className="operational-list">
          {recentCompleted.map((t) => (
            <div className="activity-row" key={t.id}>
              <div className="activity-icon-wrap">
                <CheckCircle2 size={16} className="text-[#a8dcc8]" />
              </div>
              <div className="activity-copy">
                <p className="activity-title">Completed: {t.title}</p>
                <span className="activity-timestamp">
                  {t.completedAt
                    ? new Date(t.completedAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>
          ))}
          {recentCompleted.length === 0 && (
            <p className="empty-copy">Activity records will appear here as you complete work.</p>
          )}
        </div>
      </section>
    </div>
  );
};
