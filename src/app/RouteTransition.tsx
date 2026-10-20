import { useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';

gsap.registerPlugin(useGSAP);

/** Keep the outgoing outlet mounted until its exit finishes; latest navigation wins. */
export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [display, setDisplay] = useState({ key: location.key, outlet });
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const latest = useRef({ key: location.key, outlet });
  latest.current = { key: location.key, outlet };
  useGSAP(() => {
    const node = root.current;
    if (!node) return;
    if (display.key !== location.key) {
      if (reduced) {
        window.scrollTo(0, 0);
        setDisplay(latest.current);
        return;
      }
      gsap.to(node, {
        opacity: .2, y: -8, duration: .18, ease: 'power2.in',
        onComplete: () => {
          window.scrollTo(0, 0);
          setDisplay(latest.current);
        },
      });
      return;
    }
    if (reduced) return;
    gsap.fromTo(node, { opacity: .35, y: 14 }, {
      opacity: 1, y: 0, duration: .48, ease: 'power3.out', clearProps: 'transform,opacity',
    });
    const sections = node.querySelectorAll('[data-enter]');
    if (sections.length) gsap.fromTo(sections, { y: 12, opacity: .45 }, {
      y: 0, opacity: 1, duration: .48, stagger: { each: .045, amount: Math.min(.27, sections.length * .045) },
      ease: 'power3.out', clearProps: 'transform,opacity',
    });
  }, { scope: root, dependencies: [location.key, display.key, reduced], revertOnUpdate: true });
  return <div ref={root} className="route-content" aria-busy={display.key !== location.key} data-route-key={display.key}>{display.outlet}</div>;
}
