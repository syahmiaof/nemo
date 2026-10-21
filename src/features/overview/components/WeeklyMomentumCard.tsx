import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/design/useReducedMotion';
import { isScrollTriggerActive } from '../motion/overviewMotion';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface WeeklyMomentumCardProps {
  weeklyRatio: number;
  finishedCount: number;
  openCount: number;
  activeProjectCount: number;
  academicCount: number;
  overdueCount: number;
}

export const WeeklyMomentumCard: React.FC<WeeklyMomentumCardProps> = ({
  weeklyRatio,
  finishedCount,
  openCount,
  activeProjectCount,
  academicCount,
  overdueCount,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const circumference = 389.5;
  const targetDash = (weeklyRatio / 100) * circumference;

  useGSAP(
    () => {
      const panel = panelRef.current;
      const circle = circleRef.current;
      const label = labelRef.current;
      const legend = legendRef.current;
      const pill = pillRef.current;

      if (!panel) return;

      if (reduced) {
        if (circle) circle.setAttribute('stroke-dasharray', `${targetDash} ${circumference}`);
        if (label) label.innerText = `${weeklyRatio}%`;
        gsap.set(panel, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        return;
      }

      const hasST = isScrollTriggerActive();
      // Bi-directional ScrollTrigger for panel entrance & exit
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

      // 1. Panel subtle lift and scale
      tl.fromTo(
        panel,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out', force3D: true },
        0
      );

      // 2. Animated donut gauge stroke arc
      if (circle) {
        tl.fromTo(
          circle,
          { strokeDasharray: `0 ${circumference}` },
          { strokeDasharray: `${targetDash} ${circumference}`, duration: 1.25, ease: 'power3.out' },
          0.1
        );
      }

      // 3. Count up label
      if (label) {
        const counter = { val: 0 };
        tl.to(
          counter,
          {
            val: weeklyRatio,
            duration: 1.25,
            ease: 'power3.out',
            onUpdate: () => {
              if (label) label.innerText = `${Math.round(counter.val)}%`;
            },
          },
          0.1
        );
      }

      // 4. Staggered legend items
      if (legend) {
        const items = legend.querySelectorAll('.gauge-legend-item');
        tl.fromTo(
          items,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          0.2
        );
      }

      // 5. Status pill lift
      if (pill) {
        tl.fromTo(
          pill,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
          0.3
        );
      }
    },
    {
      scope: panelRef,
      dependencies: [
        weeklyRatio,
        finishedCount,
        openCount,
        activeProjectCount,
        academicCount,
        overdueCount,
        reduced,
      ],
      revertOnUpdate: true,
    }
  );

  return (
    <section ref={panelRef} className="glass-panel room-gauge-panel" aria-labelledby="targets-title">
      <div className="panel-heading">
        <h2 id="targets-title">Weekly momentum</h2>
        <Link to="/insights" className="icon-button" aria-label="Open insights">
          <ArrowUpRight size={18} />
        </Link>
      </div>

      <div className="room-gauge-body">
        <div className="gauge-donut-container">
          <svg viewBox="0 0 160 160" className="gauge-donut-svg">
            <circle
              cx="80"
              cy="80"
              r="62"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="14"
            />
            <circle
              ref={circleRef}
              cx="80"
              cy="80"
              r="62"
              fill="none"
              stroke="url(#donut-grad)"
              strokeWidth="14"
              strokeDasharray={reduced ? `${targetDash} ${circumference}` : `0 ${circumference}`}
              strokeDashoffset="97.4"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C3E9DA" />
                <stop offset="50%" stopColor="#F5C8BC" />
                <stop offset="100%" stopColor="#FAE392" />
              </linearGradient>
            </defs>
          </svg>
          <div className="gauge-donut-label">
            <strong ref={labelRef}>{weeklyRatio}%</strong>
            <span>completed</span>
          </div>
        </div>

        <div ref={legendRef} className="gauge-legend-list">
          <div className="gauge-legend-item flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="dot dot-mint shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-content-primary truncate">Done this week</span>
                <span className="text-[10px] text-content-tertiary">Tasks completed</span>
              </div>
            </div>
            <span className="text-sm font-bold text-accent-mint pl-1 shrink-0">{finishedCount}</span>
          </div>

          <div className="gauge-legend-item flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="dot dot-peach shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-content-primary truncate">Tasks pending</span>
                <span className="text-[10px] text-content-tertiary">To-dos remaining</span>
              </div>
            </div>
            <span className="text-sm font-bold text-accent-ember pl-1 shrink-0">{openCount}</span>
          </div>

          <div className="gauge-legend-item flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="dot dot-amber shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-content-primary truncate">Active projects</span>
                <span className="text-[10px] text-content-tertiary">In progress</span>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-300 pl-1 shrink-0">{activeProjectCount}</span>
          </div>

          <div className="gauge-legend-item flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="dot dot-slate shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-content-primary truncate">Coursework</span>
                <span className="text-[10px] text-content-tertiary">Upcoming study</span>
              </div>
            </div>
            <span className="text-sm font-bold text-sky-300 pl-1 shrink-0">{academicCount}</span>
          </div>
        </div>

        <div ref={pillRef} className="gauge-status-pill">
          <span className="status-live-dot" />
          <span>
            {overdueCount > 0
              ? `${overdueCount} item${overdueCount > 1 ? 's' : ''} require prompt attention`
              : 'All commitments on schedule'}
          </span>
        </div>
      </div>
    </section>
  );
};
