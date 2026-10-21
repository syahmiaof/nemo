import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Plus, LayoutGrid, List, Search, FolderGit2 } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';
import type { ProjectStatus, Milestone, Task } from '@/domain/types';
import { MotionTitle } from '@/components/ui/MotionTitle';
import { useReducedMotion } from '@/design/useReducedMotion';
import { triggerButtonPop } from '@/design/motion';

gsap.registerPlugin(useGSAP);

export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const tabsTrackRef = useRef<HTMLDivElement>(null);
  const tabsPillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillMounted = useRef(false);

  const reducedMotion = useReducedMotion();

  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];

  // Reset pagination on tab or search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery]);

  // Index milestones and tasks by project in a single O(M + T) pass to avoid O(P * (M + T)) nested loops
  const { milestonesByProject, tasksByProject } = useMemo(() => {
    const mMap = new Map<string, Milestone[]>();
    const tMap = new Map<string, Task[]>();

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      const pid = m.ownerId || (m as any).projectId;
      if (pid) {
        const arr = mMap.get(pid);
        if (arr) arr.push(m);
        else mMap.set(pid, [m]);
      }
    }

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const pid = t.parentId || (t as any).projectId;
      if (pid) {
        const arr = tMap.get(pid);
        if (arr) arr.push(t);
        else tMap.set(pid, [t]);
      }
    }

    return { milestonesByProject: mMap, tasksByProject: tMap };
  }, [milestones, tasks]);

  // Non-blocking search typing
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredProjects = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return projects.filter((project) => {
      // Tab filter
      if (activeTab === 'archived') {
        if (!project.archivedAt) return false;
      } else {
        if (project.archivedAt) return false;
        if (activeTab !== 'all' && project.status !== activeTab) return false;
      }

      // Search query
      if (q) {
        const matchTitle = project.title.toLowerCase().includes(q);
        const matchCat = project.category?.toLowerCase().includes(q);
        const matchStack = project.techStack.some((t) => t.toLowerCase().includes(q));
        const matchTags = project.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCat && !matchStack && !matchTags) return false;
      }

      return true;
    });
  }, [projects, activeTab, deferredSearch]);

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleCount);
  }, [filteredProjects, visibleCount]);

  const tabOptions = [
    { key: 'all', label: 'All Active' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'not_started', label: 'Not Started' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ];

  // 1. Header and toolbar controls GSAP entrance
  useGSAP(() => {
    if (reducedMotion) {
      gsap.set('.module-heading p, .page-toolbar, .projects-search, .projects-view-switcher, .projects-add-btn', {
        clearProps: 'all',
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '.module-heading p',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.05, clearProps: 'transform,opacity' },
      0
    );

    tl.fromTo(
      '.page-toolbar',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform,opacity' },
      0.06
    );

    tl.fromTo(
      ['.projects-search', '.projects-view-switcher', '.projects-add-btn'],
      { opacity: 0, y: 10, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, clearProps: 'transform,opacity' },
      0.12
    );
  }, { scope: pageRef, dependencies: [reducedMotion] });

  // 2. Status segmented tab switcher with fluid active indicator/pill animation
  useGSAP(() => {
    const track = tabsTrackRef.current;
    const pill = tabsPillRef.current;
    const activeBtn = tabRefs.current[activeTab];

    if (!track || !pill || !activeBtn) return;

    const left = activeBtn.offsetLeft;
    const top = activeBtn.offsetTop;
    const width = activeBtn.offsetWidth;
    const height = activeBtn.offsetHeight;

    if (reducedMotion) {
      gsap.set(pill, { x: left, y: top, width, height, opacity: 1 });
      return;
    }

    if (!pillMounted.current) {
      pillMounted.current = true;
      gsap.set(pill, { x: left, y: top, width, height, opacity: 1 });
      return;
    }

    gsap.to(pill, {
      x: left,
      y: top,
      width,
      height,
      opacity: 1,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }, { scope: pageRef, dependencies: [activeTab, projects.length, reducedMotion] });

  // ResizeObserver to keep fluid indicator pill pixel-accurate on window resize or font change
  useEffect(() => {
    const track = tabsTrackRef.current;
    const pill = tabsPillRef.current;
    if (!track || !pill) return;

    const reposition = () => {
      const activeBtn = tabRefs.current[activeTab];
      if (!activeBtn) return;
      gsap.set(pill, {
        x: activeBtn.offsetLeft,
        y: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
      });
    };

    const ro = new ResizeObserver(reposition);
    ro.observe(track);
    Object.values(tabRefs.current).forEach((btn) => {
      if (btn) ro.observe(btn);
    });

    void document.fonts?.ready.then(reposition);

    return () => ro.disconnect();
  }, [activeTab]);

  // 3. Staggered crystal reveal on Dexie async load & Bi-directional scroll motion
  useGSAP(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.project-card'));
    if (!cards.length) return;

    if (reducedMotion) {
      gsap.set(cards, { clearProps: 'transform,opacity,clipPath' });
      return;
    }

    const vh = window.innerHeight;
    const initialInView: HTMLElement[] = [];
    const belowFold: HTMLElement[] = [];

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < vh + 50 && rect.bottom > -50) {
        initialInView.push(card);
      } else {
        belowFold.push(card);
      }
    });

    // Staggered crystal reveal on cards in viewport (do NOT skip initial run!)
    const revealBatch = initialInView.slice(0, 18);
    const animatedCards = new WeakSet<HTMLElement>();

    if (revealBatch.length > 0) {
      gsap.fromTo(
        revealBatch,
        {
          opacity: 0,
          y: 22,
          scale: 0.96,
          clipPath: 'inset(0 50% 0 50% round 24px)',
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: 'inset(0 0% 0 0% round 24px)',
          duration: 0.75,
          stagger: 0.045,
          ease: 'expo.out',
          clearProps: 'transform,opacity,clipPath',
          overwrite: 'auto',
        }
      );
      revealBatch.forEach((card) => animatedCards.add(card));
    }

    // Set initial opacity for below-fold cards so they don't pop before scroll
    belowFold.forEach((card) => {
      if (!animatedCards.has(card)) {
        gsap.set(card, { opacity: 0 });
      }
    });

    // Bi-directional scroll observer for cards entering viewport
    let lastY = window.scrollY;
    let scrollDirection: 'down' | 'up' = 'down';

    const onScroll = () => {
      const currY = window.scrollY;
      const delta = currY - lastY;
      if (Math.abs(delta) > 1) {
        scrollDirection = delta > 0 ? 'down' : 'up';
        lastY = currY;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            if (!animatedCards.has(card)) {
              animatedCards.add(card);
              const yOffset = scrollDirection === 'down' ? 28 : -28;
              gsap.fromTo(
                card,
                { opacity: 0, y: yOffset, scale: 0.98 },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.52,
                  ease: 'power3.out',
                  clearProps: 'transform,opacity',
                  overwrite: 'auto',
                }
              );
            }
          } else {
            // When scrolled well outside viewport, allow re-animating when coming back
            const rect = entry.boundingClientRect;
            if (rect.bottom < -200 || rect.top > window.innerHeight + 200) {
              animatedCards.delete(card);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '20px 0px 20px 0px',
        threshold: 0.05,
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, {
    scope: pageRef,
    dependencies: [
      activeTab,
      viewMode,
      deferredSearch,
      visibleCount,
      visibleProjects.length,
      reducedMotion,
    ],
    revertOnUpdate: true,
  });

  return (
    <div ref={pageRef} className="projects-page space-y-6">
      <div className="module-heading" data-enter>
        <MotionTitle text="Projects" />
        <p>A home for the work you want to finish.</p>
      </div>

      {/* Top Controls Bar */}
      <div className="page-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel relative z-10">
        {/* Search Input */}
        <div className="projects-search relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-content-tertiary pointer-events-none" />
          <Input
            placeholder="Search projects by title, stack or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10"
          />
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="projects-view-switcher flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={(e) => {
                triggerButtonPop(e.currentTarget);
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white/[0.12] text-white shadow-sm' : 'text-content-tertiary hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                triggerButtonPop(e.currentTarget);
                setViewMode('list');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white/[0.12] text-white shadow-sm' : 'text-content-tertiary hover:text-white'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="projects-add-btn gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Status Segmented Tabs with fluid active indicator pill */}
      <div
        ref={tabsTrackRef}
        role="tablist"
        aria-label="Filter projects by status"
        className="page-filters flex items-center overflow-x-auto no-scrollbar pb-1 gap-1.5 relative isolate p-1 rounded-2xl bg-white/[0.02] border border-white/5"
      >
        <span
          ref={tabsPillRef}
          aria-hidden="true"
          className="absolute rounded-xl bg-white/[0.12] border border-white/15 shadow-sm pointer-events-none opacity-0 z-0"
        />
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
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative z-10 flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-colors ${
                  isActive ? 'bg-white/[0.15] text-white' : 'bg-white/[0.05] text-content-tertiary'
                }`}
              >
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
        <div className="space-y-6">
          <div
            ref={cardsContainerRef}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                : 'space-y-3'
            }
          >
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                milestones={milestonesByProject.get(project.id) || []}
                tasks={tasksByProject.get(project.id) || []}
                viewMode={viewMode}
              />
            ))}
          </div>

          {filteredProjects.length > visibleCount && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-content-secondary hover:text-content-primary transition-all border border-white/10 shadow-sm"
              >
                Load more projects (Showing {visibleProjects.length} of {filteredProjects.length})
              </button>
            </div>
          )}
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
