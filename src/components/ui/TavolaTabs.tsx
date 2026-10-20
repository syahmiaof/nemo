import { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { prefersReducedMotion } from '@/design/motion';
import { useReducedMotion } from '@/design/useReducedMotion';

gsap.registerPlugin(useGSAP);

export function TavolaTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<(instant?: boolean) => void>(() => {});
  const tabKey = tabs.map(tab => `${tab.to}:${tab.label}`).join('|');

  useGSAP((_context, contextSafe) => {
    const track = trackRef.current;
    const pill = pillRef.current;
    if (!track || !pill || !contextSafe) return;
    let disposed = false;
    let initialized = false;
    let geometry = '';
    let animation: gsap.core.Timeline | undefined;
    const edges = { left: 0, right: 0 };
    const draw = () => {
      pill.style.transform = `translate3d(${edges.left}px, 0, 0)`;
      pill.style.width = `${Math.max(0, edges.right - edges.left)}px`;
      pill.style.opacity = '1';
    };
    const read = () => {
      const active = track.querySelector<HTMLAnchorElement>('.tab.is-active');
      return active ? { left: active.offsetLeft, right: active.offsetLeft + active.offsetWidth } : null;
    };
    const signature = () => {
      const bounds = read();
      return `${track.offsetWidth}:${bounds?.left}:${bounds?.right}`;
    };
    const measure = contextSafe((instant = false) => {
      if (disposed) return;
      const target = read();
      animation?.kill();
      if (!target) { gsap.set(pill, { opacity: 0 }); return; }
      geometry = signature();
      if (instant || !initialized || prefersReducedMotion()) {
        Object.assign(edges, target);
        draw();
        initialized = true;
        return;
      }
      // Independent edges preserve the current shape on interruption. Labels never stretch.
      const forward = target.left >= edges.left;
      animation = gsap.timeline({ onUpdate: draw });
      animation.to(edges, {
        [forward ? 'right' : 'left']: target[forward ? 'right' : 'left'],
        duration: .34, ease: 'power3.out',
      }, 0).to(edges, {
        [forward ? 'left' : 'right']: target[forward ? 'left' : 'right'],
        duration: .46, ease: 'power3.out',
      }, .035);
    });
    measureRef.current = measure;
    measure(true);
    const remeasure = () => {
      // ResizeObserver's first notification must not cancel a newly started navigation.
      if (!disposed && signature() !== geometry) measure(true);
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(track);
    track.querySelectorAll('.tab').forEach(tab => observer.observe(tab));
    void document.fonts?.ready.then(remeasure);
    return () => {
      disposed = true;
      observer.disconnect();
      animation?.kill();
      measureRef.current = () => {};
    };
  }, { scope: trackRef, dependencies: [tabKey], revertOnUpdate: true });

  useLayoutEffect(() => { measureRef.current(reduced); }, [pathname, reduced]);

  return (
    <nav className="tabs" aria-label="Main Navigation">
      <div ref={trackRef} className="tabs__track">
        <span ref={pillRef} className="tabs__indicator" aria-hidden="true" />
        {tabs.map((tab) => <NavLink key={tab.to} to={tab.to}
          className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}>
          {tab.label}
        </NavLink>)}
      </div>
    </nav>
  );
}
