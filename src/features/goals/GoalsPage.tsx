import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Target, Plus, Calendar, Compass } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { generateId } from '@/lib/ids';
import { formatDisplayDate } from '@/lib/dates';
import type { GoalStatus, Goal, Milestone } from '@/domain/types';
import { MotionTitle } from '@/components/ui/MotionTitle';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';
import { useScrollMotion } from '@/design/useScrollMotion';

gsap.registerPlugin(useGSAP);

interface GoalCardItemProps {
  goal: Goal;
  milestones: Milestone[];
  reduced: boolean;
}

const GoalCardItem: React.FC<GoalCardItemProps> = ({ goal, milestones, reduced }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const goalMilestones = useMemo(
    () => milestones.filter((m) => m.ownerId === goal.id),
    [milestones, goal.id]
  );

  let progressLabel = 'No measurable milestones yet';
  let percent: number | null = null;

  if (goalMilestones.length > 0) {
    const completed = goalMilestones.filter((m) => m.completedAt || (m as any).completed).length;
    percent = Math.round((completed / goalMilestones.length) * 100);
    progressLabel = `${completed}/${goalMilestones.length} milestones (${percent}%)`;
  }

  useEffect(() => {
    const cardEl = cardRef.current;
    const barEl = progressBarRef.current;
    if (!cardEl || !barEl || percent === null) return;

    if (reduced) {
      barEl.style.width = `${percent}%`;
      return;
    }

    // Bi-directional observer for milestone progress bar animation
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            barEl,
            { width: '0%' },
            {
              width: `${percent}%`,
              duration: 0.95,
              ease: 'power3.out',
              delay: 0.12,
              overwrite: 'auto',
            }
          );
          hasAnimated.current = true;
        } else if (hasAnimated.current) {
          // Bi-directional reset when leaving viewport so scrolling back animates again
          gsap.set(barEl, { width: '0%' });
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(cardEl);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(barEl);
    };
  }, [percent, reduced]);

  return (
    <Link
      ref={cardRef}
      key={goal.id}
      to={`/goals/${goal.id}`}
      className="goal-card p-5 rounded-2xl glass-panel relative group hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-sm"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          {goal.category && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent-mint font-semibold">
              {goal.category}
            </span>
          )}
          <StatusBadge status={goal.status} size="sm" />
        </div>

        <h3 className="text-base font-bold text-content-primary group-hover:text-accent-mint transition-colors">
          {goal.title}
        </h3>

        {goal.why && (
          <p className="text-xs text-content-secondary line-clamp-2 mt-1.5 italic">
            "{goal.why}"
          </p>
        )}
      </div>

      {/* Milestone progress bar */}
      <div className="space-y-1.5 pt-2 border-t border-border-subtle">
        <div className="flex items-center justify-between text-[11px] text-content-tertiary">
          <span>Progress</span>
          <span className="font-mono">{progressLabel}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
          {percent !== null && (
            <div
              ref={progressBarRef}
              className="h-full bg-accent-mint rounded-full"
              style={{ width: reduced ? `${percent}%` : '0%' }}
            />
          )}
        </div>
      </div>

      {/* Target Date */}
      {goal.targetDate && (
        <div className="text-[11px] font-mono text-content-tertiary flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-content-secondary" />
          <span>Target: {formatDisplayDate(goal.targetDate)}</span>
        </div>
      )}
    </Link>
  );
};

export const GoalsPage: React.FC = () => {
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | GoalStatus>('all');
  const pageRootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Form states
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [targetDate, setTargetDate] = useState('');

  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.where('ownerType').equals('goal').toArray(), []) || [];

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Title required');
      return;
    }
    const now = new Date().toISOString();
    await db.goals.add({
      id: generateId('goal'),
      title: title.trim(),
      why: why.trim() || undefined,
      category: category.trim() || undefined,
      status,
      targetDate: targetDate || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setTitle('');
    setWhy('');
    setCategory('');
    setTargetDate('');
    setIsModalOpen(false);
    success('Goal created');
  };

  const filteredGoals = goals.filter((g) => {
    if (activeTab !== 'all' && g.status !== activeTab) return false;
    return true;
  });

  // Ambition stats derivation
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const achievedGoalsCount = goals.filter((g) => g.status === 'achieved').length;
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.completedAt || (m as any).completed).length;
  const overallMilestoneRate = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : (goals.length > 0 ? Math.round((achievedGoalsCount / goals.length) * 100) : 0);

  // Entrance animation for Header, Ambition banner, and Status filter buttons
  useGSAP(() => {
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.page-toolbar', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(
        '.ambition-banner',
        { opacity: 0, y: 16, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55 },
        '-=0.3'
      )
      .fromTo(
        '.ambition-overall-progress',
        { width: '0%' },
        { width: `${overallMilestoneRate}%`, duration: 0.85, ease: 'power2.out' },
        '-=0.25'
      )
      .fromTo(
        '.page-filters button',
        { opacity: 0, y: 10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.04 },
        '-=0.35'
      );
  }, { scope: pageRootRef, dependencies: [reduced, overallMilestoneRate], revertOnUpdate: true });

  // Bi-directional scroll reveal for goal cards
  const cardsGridRef = useScrollMotion<HTMLDivElement>({
    selector: '.goal-card',
    stagger: 0.05,
    y: 24,
    scale: 0.97,
    duration: 0.6,
    ease: 'power3.out',
    bidirectional: true,
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px',
    key: `${activeTab}:${filteredGoals.map((g) => g.id).join(',')}`,
  });

  return (
    <div ref={pageRootRef} className="goals-page space-y-6">
      {/* Header Toolbar */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-accent-mint">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <MotionTitle as="h2" text="Long-term Goals" className="text-lg font-bold text-content-primary" />
            <p className="text-xs text-content-secondary">
              Track major objectives, measure progress through verified milestones, and connect everyday tasks.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </Button>
      </div>

      {/* Ambition Banner */}
      <div className="ambition-banner p-5 sm:p-6 rounded-2xl glass-panel relative overflow-hidden border border-white/10 bg-gradient-to-br from-surface-subtle via-surface/60 to-surface-subtle/80 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-mint/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-mint/10 border border-accent-mint/20 text-accent-mint text-[11px] font-semibold tracking-wide uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>Ambition & Milestones</span>
            </div>
            <h3 className="text-lg font-bold text-content-primary">
              Turn long-range vision into verified momentum.
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Action gives ambition its shape. Break high-level aspirations into concrete, measurable checkpoints and track verified progress over time.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
              <span className="text-[11px] text-content-tertiary font-medium">Active</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <strong className="text-xl font-bold text-content-primary">{activeGoalsCount}</strong>
                <span className="text-[11px] text-content-secondary">ongoing</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
              <span className="text-[11px] text-content-tertiary font-medium">Achieved</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <strong className="text-xl font-bold text-accent-mint">{achievedGoalsCount}</strong>
                <span className="text-[11px] text-content-secondary">goals</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
              <span className="text-[11px] text-content-tertiary font-medium">Milestones</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <strong className="text-xl font-bold text-content-primary">{overallMilestoneRate}%</strong>
                <span className="text-[11px] text-content-secondary">{completedMilestones}/{totalMilestones}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Ambition Progress track */}
        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="ambition-overall-progress h-full bg-gradient-to-r from-accent-mint to-chart-peach rounded-full"
              style={{ width: reduced ? `${overallMilestoneRate}%` : '0%' }}
            />
          </div>
          <span className="text-[11px] font-mono text-content-tertiary shrink-0">
            {overallMilestoneRate}% overall
          </span>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="page-filters flex flex-wrap gap-1.5 pb-1">
        {(['all', 'active', 'planned', 'paused', 'achieved'] as const).map((tab) => {
          const count = goals.filter((g) => (tab === 'all' ? true : g.status === tab)).length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all capitalize whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.1] text-white border border-white/15 shadow-sm'
                  : 'text-content-secondary hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-white/[0.15] text-white' : 'bg-white/[0.05] text-content-tertiary'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals found"
          description="Define clear goals, attach measurable milestones, and associate existing tasks without cloning data."
          actionLabel="Add Goal"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCardItem
              key={goal.id}
              goal={goal}
              milestones={milestones}
              reduced={reduced}
            />
          ))}
        </div>
      )}

      {/* Goal Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Goal">
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label="Goal Title"
            placeholder="e.g. Master Full-Stack Rust & TypeScript"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              placeholder="e.g. Career, Health, Academic"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'planned', label: 'Planned' },
                { value: 'paused', label: 'Paused' },
                { value: 'achieved', label: 'Achieved' },
              ]}
            />
          </div>

          <Input
            label="Target Completion Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <Textarea
            label="Why this goal matters (Motivation)"
            placeholder="Articulate why achieving this matters to your personal roadmap..."
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Goal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
