import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowUpRight, Plus } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/design/useReducedMotion';
import { isScrollTriggerActive } from '../motion/overviewMotion';
import { formatShortDate } from '@/lib/dates';
import type { Goal, Milestone } from '@/domain/types';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface GoalsInMotionSectionProps {
  goalStats: {
    activeGoals: Goal[];
    completedGoals: Goal[];
    goalMilestones: Milestone[];
    doneMilestones: Milestone[];
    milestoneRate: number;
  };
  milestones: Milestone[];
}

export const GoalsInMotionSection: React.FC<GoalsInMotionSectionProps> = ({
  goalStats,
  milestones,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const targetIconRef = useRef<HTMLDivElement>(null);
  const mainBarRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const panel = panelRef.current;
      const targetIcon = targetIconRef.current;
      const mainBar = mainBarRef.current;
      const statsGrid = statsGridRef.current;
      const cardsGrid = cardsGridRef.current;

      if (!panel) return;

      if (reduced) {
        gsap.set(panel, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        if (mainBar) mainBar.style.width = `${goalStats.milestoneRate}%`;
        if (cardsGrid) {
          const miniBars = cardsGrid.querySelectorAll<HTMLElement>('.goal-mini-bar');
          miniBars.forEach((bar) => {
            const target = bar.getAttribute('data-rate') || '0';
            bar.style.width = `${target}%`;
          });
        }
        return;
      }

      const hasST = isScrollTriggerActive();
      // Bi-directional ScrollTrigger for panel
      const tl = gsap.timeline({
        scrollTrigger: hasST
          ? {
              trigger: panel,
              start: 'top 88%',
              end: 'bottom 12%',
              toggleActions: 'play reverse play reverse',
            }
          : undefined,
      });

      // 1. Panel lift
      tl.fromTo(
        panel,
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out', force3D: true },
        0
      );

      // 2. Target icon rotation & pop
      if (targetIcon) {
        tl.fromTo(
          targetIcon,
          { rotate: -35, scale: 0.75 },
          { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' },
          0.1
        );
      }

      // 3. Staggered ambition stat cards
      if (statsGrid) {
        const statCards = statsGrid.children;
        tl.fromTo(
          statCards,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' },
          0.15
        );
      }

      // 4. Main ambition progress bar fill
      if (mainBar) {
        tl.fromTo(
          mainBar,
          { width: '0%' },
          { width: `${goalStats.milestoneRate}%`, duration: 1.1, ease: 'power3.out' },
          0.2
        );
      }

      // 5. Goal spotlight cards & mini bars
      if (cardsGrid) {
        const goalCards = cardsGrid.querySelectorAll('.goal-spotlight-card');
        const miniBars = cardsGrid.querySelectorAll<HTMLElement>('.goal-mini-bar');

        if (goalCards.length > 0) {
          tl.fromTo(
            goalCards,
            { opacity: 0, y: 16, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out' },
            0.25
          );
        }

        miniBars.forEach((bar) => {
          const target = Number(bar.getAttribute('data-rate') || '0');
          tl.fromTo(
            bar,
            { width: '0%' },
            { width: `${target}%`, duration: 0.9, ease: 'power2.out' },
            0.35
          );
        });
      }
    },
    {
      scope: panelRef,
      dependencies: [
        goalStats.milestoneRate,
        goalStats.activeGoals.length,
        goalStats.doneMilestones.length,
        milestones.length,
        reduced,
      ],
      revertOnUpdate: true,
    }
  );

  return (
    <section
      ref={panelRef}
      className="glass-panel goals-motion-panel mt-6 p-6 rounded-2xl relative overflow-hidden"
      aria-labelledby="goals-motion-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            ref={targetIconRef}
            className="w-10 h-10 rounded-xl bg-accent-mint/15 border border-accent-mint/30 flex items-center justify-center text-accent-mint"
          >
            <Target size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="goals-motion-title" className="text-base font-bold text-content-primary">
                Goals in motion
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                {goalStats.activeGoals.length} Active
              </span>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Every milestone achieved brings your vision one step closer to reality.
            </p>
          </div>
        </div>

        <Link
          to="/goals"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border-subtle text-xs font-semibold text-content-primary hover:text-accent-mint transition-colors"
        >
          <span>Explore all goals</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Ambition Progress Bar & Stats */}
      <div ref={statsGridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
          <span className="text-[11px] text-content-tertiary font-medium">Active Ambitions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-bold text-content-primary">
              {goalStats.activeGoals.length}
            </strong>
            <span className="text-xs text-content-secondary font-mono">goals ongoing</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
          <span className="text-[11px] text-content-tertiary font-medium">Milestones Reached</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-bold text-accent-mint">
              {goalStats.doneMilestones.length}
            </strong>
            <span className="text-xs text-content-secondary font-mono">
              of {goalStats.goalMilestones.length} total
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-content-tertiary">
            <span className="font-medium">Overall Ambition Rate</span>
            <span className="font-mono text-content-primary font-semibold">
              {goalStats.milestoneRate}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden mt-2">
            <div
              ref={mainBarRef}
              className="h-full rounded-full transition-all duration-700 shadow-sm"
              style={{
                width: reduced ? `${goalStats.milestoneRate}%` : '0%',
                background: 'linear-gradient(90deg, #A8DCC8 0%, #EFB2A2 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Goal Spotlight Cards */}
      {goalStats.activeGoals.length > 0 ? (
        <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goalStats.activeGoals.slice(0, 3).map((goal) => {
            const gMilestones = milestones.filter(
              (m) => m.ownerType === 'goal' && m.ownerId === goal.id
            );
            const gDone = gMilestones.filter((m) => m.completedAt).length;
            const gRate =
              gMilestones.length > 0 ? Math.round((gDone / gMilestones.length) * 100) : 0;
            const nextPending = gMilestones.find((m) => !m.completedAt);

            return (
              <div
                key={goal.id}
                className="goal-spotlight-card p-4 rounded-xl bg-surface-solid/80 border border-white/[0.08] hover:border-accent-mint/40 transition-colors flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {goal.category ? (
                      <span className="text-[10px] font-mono tracking-wider uppercase text-accent-mint font-semibold">
                        {goal.category}
                      </span>
                    ) : (
                      <span className="text-[10px] text-content-tertiary font-mono">General</span>
                    )}
                    {goal.targetDate && (
                      <span className="text-[10px] text-content-tertiary font-mono">
                        Target: {formatShortDate(goal.targetDate)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-content-primary group-hover:text-accent-mint transition-colors line-clamp-1">
                    {goal.title}
                  </h3>
                  {goal.why && (
                    <p className="text-xs text-content-secondary line-clamp-2 mt-1 italic opacity-80">
                      "{goal.why}"
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px] text-content-tertiary">
                    <span className="truncate max-w-[160px]">
                      {nextPending
                        ? `Next: ${nextPending.title}`
                        : gMilestones.length > 0
                        ? 'All milestones achieved!'
                        : 'No milestones set'}
                    </span>
                    <span className="font-mono text-content-primary font-semibold shrink-0">
                      {gDone}/{gMilestones.length} ({gRate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="goal-mini-bar h-full rounded-full transition-all duration-500 bg-accent-mint"
                      data-rate={gRate}
                      style={{ width: reduced ? `${gRate}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-content-secondary">
            Set your first high-level ambition and break it into achievable milestones.
          </p>
          <Link
            to="/goals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>Set a Goal</span>
          </Link>
        </div>
      )}
    </section>
  );
};
