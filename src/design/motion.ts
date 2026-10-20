import gsap from 'gsap';

/**
 * Checks if the user has requested reduced motion either via OS or settings.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reusable animation hook for subtle page/card reveals.
 * Automatically respects prefers-reduced-motion.
 */
export function animateFadeIn(
  element: HTMLElement | null,
  options?: { duration?: number; y?: number; delay?: number }
) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return;
  }

  const duration = options?.duration ?? 0.24;
  const y = options?.y ?? 8;
  const delay = options?.delay ?? 0;

  gsap.fromTo(
    element,
    { opacity: 0, y },
    { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
  );
}

/**
 * Animates a dialog/modal entrance with scale and opacity.
 */
export function animateModalEnter(element: HTMLElement | null) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, scale: 1 });
    return;
  }

  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.96, y: 6 },
    { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' }
  );
}

/**
 * Animates task completion checkmark with a brief tactile pulse.
 */
export function animateTaskCompletion(element: HTMLElement | null) {
  if (!element || prefersReducedMotion()) return;
  gsap.fromTo(
    element,
    { scale: 0.8 },
    { scale: 1.15, duration: 0.14, yoyo: true, repeat: 1, ease: 'back.out(2)' }
  );
}
