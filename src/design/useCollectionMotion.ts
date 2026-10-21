import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(useGSAP);

/** Animates visible, newly selected records without moving off-screen or hidden content. */
export function useCollectionMotion<T extends HTMLElement>(key: string): RefObject<T> {
  const root = useRef<T>(null);
  const previousKey = useRef<string | undefined>(undefined);
  const reduced = useReducedMotion();

  useGSAP(() => {
    const node = root.current;
    const firstRun = previousKey.current === undefined;
    previousKey.current = key;
    if (!node) return;
    if (firstRun || reduced) return;

    const items = Array.from(node.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
      .filter((child) => {
        const bounds = child.getBoundingClientRect();
        return bounds.height > 0 && bounds.top < window.innerHeight + 100 && bounds.bottom > -100;
      }).slice(0, 18);
    if (!items.length) return;
    gsap.fromTo(items,
      { opacity: 0, y: 14, scale: .985 },
      { opacity: 1, y: 0, scale: 1, duration: .55, stagger: .035,
        ease: 'power3.out', clearProps: 'opacity,transform' });
  }, { scope: root, dependencies: [key, reduced], revertOnUpdate: true });

  return root;
}
