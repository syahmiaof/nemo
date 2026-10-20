import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Link2,
} from 'lucide-react';
import { db, atomicDeleteGoal } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDisplayDate } from '@/lib/dates';
import { generateId } from '@/lib/ids';
import type { Milestone, GoalStatus } from '@/domain/types';

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLinkTaskModalOpen, setIsLinkTaskModalOpen] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editWhy, setEditWhy] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState<GoalStatus>('active');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Milestone inline
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  // Task linking
  const [selectedTaskIdToLink, setSelectedTaskIdToLink] = useState('');

  const goal = useLiveQuery(() => (id ? db.goals.get(id) : undefined), [id]);
  const milestones = useLiveQuery(
    () => (id ? db.milestones.where('ownerId').equals(id).sortBy('order') : []),
    [id]
  ) || [];
  const goalTaskLinks = useLiveQuery(
    () => (id ? db.goalTaskLinks.where('goalId').equals(id).toArray() : []),
    [id]
  ) || [];
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];

  const linkedTaskIds = goalTaskLinks.map((l) => l.taskId);
  const linkedTasks = allTasks.filter((t) => linkedTaskIds.includes(t.id));
  const unlinkedTasks = allTasks.filter((t) => !linkedTaskIds.includes(t.id));

  React.useEffect(() => {
    if (goal) {
      setEditTitle(goal.title);
      setEditWhy(goal.why || '');
      setEditCategory(goal.category || '');
      setEditStatus(goal.status);
      setEditTargetDate(goal.targetDate || '');
    }
  }, [goal]);

  if (!goal) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-content-secondary">This goal is not stored on this device.</p>
        <Link to="/goals">
          <Button variant="secondary" size="sm">
            Back to Goals
          </Button>
        </Link>
      </div>
    );
  }

  // Derive genuine progress
  let progressPercent: number | null = null;
  let progressLabel = 'No measurable milestones yet';

  if (milestones.length > 0) {
    const completed = milestones.filter((m) => m.completedAt).length;
    progressPercent = Math.round((completed / milestones.length) * 100);
    progressLabel = `${completed}/${milestones.length} milestones achieved (${progressPercent}%)`;
  }

  const handleToggleMilestone = async (m: Milestone) => {
    const completedAt = m.completedAt ? undefined : new Date().toISOString();
    await db.milestones.update(m.id, { completedAt });
    success('Milestone updated');
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !id) return;
    await db.milestones.add({
      id: generateId('ms'),
      ownerType: 'goal',
      ownerId: id,
      title: milestoneTitle.trim(),
      targetDate: milestoneDate || undefined,
      order: milestones.length,
    });
    setMilestoneTitle('');
    setMilestoneDate('');
    success('Milestone added');
  };

  const handleLinkTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskIdToLink || !id) return;
    await db.goalTaskLinks.add({
      id: generateId('gtl'),
      goalId: id,
      taskId: selectedTaskIdToLink,
      createdAt: new Date().toISOString(),
    });
    setSelectedTaskIdToLink('');
    setIsLinkTaskModalOpen(false);
    success('Task linked to goal without cloning');
  };

  const handleUnlinkTask = async (taskId: string) => {
    if (!id) return;
    const link = goalTaskLinks.find((l) => l.taskId === taskId);
    if (link) {
      await db.goalTaskLinks.delete(link.id);
      success('Task unlinked');
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const now = new Date().toISOString();
    await db.goals.update(goal.id, {
      title: editTitle.trim(),
      why: editWhy.trim() || undefined,
      category: editCategory.trim() || undefined,
      status: editStatus,
      targetDate: editTargetDate || undefined,
      achievedAt: editStatus === 'achieved' ? now : undefined,
      updatedAt: now,
    });
    setIsEditOpen(false);
    success('Goal updated');
  };

  const handleDeleteGoal = async () => {
    await atomicDeleteGoal(db, goal.id);
    setIsDeleteOpen(false);
    success('Goal deleted');
    navigate('/goals');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/goals"
          className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goals</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setIsEditOpen(true)} className="gap-1.5">
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button size="sm" variant="danger" onClick={() => setIsDeleteOpen(true)} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Goal Summary Header */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel relative z-10 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {goal.category && (
                <span className="text-xs font-mono uppercase tracking-wider text-accent-mint font-semibold">
                  {goal.category}
                </span>
              )}
              <StatusBadge status={goal.status} size="sm" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-content-primary">{goal.title}</h1>
            {goal.why && (
              <p className="text-sm text-content-secondary mt-3 italic leading-relaxed">
                "{goal.why}"
              </p>
            )}
          </div>

          {goal.targetDate && (
            <div className="p-3 rounded-xl bg-surface-hover border border-border-subtle flex items-center gap-2 text-xs font-mono text-content-tertiary self-start">
              <Calendar className="w-4 h-4 text-accent-mint" />
              <span>Target: {formatDisplayDate(goal.targetDate)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="p-4 rounded-xl bg-surface-hover/50 border border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-content-secondary">
            <span className="font-semibold text-content-primary">Milestone Progress</span>
            <span className="font-mono">{progressLabel}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
            {progressPercent !== null && (
              <div
                className="h-full bg-accent-mint rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Linked Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Milestones */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-base font-bold text-content-primary">Key Milestones</h3>
            <span className="text-xs font-mono text-content-tertiary">
              {milestones.filter((m) => m.completedAt).length}/{milestones.length}
            </span>
          </div>

          <form onSubmit={handleAddMilestone} className="flex gap-2">
            <Input
              placeholder="Add key milestone..."
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="text-xs"
            />
            <Input
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
              className="w-36 text-xs"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {milestones.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">No measurable milestones yet.</p>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border-subtle"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleMilestone(m)}
                      className="text-content-tertiary hover:text-accent-mint p-0.5"
                    >
                      {m.completedAt ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        m.completedAt ? 'line-through text-content-tertiary' : 'text-content-primary'
                      }`}
                    >
                      {m.title}
                    </span>
                  </div>
                  {m.targetDate && (
                    <span className="text-[11px] font-mono text-content-tertiary">
                      {formatDisplayDate(m.targetDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Canonical Tasks (via GoalTaskLink, no cloning) */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-content-primary">Linked Tasks</h3>
              <p className="text-[11px] text-content-tertiary">Referenced from canonical tasks, never cloned.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setIsLinkTaskModalOpen(true)} className="gap-1 text-xs">
              <Link2 className="w-3.5 h-3.5" />
              <span>Link Task</span>
            </Button>
          </div>

          {linkedTasks.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">No existing tasks linked to this goal.</p>
          ) : (
            <div className="space-y-2">
              {linkedTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border-subtle"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-xs font-medium truncate ${
                        t.status === 'done' ? 'line-through text-content-tertiary' : 'text-content-primary'
                      }`}
                    >
                      {t.title}
                    </span>
                    <PriorityBadge priority={t.priority} size="sm" />
                  </div>

                  <button
                    onClick={() => handleUnlinkTask(t.id)}
                    className="text-xs text-content-tertiary hover:text-accent-ember transition-colors p-1"
                    title="Unlink from Goal"
                  >
                    Unlink
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link Existing Task Modal */}
      <Modal
        isOpen={isLinkTaskModalOpen}
        onClose={() => setIsLinkTaskModalOpen(false)}
        title="Link Existing Task to Goal"
        description="Select any task from your workspace to contribute to this goal."
      >
        <form onSubmit={handleLinkTask} className="space-y-4">
          {unlinkedTasks.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">
              All tasks are already linked or no tasks exist.
            </p>
          ) : (
            <Select
              label="Select Task"
              value={selectedTaskIdToLink}
              onChange={(e) => setSelectedTaskIdToLink(e.target.value)}
              options={[
                { value: '', label: '-- Choose a task --' },
                ...unlinkedTasks.map((t) => ({ value: t.id, label: t.title })),
              ]}
              required
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsLinkTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTaskIdToLink}>
              Link Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Goal">
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label="Goal Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
            <Select
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as GoalStatus)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'planned', label: 'Planned' },
                { value: 'paused', label: 'Paused' },
                { value: 'achieved', label: 'Achieved' },
              ]}
            />
          </div>

          <Input
            label="Target Date"
            type="date"
            value={editTargetDate}
            onChange={(e) => setEditTargetDate(e.target.value)}
          />

          <Textarea
            label="Why this goal matters"
            value={editWhy}
            onChange={(e) => setEditWhy(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal?"
        description="Are you sure you want to delete this goal? Linked tasks will remain safe and intact."
        confirmLabel="Delete Goal"
        variant="danger"
      />
    </div>
  );
};
