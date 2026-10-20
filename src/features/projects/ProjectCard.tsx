import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Layers } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { db } from '@/db/nemoDb';
import { formatDisplayDate } from '@/lib/dates';
import { generateTypographicCover, getProjectWebPreviewUrl } from '@/lib/utils';
import type { Project, Milestone, Task } from '@/domain/types';

interface ProjectCardProps {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  viewMode?: 'grid' | 'list';
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  milestones,
  tasks,
  viewMode = 'grid',
}) => {
  const fallback = useMemo(() => generateTypographicCover(project.title, project.category), [project.title, project.category]);
  const webPreview = useMemo(() => getProjectWebPreviewUrl(project.liveUrl), [project.liveUrl]);
  const defaultCover = webPreview || fallback;
  const [coverUrl, setCoverUrl] = useState<string>(defaultCover);

  useEffect(() => {
    let isMounted = true;
    setCoverUrl(defaultCover);
    if (project.previewBlobId) {
      db.assetBlobs.get(project.previewBlobId).then((blob) => {
        if (isMounted && blob) {
          setCoverUrl(blob.data);
        }
      }).catch(() => { if (isMounted) setCoverUrl(defaultCover); });
    }
    return () => {
      isMounted = false;
    };
  }, [project.previewBlobId, defaultCover]);

  // Derive genuine progress according to Invariant 6:
  // 1. If milestones exist, use completed/total milestones and label basis
  // 2. Otherwise if tasks exist, use completed/total tasks and label basis
  // 3. Otherwise show "No progress data"
  const projectMilestones = useMemo(() => {
    return milestones.every((m) => (m.ownerId || (m as any).projectId) === project.id)
      ? milestones
      : milestones.filter((m) => (m.ownerType === 'project' && m.ownerId === project.id) || (m as any).projectId === project.id);
  }, [milestones, project.id]);

  const projectTasks = useMemo(() => {
    return tasks.every((t) => (t.parentId || (t as any).projectId) === project.id)
      ? tasks
      : tasks.filter((t) => (t.parentType === 'project' && t.parentId === project.id) || (t as any).projectId === project.id);
  }, [tasks, project.id]);

  let progressPercent: number | null = null;
  let progressLabel = 'No progress data';

  if (projectMilestones.length > 0) {
    const completed = projectMilestones.filter((m) => m.completedAt || (m as any).completed).length;
    progressPercent = Math.round((completed / projectMilestones.length) * 100);
    progressLabel = `${completed}/${projectMilestones.length} milestones (${progressPercent}%)`;
  } else if (projectTasks.length > 0) {
    const completed = projectTasks.filter((t) => t.status === 'done').length;
    progressPercent = Math.round((completed / projectTasks.length) * 100);
    progressLabel = `${completed}/${projectTasks.length} tasks (${progressPercent}%)`;
  }

  if (viewMode === 'list') {
    return (
      <Link
        to={`/projects/${project.id}`}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl glass-panel relative group hover:border-white/20 transition-all gap-3"
      >
        <div className="flex items-center gap-3 min-w-0 relative z-10">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-surface-solid">
            {coverUrl && <img src={coverUrl}
            onError={() => { if (coverUrl !== fallback) setCoverUrl(fallback); }} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-content-primary group-hover:text-accent-mint transition-colors truncate">
                {project.title}
              </h3>
              {project.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-content-secondary border border-white/10 font-mono">
                  {project.category}
                </span>
              )}
            </div>
            <p className="text-xs text-content-tertiary mt-0.5 font-mono">
              Basis: {progressLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center relative z-10">
          {project.dueDate && (
            <span className="text-xs text-content-tertiary flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {formatDisplayDate(project.dueDate)}
            </span>
          )}
          <PriorityBadge priority={project.priority} size="sm" />
          <StatusBadge status={project.status} size="sm" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="project-card flex flex-col rounded-2xl glass-panel relative group overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
    >
      {/* Cover / Screenshot Banner */}
      <div className="project-cover h-36 w-full overflow-hidden bg-surface-solid/60 border-b border-white/10 relative">
        {coverUrl && (
          <img
            src={coverUrl}
            onError={() => { if (coverUrl !== fallback) setCoverUrl(fallback); }}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <StatusBadge status={project.status} size="sm" />
        </div>
        <div className="absolute top-3 right-3 z-10">
          <PriorityBadge priority={project.priority} size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="project-body p-5 flex-1 flex flex-col justify-between space-y-4 relative z-10">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {project.category && (
              <span className="text-[10px] font-mono tracking-wider uppercase text-accent-mint font-semibold">
                {project.category}
              </span>
            )}
            {project.clientLabel && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-content-secondary border border-white/10">
                {project.clientLabel}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-content-primary group-hover:text-accent-mint transition-colors line-clamp-1">
            {project.title}
          </h3>

          {project.description && (
            <p className="project-description text-xs text-content-secondary line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-content-tertiary">
            <span>Progress</span>
            <span className="font-mono text-white/80">{progressLabel}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            {progressPercent !== null && (
              <div
                className="project-progress h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-content-tertiary">
          <div className="flex items-center gap-1 font-mono">
            {project.dueDate ? (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDisplayDate(project.dueDate)}</span>
              </>
            ) : (
              <span>No deadline set</span>
            )}
          </div>

          {project.techStack.length > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{[...new Set(project.techStack)].slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
