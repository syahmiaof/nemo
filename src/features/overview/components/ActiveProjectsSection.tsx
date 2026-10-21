import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/design/useReducedMotion';
import { isScrollTriggerActive } from '../motion/overviewMotion';
import { ProjectCard } from '@/features/projects/ProjectCard';
import type { Project, Milestone, Task } from '@/domain/types';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ActiveProjectsSectionProps {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
}

export const ActiveProjectsSection: React.FC<ActiveProjectsSectionProps> = ({
  projects,
  milestones,
  tasks,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const grid = gridRef.current;
      if (!section || !grid) return;

      if (reduced) {
        gsap.set(section, { opacity: 1, y: 0, clearProps: 'transform,opacity' });
        const cards = grid.querySelectorAll('.project-card, .empty-inline');
        gsap.set(cards, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        return;
      }

      const cards = grid.querySelectorAll('.project-card, .empty-inline');

      const hasST = isScrollTriggerActive();
      const tl = gsap.timeline({
        scrollTrigger: hasST
          ? {
              trigger: section,
              start: 'top 88%',
              end: 'bottom 12%',
              toggleActions: 'play reverse play reverse',
            }
          : undefined,
      });

      tl.fromTo(
        section.querySelector('.section-heading'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
        0
      );

      if (cards.length > 0) {
        tl.fromTo(
          cards,
          { opacity: 0, y: 22, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power3.out',
            force3D: true,
          },
          0.1
        );
      }
    },
    {
      scope: sectionRef,
      dependencies: [projects.length, milestones.length, tasks.length, reduced],
      revertOnUpdate: true,
    }
  );

  return (
    <section ref={sectionRef} className="in-the-making-section" aria-labelledby="projects-title">
      <div className="section-heading">
        <div>
          <h2 id="projects-title">In the making</h2>
          <p>Your active projects, one step closer.</p>
        </div>
        <Link to="/projects" className="section-link">
          All projects <ArrowUpRight size={18} />
        </Link>
      </div>

      <div ref={gridRef} className="overview-project-grid">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} milestones={milestones} tasks={tasks} />
        ))}
        {projects.length === 0 && (
          <div className="glass-panel empty-inline">
            No projects yet. <Link to="/projects">Start your first project →</Link>
          </div>
        )}
      </div>
    </section>
  );
};
