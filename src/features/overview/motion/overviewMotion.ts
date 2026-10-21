import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/design/motion';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Checks whether ScrollTrigger is available and registered.
 */
export function isScrollTriggerActive(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return Boolean((gsap.plugins as Record<string, unknown>)?.scrollTrigger);
}

/**
 * Creates bi-directional scroll animation on an element.
 * When scrolling down into view: lifts y: 16 -> 0, scale: 0.98 -> 1, opacity: 0 -> 1.
 * When scrolling up or down out of view: smoothly reverses or reacts so there is lively motion throughout.
 * Automatically respects prefers-reduced-motion.
 */
export function setupBiDirectionalScrollMotion(
  element: HTMLElement | null,
  options?: {
    liftY?: number;
    scaleFrom?: number;
    staggerChildren?: string;
    start?: string;
    end?: string;
    delay?: number;
    duration?: number;
  }
): ScrollTrigger | null {
  if (!element || typeof window === 'undefined') return null;

  if (prefersReducedMotion() || !isScrollTriggerActive()) {
    gsap.set(element, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
    if (options?.staggerChildren) {
      const children = element.querySelectorAll<HTMLElement>(options.staggerChildren);
      gsap.set(children, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
    }
    return null;
  }

  const liftY = options?.liftY ?? 16;
  const scaleFrom = options?.scaleFrom ?? 0.98;
  const duration = options?.duration ?? 0.65;
  const start = options?.start ?? 'top 88%';
  const end = options?.end ?? 'bottom 12%';

  // If there are child elements to stagger (e.g., cards inside grid)
  if (options?.staggerChildren) {
    const children = element.querySelectorAll<HTMLElement>(options.staggerChildren);
    if (children.length > 0) {
      gsap.set(children, { opacity: 0, y: liftY, scale: scaleFrom });
      const tween = gsap.to(children, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        stagger: 0.08,
        ease: 'power3.out',
        force3D: true,
      });

      return ScrollTrigger.create({
        trigger: element,
        start,
        end,
        toggleActions: 'play reverse play reverse',
        animation: tween,
      });
    }
  }

  // Animate the element itself
  gsap.set(element, { opacity: 0, y: liftY, scale: scaleFrom });
  const tween = gsap.to(element, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration,
    ease: 'power3.out',
    force3D: true,
  });

  return ScrollTrigger.create({
    trigger: element,
    start,
    end,
    toggleActions: 'play reverse play reverse',
    animation: tween,
  });
}

/**
 * Signature task completion button pop animation.
 */
export function animateTaskCompletionPop(button: HTMLElement | null) {
  if (!button || prefersReducedMotion()) return;
  const svg = button.querySelector('svg') || button;
  gsap.fromTo(
    svg,
    { scale: 0.7, rotate: -20 },
    { scale: 1.25, rotate: 8, duration: 0.22, ease: 'back.out(2.5)', yoyo: true, repeat: 1 }
  );
}

/**
 * Focus ticket deal animation on entrance / re-order.
 */
export function animateFocusTicketsEntrance(container: HTMLElement | null) {
  if (!container || prefersReducedMotion()) return;
  const tickets = container.querySelectorAll<HTMLElement>('.focus-ticket');
  if (!tickets.length) return;

  gsap.fromTo(
    tickets,
    { opacity: 0, y: 18, scale: 0.95, rotateX: 6 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      duration: 0.52,
      stagger: 0.08,
      ease: 'back.out(1.5)',
      force3D: true,
      clearProps: 'transform,opacity',
    }
  );
}

/**
 * Focus ticket removal slide-out animation.
 */
export function animateTicketRemoval(ticket: HTMLElement, onDone: () => void) {
  if (prefersReducedMotion()) {
    onDone();
    return;
  }

  gsap.to(ticket, {
    opacity: 0,
    x: 28,
    scale: 0.92,
    duration: 0.24,
    ease: 'power2.in',
    onComplete: onDone,
  });
}

/**
 * Donut gauge stroke fill and count-up animation.
 */
export function animateDonutGauge(
  circle: SVGCircleElement | null,
  label: HTMLElement | null,
  targetRatio: number,
  triggerElement?: HTMLElement | null
) {
  if (!circle) return;

  const circumference = 389.5;
  const targetDash = (targetRatio / 100) * circumference;

  if (prefersReducedMotion()) {
    circle.setAttribute('stroke-dasharray', `${targetDash} ${circumference}`);
    if (label) label.innerText = `${targetRatio}%`;
    return;
  }

  const hasST = isScrollTriggerActive() && triggerElement;

  const animObj = { ratio: 0 };
  const tl = gsap.timeline({
    scrollTrigger: hasST
      ? {
          trigger: triggerElement,
          start: 'top 88%',
          end: 'bottom 12%',
          toggleActions: 'play reverse play reverse',
        }
      : undefined,
  });

  tl.fromTo(
    circle,
    { strokeDasharray: `0 ${circumference}` },
    { strokeDasharray: `${targetDash} ${circumference}`, duration: 1.3, ease: 'power3.out' },
    0
  );

  if (label) {
    tl.to(
      animObj,
      {
        ratio: targetRatio,
        duration: 1.3,
        ease: 'power3.out',
        onUpdate: () => {
          label.innerText = `${Math.round(animObj.ratio)}%`;
        },
      },
      0
    );
  }
}

/**
 * Animated progress bar fill.
 */
export function animateProgressBar(
  bar: HTMLElement | null,
  targetPercent: number,
  triggerElement?: HTMLElement | null
) {
  if (!bar) return;

  if (prefersReducedMotion()) {
    bar.style.width = `${targetPercent}%`;
    return;
  }

  const hasST = isScrollTriggerActive() && triggerElement;

  gsap.fromTo(
    bar,
    { width: '0%' },
    {
      width: `${targetPercent}%`,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: hasST
        ? {
            trigger: triggerElement,
            start: 'top 88%',
            end: 'bottom 12%',
            toggleActions: 'play reverse play reverse',
          }
        : undefined,
    }
  );
}

/**
 * Smooth metric switch cross-fade.
 */
export function animateMetricSwitch(container: HTMLElement | null) {
  if (!container || prefersReducedMotion()) return;
  gsap.fromTo(
    container,
    { opacity: 0.35, y: 5 },
    { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', force3D: true }
  );
}
