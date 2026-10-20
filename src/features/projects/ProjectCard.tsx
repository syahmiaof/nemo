import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Layers } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { db } from '@/db/nemoDb';
import { formatDisplayDate } from '@/lib/dates';
import { generateTypographicCover } from '@/lib/utils';
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
  const [coverUrl, setCoverUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (project.previewBlobId) {
      db.assetBlobs.get(project.previewBlobId).then((blob) => {
        if (isMounted && blob) {
          setCoverUrl(blob.data);
        }
      });
    } else {
      setCoverUrl(generateTypographicCover(project.title, project.category));
    }
    return () => {
      isMounted = false;
    };
  }, [project.previewBlobId, project.title, project.category]);

  // Derive genuine progress according to Invariant 6:
  // 1. If milestones exist, use completed/total milestones and label basis
  // 2. Otherwise if tasks exist, use completed/total tasks and label basis
  // 3. Otherwise show "No progress data"
  const projectMilestones = milestones.filter((m) => m.ownerType === 'project' && m.ownerId === project.id);
  const projectTasks = tasks.filter((t) => t.parentType === 'project' && t.parentId === project.id);

  let progressPercent: number | null = null;
  let progressLabel = 'No progress data';

  if (projectMilestones.length > 0) {
    const completed = projectMilestones.filter((m) => m.completedAt).length;
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
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle hover:border-border-emphasis transition-all group gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border-subtle flex-shrink-0 bg-surface-solid">
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-content-primary group-hover:text-accent-mint transition-colors truncate">
                {project.title}
              </h3>
              {project.category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-content-tertiary">
                  {project.category}
                </span>
              )}
            </div>
            <p className="text-xs text-content-tertiary mt-0.5">
              Basis: {progressLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
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
      className="flex flex-col rounded-2xl bg-surface border border-border-subtle hover:border-border-emphasis overflow-hidden transition-all group shadow-sm"
    >
      {/* Cover / Screenshot Banner */}
      <div className="h-36 w-full overflow-hidden bg-surface-solid border-b border-border-subtle relative">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <StatusBadge status={project.status} size="sm" />
        </div>
        <div className="absolute top-3 right-3">
          <PriorityBadge priority={project.priority} size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {project.category && (
              <span className="text-[10px] font-mono tracking-wider uppercase text-content-tertiary">
                {project.category}
              </span>
            )}
            {project.clientLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-hover text-content-secondary border border-border-subtle">
                {project.clientLabel}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-content-primary group-hover:text-accent-mint transition-colors line-clamp-1">
            {project.title}
          </h3>

          {project.description && (
            <p className="text-xs text-content-secondary line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-content-tertiary">
            <span>Progress</span>
            <span className="font-mono">{progressLabel}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
            {progressPercent !== null && (
              <div
                className="h-full bg-accent-mint rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-tertiary">
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
              <span>{project.techStack.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
