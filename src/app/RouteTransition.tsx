import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/design/motion';

/** Keep the outgoing outlet mounted until its exit finishes; latest navigation wins. */
export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [display, setDisplay] = useState({ key: location.key, outlet });
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef({ key: location.key, outlet });
  latest.current = { key: location.key, outlet };
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || display.key === location.key) return;
    if (prefersReducedMotion()) { setDisplay(latest.current); return; }
    const exit = gsap.to(node, { opacity: .2, y: -8, duration: .18, ease: 'power2.in', overwrite: true,
      onComplete: () => setDisplay(latest.current) });
    return () => { exit.kill(); };
  }, [location.key, display.key]);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const context = gsap.context(() => {
      gsap.set(node, { opacity: 1, y: 0 });
      if (!prefersReducedMotion()) {
        gsap.fromTo(node, { opacity: .35, y: 14 }, { opacity: 1, y: 0, duration: .48, ease: 'power3.out', clearProps: 'transform,opacity' });
        const sections = node.querySelectorAll('[data-enter]');
        if (sections.length) gsap.fromTo(sections, { y: 12, opacity: .45 }, { y: 0, opacity: 1, duration: .5, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
    }, node);
    return () => context.revert();
  }, [display.key]);
  return <div ref={root} className="route-content" data-route-key={display.key}>{display.outlet}</div>;
}
