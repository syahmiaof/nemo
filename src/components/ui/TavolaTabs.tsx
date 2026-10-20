import { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/design/motion';

export function TavolaTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  const { pathname } = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const edges = useRef({ left: 0, right: 0 });
  const initialized = useRef(false);
  useLayoutEffect(() => {
    const track = trackRef.current, pill = pillRef.current;
    if (!track || !pill) return;
    let disposed = false;
    let timeline: gsap.core.Timeline | undefined;
    const measure = (instant = false) => {
      if (disposed) return;
      const active = track.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      if (!active) { pill.style.opacity = '0'; return; }
      const left = active.offsetLeft, right = track.offsetWidth - left - active.offsetWidth;
      timeline?.kill();
      const draw = () => {
        pill.style.clipPath = `inset(0 ${Math.max(0, edges.current.right)}px 0 ${Math.max(0, edges.current.left)}px round 999px)`;
        pill.style.opacity = '1';
      };
      if (instant || !initialized.current || prefersReducedMotion()) {
        Object.assign(edges.current, { left, right }); draw(); initialized.current = true;
      } else {
        const goingRight = left > edges.current.left;
        timeline = gsap.timeline({ onUpdate: draw });
        timeline.to(edges.current, { [goingRight ? 'right' : 'left']: goingRight ? right : left, duration: .34, ease: 'power3.out' }, 0)
          .to(edges.current, { [goingRight ? 'left' : 'right']: goingRight ? left : right, duration: .46, ease: 'power3.out' }, .035);
      }
    };
    measure();
    const observer = new ResizeObserver(() => measure(true));
    observer.observe(track);
    document.fonts.ready.then(() => measure(true));
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => measure(true);
    motion.addEventListener('change', settle);
    return () => { disposed = true; observer.disconnect(); timeline?.kill(); motion.removeEventListener('change', settle); };
  }, [pathname]);
  return <nav className="tabs" aria-label="Main Navigation"><div ref={trackRef} className="tabs__track">
    <span ref={pillRef} className="tabs__indicator" aria-hidden="true" />
    {tabs.map(tab => <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}>{tab.label}</NavLink>)}
  </div></nav>;
}
