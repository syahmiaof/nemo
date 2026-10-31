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
 * Uses clearProps: 'transform,opacity,clipPath' on completion to avoid subpixel rendering issues.
 */
export function useScrollMotion<T extends HTMLElement = HTMLDivElement>(
  options: ScrollMotionOptions = {}
): RefObject<T> {
  const containerRef = useRef<T>(null);
  const isReduced = useReducedMotion();

  const {
    selector,
    threshold = options.threshold ?? 0.05,
    stagger = 0.05,
    distance = options.y ?? 24,
    duration = 0.6,
    ease = 'power3.out',
    triggerOnce = options.bidirectional !== undefined ? !options.bidirectional : false,
    key,
    scale = 0.98,
    rootMargin = options.rootMargin ?? '0px 0px 50px 0px',
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

      // In reduced motion mode, instantly make all elements visible and clear inline props
      if (reduced) {
        if (initialTargets.length > 0) {
          gsap.killTweensOf(initialTargets);
          gsap.set(initialTargets, {
            opacity: 1,
            y: 0,
            scale: 1,
            clearProps: 'transform,opacity,clipPath',
          });
        }
        return;
      }

      // If IntersectionObserver is not available, reveal immediately for safety
      if (typeof IntersectionObserver === 'undefined') {
        if (initialTargets.length > 0) {
          gsap.killTweensOf(initialTargets);
          gsap.set(initialTargets, {
            opacity: 1,
            y: 0,
            scale: 1,
            clearProps: 'transform,opacity,clipPath',
          });
        }
        return;
      }

      // Track scroll position to assist direction-aware calculations
      let lastScrollY =
        typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;
      let scrollDirection: 'down' | 'up' = 'down';

      const handleScroll = () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        const delta = currentY - lastScrollY;
        if (Math.abs(delta) >= 2) {
          scrollDirection = delta > 0 ? 'down' : 'up';
          lastScrollY = currentY;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // State tracking per element to avoid duplicate / conflicting transitions
      const stateMap = new WeakMap<
        HTMLElement,
        { isVisible: boolean; hasEntered: boolean }
      >();

      // Track all registered elements for reliable teardown even if ref detaches before unmount
      const trackedElements = new Set<HTMLElement>();

      // Initialize elements: elements currently in the viewport animate into view immediately,
      // elements outside viewport start hidden until scrolled into view.
      const initialEntering: HTMLElement[] = [];
      initialTargets.forEach((el) => {
        trackedElements.add(el);
        const rect = el.getBoundingClientRect();
        const inInitialView =
          rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;

        if (!inInitialView) {
          stateMap.set(el, { isVisible: false, hasEntered: false });
          gsap.set(el, {
            opacity: 0,
            y: distance,
            scale,
          });
        } else {
          stateMap.set(el, { isVisible: true, hasEntered: true });
          initialEntering.push(el);
        }
      });

      if (initialEntering.length > 0) {
        initialEntering.forEach((el, index) => {
          gsap.killTweensOf(el);
          gsap.fromTo(
            el,
            {
              opacity: 0,
              y: Math.min(distance, 14),
              scale: Math.max(scale, 0.99),
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration,
              delay: index * stagger,
              ease,
              overwrite: 'auto',
              clearProps: 'transform,opacity,clipPath',
            }
          );
        });
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entering: HTMLElement[] = [];
          const exiting: { el: HTMLElement; rect: DOMRectReadOnly }[] = [];

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
                exiting.push({ el: target, rect: entry.boundingClientRect });
              }
            }
          });

          // Direction-aware entrance animation
          if (entering.length > 0) {
            entering.forEach((el, index) => {
              gsap.killTweensOf(el);
              gsap.to(el, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration,
                delay: index * stagger,
                ease,
                overwrite: 'auto',
                clearProps: 'transform,opacity,clipPath',
              });
            });
          }

          // Direction-aware exit animation (smooth tucking with ZERO layout thrashing)
          if (exiting.length > 0) {
            exiting.forEach(({ el, rect }, index) => {
              gsap.killTweensOf(el);
              gsap.to(el, {
                opacity: 0.15,
                y: () => {
                  // Use boundingClientRect provided directly by IntersectionObserver without forced reflow
                  const isExitingTop =
                    rect.top < 0 || (rect.bottom <= 0 && scrollDirection === 'down');
                  return isExitingTop ? -Math.min(distance * 0.5, 14) : distance;
                },
                scale: Math.max(scale, 0.98),
                duration: duration * 0.75,
                delay: index * (stagger * 0.5),
                ease: 'power2.in',
                overwrite: 'auto',
              });
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
      const MutationObserverClass =
        typeof window !== 'undefined' && window.MutationObserver
          ? window.MutationObserver
          : typeof MutationObserver !== 'undefined'
          ? MutationObserver
          : undefined;

      if (selector && MutationObserverClass) {
        mutationObserver = new MutationObserverClass((mutations) => {
          if (!containerRef.current) return;

          // Clean up removed nodes: only act if element is genuinely disconnected from container
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (
                node instanceof HTMLElement &&
                containerRef.current &&
                !containerRef.current.contains(node)
              ) {
                gsap.killTweensOf(node);
                gsap.getTweensOf(node).forEach((t) => t.kill());
                observer.unobserve(node);
                trackedElements.delete(node);
                stateMap.delete(node);
              }
            });
          });

          // Handle dynamically added nodes
          const candidates: HTMLElement[] = [];
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement && containerRef.current?.contains(node)) {
                if (node.matches(selector)) {
                  candidates.push(node);
                }
                candidates.push(
                  ...Array.from(node.querySelectorAll<HTMLElement>(selector))
                );
              }
            });
          });

          if (candidates.length > 0) {
            candidates.forEach((el) => {
              if (trackedElements.has(el)) return;
              trackedElements.add(el);

              const rect = el.getBoundingClientRect();
              const inInitialView =
                rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;

              if (!inInitialView) {
                stateMap.set(el, { isVisible: false, hasEntered: false });
                gsap.set(el, {
                  opacity: 0,
                  y: distance,
                  scale,
                });
              } else {
                stateMap.set(el, { isVisible: false, hasEntered: false });
                gsap.set(el, {
                  opacity: 0,
                  y: Math.min(distance, 12),
                  scale: Math.max(scale, 0.99),
                });
              }
              observer.observe(el);
            });
          }
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
        trackedElements.forEach((el) => {
          gsap.killTweensOf(el);
          gsap.getTweensOf(el).forEach((t) => t.kill());
          gsap.set(el, { clearProps: 'transform,opacity,clipPath' });
        });
        trackedElements.clear();
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
