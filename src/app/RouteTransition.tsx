import { useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';

gsap.registerPlugin(useGSAP);

const CARD_SELECTOR = '.glass-panel, .project-card, .focus-ticket, .empty-state';

function visibleCards(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR))
    .filter((card) => !card.parentElement?.closest(CARD_SELECTOR))
    .filter((card) => {
      const bounds = card.getBoundingClientRect();
      return bounds.height > 0 && bounds.top < window.innerHeight + 120 && bounds.bottom > -120;
    })
    .slice(0, 16);
}

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
      const cards = visibleCards(node);
      if (cards.length) gsap.to(cards, {
        clipPath: 'inset(0 4% 0 4% round 20px)', scale: .97, y: -6,
        duration: .19, ease: 'power2.in', stagger: .012,
      });
      gsap.to(node, {
        opacity: .2, y: -8, duration: .21, ease: 'power2.in',
        onComplete: () => {
          window.scrollTo(0, 0);
          setDisplay(latest.current);
        },
      });
      return;
    }
    if (reduced) return;
    const page = node.firstElementChild as HTMLElement | null;
    if (!page) return;
    const heading = page.querySelector<HTMLElement>('[data-motion-title], h1');
    const letters = heading ? Array.from(heading.querySelectorAll<HTMLElement>('[data-motion-letter]')) : [];
    const stats = Array.from(page.querySelectorAll<HTMLElement>('.page-stat, .insights-head-stat')).slice(0, 6);
    const cards = visibleCards(node);
    const extras = Array.from(page.querySelectorAll<HTMLElement>('[data-enter], .page-toolbar, .page-filters'))
      .filter((element) => !cards.some((card) => card === element || card.contains(element)))
      .filter((element) => element !== heading && !element.contains(heading))
      .slice(0, 8);
    const timeline = gsap.timeline();
    timeline.fromTo(node, { opacity: .4, y: 10 }, {
      opacity: 1, y: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity',
    }, 0);
    if (letters.length) timeline.fromTo(letters,
      { yPercent: 115, rotation: 6, opacity: 0 },
      { yPercent: 0, rotation: 0, opacity: 1, duration: .85, stagger: .022,
        ease: 'power4.out', clearProps: 'transform,opacity' }, 0);
    else if (heading) timeline.fromTo(heading,
      { yPercent: 55, opacity: 0, clipPath: 'inset(0 0 90% 0)' },
      { yPercent: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: .72,
        ease: 'power4.out', clearProps: 'transform,opacity,clipPath' }, 0);
    if (stats.length) timeline.fromTo(stats,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: .55, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' }, .08);
    if (extras.length) timeline.fromTo(extras,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: .55, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' }, .12);
    if (cards.length) timeline.fromTo(cards,
      { opacity: 0, y: 18, scale: .97, clipPath: 'inset(0 50% 0 50% round 20px)' },
      { opacity: 1, y: 0, scale: 1, clipPath: 'inset(0 0% 0 0% round 20px)', duration: .9,
        stagger: .055, ease: 'expo.out', clearProps: 'transform,opacity,clipPath' }, .12);
  }, { scope: root, dependencies: [location.key, display.key, reduced], revertOnUpdate: true });
  return <div ref={root} className="route-content" aria-busy={display.key !== location.key} data-route-key={display.key}>{display.outlet}</div>;
}
