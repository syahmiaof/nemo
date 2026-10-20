import { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/design/motion';

export function TavolaTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  const { pathname } = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pill = pillRef.current;
    if (!track || !pill) return;

    let disposed = false;
    let tween: gsap.core.Tween | undefined;

    const measure = (instant = false) => {
      if (disposed) return;
      const active = track.querySelector<HTMLAnchorElement>('.tab.is-active') ||
                     track.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      if (!active) {
        pill.style.opacity = '0';
        return;
      }

      const targetX = active.offsetLeft;
      const targetW = active.offsetWidth;

      tween?.kill();

      if (instant || !initialized.current || prefersReducedMotion()) {
        gsap.set(pill, {
          x: targetX,
          width: targetW,
          opacity: 1,
        });
        initialized.current = true;
      } else {
        pill.style.opacity = '1';
        tween = gsap.to(pill, {
          x: targetX,
          width: targetW,
          duration: 0.32,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    // Measure immediately
    measure();

    // Re-measure when layout / fonts settle
    const observer = new ResizeObserver(() => measure(true));
    observer.observe(track);
    document.fonts?.ready?.then?.(() => measure(true));

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => measure(true);
    motion.addEventListener('change', settle);

    return () => {
      disposed = true;
      observer.disconnect();
      tween?.kill();
      motion.removeEventListener('change', settle);
    };
  }, [pathname]);

  return (
    <nav className="tabs" aria-label="Main Navigation">
      <div ref={trackRef} className="tabs__track">
        <span ref={pillRef} className="tabs__indicator" aria-hidden="true" />
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
