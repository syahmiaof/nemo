import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Github,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Edit2,
  Archive,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { db, atomicDeleteProject, atomicSetTaskStatus } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatDisplayDate } from '@/lib/dates';
import { generateId } from '@/lib/ids';
import { generateTypographicCover } from '@/lib/utils';
import { ProjectFormModal } from './ProjectFormModal';
import type { Milestone, Task } from '@/domain/types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isCompleteWarningOpen, setIsCompleteWarningOpen] = useState(false);

  // Milestone inline creation
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Task inline creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const project = useLiveQuery(() => (id ? db.projects.get(id) : undefined), [id]);
  const milestones = useLiveQuery(
    () => (id ? db.milestones.where('ownerId').equals(id).sortBy('order') : []),
    [id]
  ) || [];
  const tasks = useLiveQuery(
    () => (id ? db.tasks.where('parentId').equals(id).toArray() : []),
    [id]
  ) || [];

  const [coverUrl, setCoverUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (project?.previewBlobId) {
      db.assetBlobs.get(project.previewBlobId).then((blob) => {
        if (isMounted && blob) setCoverUrl(blob.data);
      });
    } else if (project) {
      setCoverUrl(generateTypographicCover(project.title, project.category));
    }
    return () => {
      isMounted = false;
    };
  }, [project]);

  if (!project) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-content-secondary">This project is not stored on this device.</p>
        <Link to="/projects">
          <Button variant="secondary" size="sm">
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  // Derive genuine progress
  let progressPercent: number | null = null;
  let progressLabel = 'No progress data';

  if (milestones.length > 0) {
    const completed = milestones.filter((m) => m.completedAt).length;
    progressPercent = Math.round((completed / milestones.length) * 100);
    progressLabel = `${completed}/${milestones.length} milestones completed (${progressPercent}%)`;
  } else if (tasks.length > 0) {
    const completed = tasks.filter((t) => t.status === 'done').length;
    progressPercent = Math.round((completed / tasks.length) * 100);
    progressLabel = `${completed}/${tasks.length} tasks completed (${progressPercent}%)`;
  }

  // Find next unfinished action
  const nextTask = tasks.find((t) => t.status !== 'done');
  const nextMilestone = milestones.find((m) => !m.completedAt);

  // Actions
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await atomicSetTaskStatus(db, task.id, nextStatus);
    success('Task updated', `"${task.title}" is now ${nextStatus === 'done' ? 'completed' : 'todo'}.`);
  };

  const handleToggleMilestone = async (milestone: Milestone) => {
    const completedAt = milestone.completedAt ? undefined : new Date().toISOString();
    await db.milestones.update(milestone.id, { completedAt });
    success('Milestone updated', `"${milestone.title}" updated.`);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !id) return;
    await db.milestones.add({
      id: generateId('ms'),
      ownerType: 'project',
      ownerId: id,
      title: newMilestoneTitle.trim(),
      targetDate: newMilestoneDate || undefined,
      order: milestones.length,
    });
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    success('Milestone added');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;
    const now = new Date().toISOString();
    await db.tasks.add({
      id: generateId('task'),
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium',
      dueDate: newTaskDate || undefined,
      parentType: 'project',
      parentId: id,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    setNewTaskTitle('');
    setNewTaskDate('');
    success('Task added');
  };

  const handleCompleteProject = async () => {
    const openTasksCount = tasks.filter((t) => t.status !== 'done').length;
    const openMilestonesCount = milestones.filter((m) => !m.completedAt).length;

    if ((openTasksCount > 0 || openMilestonesCount > 0) && !isCompleteWarningOpen) {
      setIsCompleteWarningOpen(true);
      return;
    }

    await db.projects.update(project.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsCompleteWarningOpen(false);
    success('Project marked as Completed');
  };

  const handleReopenProject = async () => {
    await db.projects.update(project.id, {
      status: 'in_progress',
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    });
    success('Project reopened to In Progress');
  };

  const handleArchive = async () => {
    const archivedAt = project.archivedAt ? undefined : new Date().toISOString();
    await db.projects.update(project.id, { archivedAt });
    setIsArchiveConfirmOpen(false);
    success(archivedAt ? 'Project archived' : 'Project unarchived');
  };

  const handleDelete = async () => {
    await atomicDeleteProject(db, project.id);
    setIsDeleteConfirmOpen(false);
    success('Project deleted', 'Linked tasks unlinked safely.');
    navigate('/projects');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Back button & Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex items-center gap-2">
          {project.status === 'completed' ? (
            <Button size="sm" variant="secondary" onClick={handleReopenProject} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Project</span>
            </Button>
          ) : (
            <Button size="sm" onClick={handleCompleteProject} className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Complete</span>
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={() => setIsEditModalOpen(true)} className="gap-1.5">
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button size="sm" variant="secondary" onClick={() => setIsArchiveConfirmOpen(true)} className="gap-1.5">
            <Archive className="w-3.5 h-3.5" />
            <span>{project.archivedAt ? 'Unarchive' : 'Archive'}</span>
          </Button>

          <Button size="sm" variant="danger" onClick={() => setIsDeleteConfirmOpen(true)} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="rounded-2xl glass-panel relative overflow-hidden shadow-2xl">
        {/* Cover Header */}
        <div className="h-48 md:h-64 w-full overflow-hidden bg-surface-solid/60 border-b border-white/10 relative">
          {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <StatusBadge status={project.status} size="md" />
            <PriorityBadge priority={project.priority} size="md" />
            {project.archivedAt && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent-amber/20 text-accent-amber border border-accent-amber/30 font-medium">
                Archived
              </span>
            )}
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {project.category && (
                  <span className="text-xs font-mono uppercase tracking-wider text-accent-mint font-semibold">
                    {project.category}
                  </span>
                )}
                {project.clientLabel && (
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-content-secondary border border-border-subtle">
                    {project.clientLabel}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-content-primary">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-content-secondary mt-2 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border-subtle text-xs font-medium text-content-primary hover:border-border-emphasis transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-accent-mint" />
                  <span>Live App</span>
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border-subtle text-xs font-medium text-content-primary hover:border-border-emphasis transition-all"
                >
                  <Github className="w-3.5 h-3.5 text-content-secondary" />
                  <span>Repository</span>
                </a>
              )}
            </div>
          </div>

          {/* Progress Banner */}
          <div className="p-4 rounded-xl bg-surface-hover/50 border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold text-content-primary">Calculated Progress</span>
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

          {/* Next Action Box */}
          {(nextMilestone || nextTask) && (
            <div className="p-4 rounded-xl bg-accent-mint/5 border border-accent-mint/20 flex items-start gap-3">
              <Clock className="w-4 h-4 text-accent-mint flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-accent-mint uppercase tracking-wider">Current Next Action</p>
                <p className="text-sm font-semibold text-content-primary mt-0.5">
                  {nextMilestone ? nextMilestone.title : nextTask?.title}
                </p>
                {nextMilestone?.targetDate && (
                  <p className="text-xs text-content-tertiary mt-0.5 font-mono">
                    Target: {formatDisplayDate(nextMilestone.targetDate)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadata tags */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-content-tertiary pt-2 border-t border-border-subtle">
            {project.dueDate && (
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-content-secondary" />
                <span>Deadline: {formatDisplayDate(project.dueDate)}</span>
              </div>
            )}
            {project.techStack.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-content-secondary" />
                <span>{project.techStack.join(', ')}</span>
              </div>
            )}
            {project.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>Tags: {project.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones Card */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-base font-bold text-content-primary">Milestones</h3>
            <span className="text-xs font-mono text-content-tertiary">
              {milestones.filter((m) => m.completedAt).length}/{milestones.length}
            </span>
          </div>

          <form onSubmit={handleAddMilestone} className="flex gap-2">
            <Input
              placeholder="Add new milestone..."
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              className="text-xs"
            />
            <Input
              type="date"
              value={newMilestoneDate}
              onChange={(e) => setNewMilestoneDate(e.target.value)}
              className="w-36 text-xs"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {milestones.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">No milestones added yet.</p>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border-subtle group hover:border-border-emphasis transition-all"
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

        {/* Linked Canonical Tasks Card */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-base font-bold text-content-primary">Linked Tasks</h3>
            <span className="text-xs font-mono text-content-tertiary">
              {tasks.filter((t) => t.status === 'done').length}/{tasks.length}
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input
              placeholder="Add project task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="text-xs"
            />
            <Input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="w-36 text-xs"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {tasks.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">No tasks linked to this project.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border-subtle group hover:border-border-emphasis transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="text-content-tertiary hover:text-accent-mint p-0.5"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        task.status === 'done' ? 'line-through text-content-tertiary' : 'text-content-primary'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectToEdit={project}
      />

      {/* Complete with Open Tasks Warning Dialog */}
      <ConfirmDialog
        isOpen={isCompleteWarningOpen}
        onClose={() => setIsCompleteWarningOpen(false)}
        onConfirm={handleCompleteProject}
        title="Complete Project with Open Items?"
        description={`This project still has ${
          tasks.filter((t) => t.status !== 'done').length
        } open task(s) and ${
          milestones.filter((m) => !m.completedAt).length
        } incomplete milestone(s). Marking this project completed will not automatically mark those items done.`}
        confirmLabel="Complete Anyway"
        variant="primary"
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchive}
        title={project.archivedAt ? 'Unarchive Project' : 'Archive Project'}
        description={
          project.archivedAt
            ? 'This project will be returned to the active projects list.'
            : 'Archiving hides this project from active project views without deleting any linked tasks.'
        }
        confirmLabel={project.archivedAt ? 'Unarchive' : 'Archive'}
        variant="primary"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        description="Are you sure you want to delete this project? Its milestones will be deleted, and linked tasks will become standalone tasks without data loss."
        confirmLabel="Delete Project"
        variant="danger"
      />
    </div>
  );
};
