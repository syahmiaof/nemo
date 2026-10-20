import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Target, Plus, Calendar } from 'lucide-react';
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
import type { GoalStatus } from '@/domain/types';

export const GoalsPage: React.FC = () => {
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | GoalStatus>('all');

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative z-10">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-accent-mint">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content-primary">Long-term Goals</h2>
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

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-white/[0.08] pb-1 overflow-x-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const goalMilestones = milestones.filter((m) => m.ownerId === goal.id);
            let progressLabel = 'No measurable milestones yet';
            let percent: number | null = null;

            if (goalMilestones.length > 0) {
              const completed = goalMilestones.filter((m) => m.completedAt).length;
              percent = Math.round((completed / goalMilestones.length) * 100);
              progressLabel = `${completed}/${goalMilestones.length} milestones (${percent}%)`;
            }

            return (
              <Link
                key={goal.id}
                to={`/goals/${goal.id}`}
                className="p-5 rounded-2xl glass-panel relative group hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-sm"
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

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-[11px] text-content-tertiary">
                    <span>Progress</span>
                    <span className="font-mono">{progressLabel}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
                    {percent !== null && (
                      <div
                        className="h-full bg-accent-mint rounded-full transition-all"
                        style={{ width: `${percent}%` }}
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
          })}
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
