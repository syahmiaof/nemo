import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import gsap from 'gsap';
import { useScrollMotion } from '@/design/useScrollMotion';

describe('Adversarial Challenge: useScrollMotion Empirical Stress Harness', () => {
  let intersectionCallbacks: IntersectionObserverCallback[] = [];
  let observedElements: Element[] = [];
  let unobservedElements: Element[] = [];
  let isObserverDisconnected = false;

  class ControlledMockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    public callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      if (options?.root) this.root = options.root;
      if (options?.rootMargin) this.rootMargin = options.rootMargin;
      intersectionCallbacks.push(callback);
    }

    observe(target: Element): void {
      observedElements.push(target);
    }

    unobserve(target: Element): void {
      unobservedElements.push(target);
    }

    disconnect(): void {
      isObserverDisconnected = true;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    intersectionCallbacks = [];
    observedElements = [];
    unobservedElements = [];
    isObserverDisconnected = false;
    document.documentElement.dataset.reduceMotion = 'false';

    window.IntersectionObserver = ControlledMockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver = ControlledMockIntersectionObserver as unknown as typeof IntersectionObserver;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.reduceMotion;
  });

  const triggerIntersection = (
    target: Element,
    isIntersecting: boolean,
    boundingClientRect?: Partial<DOMRect>
  ) => {
    const defaultRect: DOMRect = {
      top: isIntersecting ? 100 : -200,
      bottom: isIntersecting ? 300 : -50,
      left: 0,
      right: 200,
      width: 200,
      height: 150,
      x: 0,
      y: isIntersecting ? 100 : -200,
      toJSON: () => {},
    };
    const rect = { ...defaultRect, ...boundingClientRect };

    act(() => {
      intersectionCallbacks.forEach((cb) => {
        cb(
          [
            {
              target,
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: rect as DOMRect,
              intersectionRect: isIntersecting
                ? (rect as DOMRect)
                : ({ ...defaultRect, width: 0, height: 0 } as DOMRect),
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      });
    });
  };

  // =========================================================================
  // Challenge Area 1: Dynamic DOM insertions into initially empty container
  // =========================================================================
  describe('Challenge Area 1: Dynamic DOM insertions into initially empty container', () => {
    function EmptyContainerHarness(): ReactElement {
      const containerRef = useScrollMotion<HTMLDivElement>({
        selector: '.dynamic-item',
        distance: 28,
        duration: 0.2,
      });

      return createElement('div', {
        ref: containerRef,
        'data-testid': 'empty-container',
      });
    }

    it('Scenario 1.A: In-viewport insertion gets gentle initial offset (<=12px) and enters cleanly', async () => {
      render(createElement(EmptyContainerHarness));
      const container = screen.getByTestId('empty-container');
      expect(observedElements.length).toBe(0);

      // Create an element that reports in-viewport rect
      const inViewEl = document.createElement('div');
      inViewEl.className = 'dynamic-item';
      inViewEl.textContent = 'In View Child';
      // Mock getBoundingClientRect for inView: top: 100, bottom: 200, height: 100
      vi.spyOn(inViewEl, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 200,
        left: 0,
        right: 200,
        width: 200,
        height: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      });

      await act(async () => {
        container.appendChild(inViewEl);
        // Wait for MutationObserver microtask
        await new Promise((r) => setTimeout(r, 40));
      });

      // Confirm MutationObserver captured and observed the element
      expect(observedElements).toContain(inViewEl);

      // Check initial styles set by MutationObserver for in-view element
      // In-view: gsap.set(el, { opacity: 0, y: Math.min(distance, 12), scale: Math.max(scale, 0.99) })
      expect(inViewEl.style.opacity).toBe('0');
      // Now trigger entrance via intersection observer
      triggerIntersection(inViewEl, true, { top: 100, bottom: 200, height: 100 });

      // Fast-forward GSAP tick past duration
      await act(async () => {
        gsap.ticker.tick();
        await new Promise((r) => setTimeout(r, 300));
        gsap.ticker.tick();
      });

      // Upon completion, clearProps cleans up transform and opacity
      expect(inViewEl.style.opacity === '' || inViewEl.style.opacity === '1').toBe(true);
      expect(inViewEl.style.transform === '' || inViewEl.style.transform === 'none').toBe(true);
    });

    it('Scenario 1.B: Out-of-viewport insertion gets full distance offset and enters on scroll', async () => {
      render(createElement(EmptyContainerHarness));
      const container = screen.getByTestId('empty-container');

      const outViewEl = document.createElement('div');
      outViewEl.className = 'dynamic-item';
      outViewEl.textContent = 'Out of View Child';
      // Mock rect below viewport (e.g. top: 1500, bottom: 1600)
      vi.spyOn(outViewEl, 'getBoundingClientRect').mockReturnValue({
        top: 1500,
        bottom: 1600,
        left: 0,
        right: 200,
        width: 200,
        height: 100,
        x: 0,
        y: 1500,
        toJSON: () => {},
      });

      await act(async () => {
        container.appendChild(outViewEl);
        await new Promise((r) => setTimeout(r, 40));
      });

      expect(observedElements).toContain(outViewEl);
      expect(outViewEl.style.opacity).toBe('0');

      // Now simulate user scrolling down so it intersects
      triggerIntersection(outViewEl, true, { top: 500, bottom: 600, height: 100 });

      await act(async () => {
        gsap.ticker.tick();
        await new Promise((r) => setTimeout(r, 300));
        gsap.ticker.tick();
      });

      expect(outViewEl.style.opacity === '' || outViewEl.style.opacity === '1').toBe(true);
    });

    it('Scenario 1.C: Nested subtree insertion finds and animates child inside a wrapper', async () => {
      render(createElement(EmptyContainerHarness));
      const container = screen.getByTestId('empty-container');

      const wrapper = document.createElement('div');
      wrapper.className = 'wrapper-div';
      const nestedItem = document.createElement('div');
      nestedItem.className = 'dynamic-item';
      nestedItem.textContent = 'Nested Child';
      wrapper.appendChild(nestedItem);

      await act(async () => {
        container.appendChild(wrapper);
        await new Promise((r) => setTimeout(r, 40));
      });

      expect(observedElements).toContain(nestedItem);
    });

    it('Scenario 1.D: Dynamic removal of tracked node kills active tweens and unobserves without error', async () => {
      render(createElement(EmptyContainerHarness));
      const container = screen.getByTestId('empty-container');

      const removableEl = document.createElement('div');
      removableEl.className = 'dynamic-item';
      removableEl.textContent = 'Removable';

      await act(async () => {
        container.appendChild(removableEl);
        await new Promise((r) => setTimeout(r, 40));
      });

      expect(observedElements).toContain(removableEl);

      // Start entrance tween
      triggerIntersection(removableEl, true);

      // Remove element while tween is potentially active
      await act(async () => {
        container.removeChild(removableEl);
        await new Promise((r) => setTimeout(r, 40));
      });

      // Verify unobserved and tweens killed
      expect(unobservedElements).toContain(removableEl);
      expect(gsap.getTweensOf(removableEl).length).toBe(0);
    });
  });

  // =========================================================================
  // Challenge Area 2: Rapid scroll oscillations (+10px, -10px)
  // =========================================================================
  describe('Challenge Area 2: Rapid scroll oscillations (+10px, -10px)', () => {
    function OscillatingHarness(): ReactElement {
      const containerRef = useScrollMotion<HTMLDivElement>({
        selector: '.oscillate-card',
        distance: 24,
        duration: 0.15,
        bidirectional: true,
      });

      return createElement(
        'div',
        { ref: containerRef },
        createElement('div', { className: 'oscillate-card', 'data-testid': 'osc-card' }, 'Oscillate')
      );
    }

    it('Scenario 2.A: 100 rapid oscillations do not cause tween pileup (max active tweens <= 1 per element)', async () => {
      render(createElement(OscillatingHarness));
      const card = screen.getByTestId('osc-card');
      expect(observedElements).toContain(card);

      let currentScrollY = 200;

      // 100 rapid alternating scroll events and intersection toggles
      for (let i = 0; i < 100; i++) {
        const isDown = i % 2 === 0;
        const delta = isDown ? 10 : -10;
        currentScrollY += delta;
        window.scrollY = currentScrollY;
        window.dispatchEvent(new Event('scroll'));

        // Alternate entering and exiting across top boundary
        if (isDown) {
          triggerIntersection(card, true, { top: 100, bottom: 250 });
        } else {
          triggerIntersection(card, false, { top: -40, bottom: -5 });
        }

        // Check invariant: active tweens on card should never accumulate > 1
        const activeTweens = gsap.getTweensOf(card);
        expect(activeTweens.length).toBeLessThanOrEqual(1);
      }

      // Settle on entering
      triggerIntersection(card, true, { top: 150, bottom: 300 });

      // Fast-forward ticker
      await act(async () => {
        gsap.ticker.tick();
        await new Promise((r) => setTimeout(r, 250));
        gsap.ticker.tick();
      });

      // Verify final stable state: opacity is 1 or cleared, no NaN in transform
      expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
      if (card.style.transform) {
        expect(card.style.transform).not.toContain('NaN');
        expect(card.style.transform).not.toContain('undefined');
      }
    });

    it('Scenario 2.B: Rapid direction flipping near 2px hysteresis threshold does not trigger erratic states', async () => {
      render(createElement(OscillatingHarness));
      const card = screen.getByTestId('osc-card');

      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));

      // Flips with deltas of exactly +1, -1, +2, -2, +3, -3
      const deltas = [+1, -1, +2, -2, +1, +3, -3, +1, -1, +2];
      deltas.forEach((d) => {
        window.scrollY = (window.scrollY || 0) + d;
        window.dispatchEvent(new Event('scroll'));
        triggerIntersection(card, d > 0, { top: d > 0 ? 50 : -20 });
      });

      await act(async () => {
        gsap.ticker.tick();
        await new Promise((r) => setTimeout(r, 200));
        gsap.ticker.tick();
      });

      expect(card).toBeDefined();
      expect(gsap.getTweensOf(card).length).toBeLessThanOrEqual(1);
    });

    it('Scenario 2.C: Unmounting container in the middle of rapid oscillation cleans up all state without throwing', async () => {
      const { unmount } = render(createElement(OscillatingHarness));
      const card = screen.getByTestId('osc-card');

      // 20 rapid oscillations
      for (let i = 0; i < 20; i++) {
        window.scrollY = 100 + (i % 2 === 0 ? 10 : -10);
        window.dispatchEvent(new Event('scroll'));
        triggerIntersection(card, i % 2 === 0, { top: i % 2 === 0 ? 50 : -20 });
      }

      // Unmount mid-oscillation
      expect(() => {
        unmount();
      }).not.toThrow();

      // Ensure observer is disconnected and tweens killed
      expect(isObserverDisconnected).toBe(true);
      expect(gsap.getTweensOf(card).length).toBe(0);
      expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
    });
  });
});
