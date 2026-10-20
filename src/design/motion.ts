import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.dataset.reduceMotion === 'true' ||
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  );
}

export function animateFadeIn(
  element: HTMLElement | null,
  options?: { duration?: number; y?: number; delay?: number }
) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return;
  }

  const duration = options?.duration ?? 0.35;
  const y = options?.y ?? 12;
  const delay = options?.delay ?? 0;

  gsap.fromTo(
    element,
    { opacity: 0, y },
    { opacity: 1, y: 0, duration, delay, ease: 'power3.out' }
  );
}

export function animateModalEnter(element: HTMLElement | null) {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, scale: 1 });
    return;
  }

  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.94, y: 14 },
    { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'power3.out' }
  );
}

export const triggerButtonPop = (target: HTMLElement | null) => {
  if (!target || prefersReducedMotion()) return;
  const icon = target.querySelector('svg') || target;
  gsap.fromTo(
    icon,
    { scale: 0.76 },
    { scale: 1, duration: 0.45, ease: 'back.out(2.5)', overwrite: true }
  );
};

export function animateTaskCompletion(element: HTMLElement | null) {
  if (!element || prefersReducedMotion()) return;
  gsap.fromTo(
    element,
    { scale: 0.8, rotate: -15 },
    { scale: 1.15, rotate: 0, duration: 0.25, ease: 'back.out(2)', yoyo: true, repeat: 1 }
  );
}

export const animateCardsEntrance = (
  container: HTMLElement | null,
  selector = '.glass-panel'
) => {
  if (!container || prefersReducedMotion()) return;
  const cards = container.querySelectorAll(selector);
  if (!cards.length) return;

  gsap.fromTo(
    cards,
    { opacity: 0, y: 18, scale: 0.98 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.05,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    }
  );
};
