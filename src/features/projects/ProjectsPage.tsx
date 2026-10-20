import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, LayoutGrid, List, Search, FolderGit2 } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';
import type { ProjectStatus } from '@/domain/types';

export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];

  const filteredProjects = projects.filter((project) => {
    // Tab filter
    if (activeTab === 'archived') {
      if (!project.archivedAt) return false;
    } else {
      if (project.archivedAt) return false;
      if (activeTab !== 'all' && project.status !== activeTab) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = project.title.toLowerCase().includes(q);
      const matchCat = project.category?.toLowerCase().includes(q);
      const matchStack = project.techStack.some((t) => t.toLowerCase().includes(q));
      const matchTags = project.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCat && !matchStack && !matchTags) return false;
    }

    return true;
  });

  const tabOptions = [
    { key: 'all', label: 'All Active' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'not_started', label: 'Not Started' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-content-tertiary" />
          <Input
            placeholder="Search projects by title, stack or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex p-1 rounded-lg bg-surface border border-border-subtle">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-surface-hover text-content-primary' : 'text-content-tertiary hover:text-content-secondary'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-surface-hover text-content-primary' : 'text-content-tertiary hover:text-content-secondary'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-border-subtle">
        {tabOptions.map((tab) => {
          const count = projects.filter((p) => {
            if (tab.key === 'archived') return !!p.archivedAt;
            if (p.archivedAt) return false;
            return tab.key === 'all' || p.status === tab.key;
          }).length;

          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-accent-mint text-accent-mint font-semibold bg-surface/50'
                  : 'border-transparent text-content-secondary hover:text-content-primary hover:bg-surface/20'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface border border-border-subtle font-mono text-content-tertiary">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={searchQuery ? 'No matching projects found' : 'No projects in this view'}
          description={
            searchQuery
              ? 'Try adjusting your search terms or filter tabs.'
              : 'Create a project to group tasks, track milestones, and capture your build progress.'
          }
          actionLabel={searchQuery ? undefined : 'Add Project'}
          onAction={searchQuery ? undefined : () => setIsModalOpen(true)}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-3'
          }
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              milestones={milestones}
              tasks={tasks}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
