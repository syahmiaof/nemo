import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from './useReducedMotion';
import { prefersReducedMotion } from './motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export interface ScrollMotionOptions {
  /** CSS selector of children to animate within container. If omitted, container itself is animated. */
  selector?: string;
  /** IntersectionObserver threshold between 0 and 1. Default 0.1. */
  threshold?: number;
  /** Stagger in seconds between consecutive children entering together. Default 0.05. */
  stagger?: number;
  /** Displacement in pixels at start. Default 24. */
  distance?: number;
  /** Duration of entrance animation in seconds. Default 0.6. */
  duration?: number;
  /** GSAP easing formula. Default 'power3.out'. */
  ease?: string;
  /** When true, only animates once and does not reset on scroll exit. Default false (bi-directional). */
  triggerOnce?: boolean;
  /** Optional dependency key to force re-evaluating DOM elements on change. */
  key?: string | number;

  // Backwards-compatible options:
  /** Alias for distance */
  y?: number;
  /** Scale factor at start. Default 0.98. */
  scale?: number;
  /** Alias for !triggerOnce */
  bidirectional?: boolean;
  /** Root margin for triggering slightly before or after viewport boundary. */
  rootMargin?: string;
}

/**
 * Standardized hook for genuine direction-aware bi-directional scroll motion.
 * Translating and fading on scroll down (+distance -> 0),
 * smooth tucking on scroll up (-distance -> 0),
 * and re-engaging without visual glitches or jumps.
 *
 * Scoped with useGSAP for clean teardown on unmount or key change.
 * Respects prefersReducedMotion(): instantly makes elements visible with zero transition.
 * Uses clearProps: 'transform,opacity' on completion to avoid subpixel rendering issues.
 */
export function useScrollMotion<T extends HTMLElement = HTMLDivElement>(
  options: ScrollMotionOptions = {}
): RefObject<T> {
  const containerRef = useRef<T>(null);
  const isReduced = useReducedMotion();

  const {
    selector,
    threshold = 0.1,
    stagger = 0.05,
    distance = options.y ?? 24,
    duration = 0.6,
    ease = 'power3.out',
    triggerOnce = options.bidirectional !== undefined ? !options.bidirectional : false,
    key,
    scale = 0.98,
    rootMargin = options.rootMargin ?? '0px 0px -30px 0px',
  } = options;

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container || typeof window === 'undefined') return;

      const reduced = isReduced || prefersReducedMotion();

      const getTargets = (): HTMLElement[] => {
        if (!containerRef.current) return [];
        return selector
          ? Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector))
          : [containerRef.current];
      };

      const initialTargets = getTargets();
      if (!initialTargets.length) return;

      // In reduced motion mode, instantly make all elements visible and clear inline props
      if (reduced) {
        gsap.killTweensOf(initialTargets);
        gsap.set(initialTargets, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'transform,opacity',
        });
        return;
      }

      // If IntersectionObserver is not available, reveal immediately for safety
      if (typeof IntersectionObserver === 'undefined') {
        gsap.killTweensOf(initialTargets);
        gsap.set(initialTargets, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'transform,opacity',
        });
        return;
      }

      // Track scroll position to assist direction-aware calculations
      let lastScrollY = window.scrollY || window.pageYOffset || 0;

      const handleScroll = () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        if (Math.abs(currentY - lastScrollY) > 2) {
          lastScrollY = currentY;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // State tracking per element to avoid duplicate / conflicting transitions
      const stateMap = new WeakMap<
        HTMLElement,
        { isVisible: boolean; hasEntered: boolean }
      >();

      // Initialize elements: elements currently in the viewport get subtle initial reveal,
      // elements outside viewport start hidden.
      initialTargets.forEach((el) => {
        stateMap.set(el, { isVisible: false, hasEntered: false });
        const rect = el.getBoundingClientRect();
        const inInitialView =
          rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;

        if (!inInitialView) {
          gsap.set(el, {
            opacity: 0,
            y: distance,
            scale,
          });
        } else {
          // Elements in initial view: initialize with gentle offset
          gsap.set(el, {
            opacity: 0,
            y: Math.min(distance, 12),
            scale: Math.max(scale, 0.99),
          });
        }
      });

      const observer = new IntersectionObserver(
        (entries) => {
          const entering: HTMLElement[] = [];
          const exiting: HTMLElement[] = [];

          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            const state = stateMap.get(target);

            if (entry.isIntersecting) {
              if (!state || !state.isVisible) {
                stateMap.set(target, { isVisible: true, hasEntered: true });
                entering.push(target);
                if (triggerOnce) {
                  observer.unobserve(target);
                }
              }
            } else {
              // Only trigger exit if it previously entered and triggerOnce is false
              if (!triggerOnce && state?.hasEntered && state.isVisible) {
                stateMap.set(target, { isVisible: false, hasEntered: true });
                exiting.push(target);
              }
            }
          });

          // Direction-aware entrance animation
          if (entering.length > 0) {
            gsap.killTweensOf(entering);
            gsap.to(entering, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration,
              stagger,
              ease,
              overwrite: 'auto',
              clearProps: 'transform,opacity',
            });
          }

          // Direction-aware exit animation (smooth tucking)
          if (exiting.length > 0) {
            gsap.killTweensOf(exiting);
            gsap.to(exiting, {
              opacity: 0.15,
              y: (_index, target) => {
                const rect = target.getBoundingClientRect();
                // If exited through top: tuck gently upward (-12px)
                // If exited through bottom: tuck downward (+distance)
                return rect.top < 0 ? -Math.min(distance * 0.5, 14) : distance;
              },
              scale: Math.max(scale, 0.98),
              duration: Math.max(duration * 0.7, 0.4),
              ease: 'power2.in',
              overwrite: 'auto',
            });
          }
        },
        {
          threshold,
          rootMargin,
        }
      );

      initialTargets.forEach((el) => observer.observe(el));

      // Observe dynamically added elements (e.g. async Dexie live queries)
      let mutationObserver: MutationObserver | null = null;
      if (selector && typeof MutationObserver !== 'undefined') {
        mutationObserver = new MutationObserver(() => {
          if (!containerRef.current) return;
          const currentTargets = Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(selector)
          );
          currentTargets.forEach((el) => {
            if (!stateMap.has(el)) {
              stateMap.set(el, { isVisible: false, hasEntered: false });
              const rect = el.getBoundingClientRect();
              const inInitialView =
                rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;
              if (!inInitialView) {
                gsap.set(el, { opacity: 0, y: distance, scale });
              }
              observer.observe(el);
            }
          });
        });

        mutationObserver.observe(container, {
          childList: true,
          subtree: true,
        });
      }

      // Clean teardown handled by useGSAP
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
        mutationObserver?.disconnect();
        const targets = getTargets();
        targets.forEach((el) => {
          gsap.killTweensOf(el);
          gsap.set(el, { clearProps: 'transform,opacity' });
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [
        selector,
        threshold,
        stagger,
        distance,
        duration,
        ease,
        triggerOnce,
        scale,
        rootMargin,
        isReduced,
        key,
      ],
      revertOnUpdate: true,
    }
  );

  return containerRef;
}
