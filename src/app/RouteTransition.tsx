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
    if (reduced) {
      // A rapid route change can leave the outgoing GSAP opacity on the shared outlet.
      // Clear it as soon as reduced motion is enabled so the next route is fully readable.
      gsap.killTweensOf(node);
      gsap.set(node, { clearProps: 'opacity,transform' });
    }
    if (display.key !== location.key) {
      if (reduced) {
        window.scrollTo(0, 0);
        setDisplay(latest.current);
        return;
      }
      const cards = visibleCards(node);
      const exit = gsap.timeline({
        onComplete: () => {
          window.scrollTo(0, 0);
          setDisplay(latest.current);
        },
      });
      if (cards.length) exit.to(cards, {
        opacity: 0, y: -6, scale: .98,
        duration: .16, ease: 'power2.in', stagger: .01,
      }, 0);
      exit.to(node, {
        opacity: 0, duration: .18, ease: 'power2.in',
      }, 0);
      return;
    }
    if (reduced) return;

    const playEntrance = () => {
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
      timeline.fromTo(node, { opacity: 0, y: 6 }, {
        opacity: 1, y: 0, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity',
      }, 0);
      if (letters.length) timeline.fromTo(letters,
        { yPercent: 120, rotation: 7, opacity: 0 },
        { yPercent: 0, rotation: 0, opacity: 1, duration: .85, stagger: .022,
          ease: 'power4.out', clearProps: 'transform,opacity' }, 0);
      else if (heading) timeline.fromTo(heading,
        { yPercent: 55, opacity: 0, clipPath: 'inset(0 0 90% 0)' },
        { yPercent: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: .75,
          ease: 'power4.out', clearProps: 'transform,opacity,clipPath' }, 0);
      if (stats.length) timeline.fromTo(stats,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: .6, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' }, .08);
      if (extras.length) timeline.fromTo(extras,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: .6, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' }, .12);
      if (cards.length) timeline.fromTo(cards,
        { opacity: 0, y: 16, scale: .98 },
        { opacity: 1, y: 0, scale: 1, duration: .5,
          stagger: .035, ease: 'power3.out', clearProps: 'transform,opacity,clipPath' }, .08);
    };

    // If WelcomeOverlay is currently active on launch/refresh, synchronize entrance with overlay dismiss
    const overlayElement = document.querySelector('[role="dialog"][aria-label="Welcome to Nemo"]');
    if (overlayElement) {
      const onDismissing = () => {
        playEntrance();
      };
      window.addEventListener('nemo:welcome-dismissing', onDismissing, { once: true });
      return () => {
        window.removeEventListener('nemo:welcome-dismissing', onDismissing);
      };
    }

    playEntrance();
  }, { scope: root, dependencies: [location.key, display.key, reduced], revertOnUpdate: true });
  return <div ref={root} className="route-content" aria-busy={display.key !== location.key} data-route-key={display.key}>{display.outlet}</div>;
}
