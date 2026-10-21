import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, useState, type ReactElement } from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import gsap from 'gsap';
import { useScrollMotion } from '@/design/useScrollMotion';

describe('Empirical Challenge: useScrollMotion Extreme Scenarios', () => {
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

    // Install controlled mock
    window.IntersectionObserver = ControlledMockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver = ControlledMockIntersectionObserver as unknown as typeof IntersectionObserver;

    // Default matchMedia
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

  // Helper to trigger intersection for observed elements
  const triggerIntersection = (target: Element, isIntersecting: boolean, boundingClientRect?: Partial<DOMRect>) => {
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
              intersectionRect: isIntersecting ? (rect as DOMRect) : ({ ...defaultRect, width: 0, height: 0 } as DOMRect),
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
  // SCENARIO 1: Zero matching elements in container
  // =========================================================================
  describe('Scenario 1: Zero matching elements in container', () => {
    function ZeroElementsTestComponent({ initialCount = 0 }: { initialCount?: number }): ReactElement {
      const [count, setCount] = useState(initialCount);
      const containerRef = useScrollMotion<HTMLDivElement>({
        selector: '.motion-item',
        distance: 24,
      });

      return createElement(
        'div',
        { ref: containerRef, 'data-testid': 'container' },
        createElement(
          'button',
          {
            'data-testid': 'add-btn',
            onClick: () => setCount((c) => c + 1),
          },
          'Add'
        ),
        Array.from({ length: count }).map((_, i) =>
          createElement('div', { key: i, className: 'motion-item', 'data-testid': `item-${i}` }, `Item ${i}`)
        )
      );
    }

    it('1.1: Mounts cleanly without exceptions when 0 matching elements are present', () => {
      expect(() => {
        render(createElement(ZeroElementsTestComponent, { initialCount: 0 }));
      }).not.toThrow();

      const container = screen.getByTestId('container');
      expect(container).toBeDefined();
      expect(observedElements.length).toBe(0);
    });

    it('1.2: Behavior when elements are dynamically added after initial mount with 0 elements (WITHOUT key change)', async () => {
      render(createElement(ZeroElementsTestComponent, { initialCount: 0 }));
      expect(observedElements.length).toBe(0);

      // Now add 3 items via React state update without changing key
      const addBtn = screen.getByTestId('add-btn');
      await act(async () => {
        addBtn.click();
        addBtn.click();
        addBtn.click();
      });

      const items = screen.getAllByTestId(/item-/);
      expect(items.length).toBe(3);

      // REPAIRED BEHAVIOR: MutationObserver is created on mount even if initialTargets.length === 0,
      // so dynamically added elements without key prop changes are now observed!
      expect(observedElements.length).toBe(3);
    });

    it('1.3: Elements added with key prop update ARE properly observed', async () => {
      function KeyedTestComponent({ count }: { count: number }): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.motion-item',
          distance: 24,
          key: count,
        });

        return createElement(
          'div',
          { ref: containerRef, 'data-testid': 'keyed-container' },
          Array.from({ length: count }).map((_, i) =>
            createElement('div', { key: i, className: 'motion-item', 'data-testid': `keyed-item-${i}` }, `Keyed Item ${i}`)
          )
        );
      }

      const { rerender } = render(createElement(KeyedTestComponent, { count: 0 }));
      expect(observedElements.length).toBe(0);

      // Update with key change (0 -> 3)
      rerender(createElement(KeyedTestComponent, { count: 3 }));

      // With key change, useGSAP re-executes and registers the new elements
      expect(observedElements.length).toBe(3);
    });

    it('1.4: MutationObserver DOES pick up dynamic nodes if container had at least 1 seed element at mount', async () => {
      function SeededComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.seeded-item',
          distance: 20,
        });

        return createElement(
          'div',
          { ref: containerRef, 'data-testid': 'seeded-container' },
          createElement('div', { className: 'seeded-item', 'data-testid': 'seed-0' }, 'Seed')
        );
      }

      render(createElement(SeededComponent));
      const container = screen.getByTestId('seeded-container');
      expect(observedElements.length).toBe(1);

      // Add dynamic element directly via DOM mutation
      const dynamicEl = document.createElement('div');
      dynamicEl.className = 'seeded-item';
      dynamicEl.textContent = 'Added via Mutation';

      await act(async () => {
        container.appendChild(dynamicEl);
        await new Promise((r) => setTimeout(r, 40));
      });

      // Because container had >=1 initial element, MutationObserver was initialized
      // and dynamicEl is observed!
      expect(observedElements).toContain(dynamicEl);
      expect(observedElements.length).toBe(2);
    });
  });

  // =========================================================================
  // SCENARIO 2: Dynamic insertion of 100+ DOM nodes while scrolling
  // =========================================================================
  describe('Scenario 2: Dynamic insertion of 100+ DOM nodes while scrolling', () => {
    it('2.1: Handles dynamic insertion of 120 DOM nodes directly into container without crashing', async () => {
      function ContainerWithInitialItems(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.dynamic-card',
          distance: 20,
          stagger: 0.01,
          duration: 0.3,
        });

        return createElement(
          'div',
          { ref: containerRef, 'data-testid': 'dyn-container' },
          createElement('div', { className: 'dynamic-card', 'data-testid': 'seed-item' }, 'Seed')
        );
      }

      const { unmount } = render(createElement(ContainerWithInitialItems));
      const container = screen.getByTestId('dyn-container');

      expect(observedElements.length).toBe(1);

      const startTime = performance.now();

      // Insert 120 DOM nodes directly into container while simulating scroll
      await act(async () => {
        for (let i = 0; i < 120; i++) {
          const el = document.createElement('div');
          el.className = 'dynamic-card';
          el.textContent = `Dynamic Card ${i}`;
          container.appendChild(el);

          // Interleave with scroll events every 20 nodes
          if (i % 20 === 0) {
            window.scrollY = i * 10;
            window.dispatchEvent(new Event('scroll'));
          }
        }
      });

      const elapsed = performance.now() - startTime;
      expect(elapsed).toBeGreaterThan(0);

      // Verify no exceptions were thrown
      expect(container.querySelectorAll('.dynamic-card').length).toBe(121);

      // Wait a tick for MutationObserver microtask to fire
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Verify all 121 cards are observed
      expect(observedElements.length).toBe(121);

      // Verify clean unmount without lingering errors
      expect(() => {
        unmount();
      }).not.toThrow();

      expect(isObserverDisconnected).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 3: Rapid alternation of scroll direction (scroll delta oscillating +10, -10)
  // =========================================================================
  describe('Scenario 3: Rapid alternation of scroll direction (scroll delta oscillating +10, -10)', () => {
    it('3.1: Survives 50 rapid alternating intersection toggles and clears inline styles on enter completion', async () => {
      function OscillatingComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.target-card',
          distance: 24,
          duration: 0.1,
          bidirectional: true,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'target-card', 'data-testid': 'target' }, 'Target')
        );
      }

      render(createElement(OscillatingComponent));
      const target = screen.getByTestId('target');

      expect(observedElements).toContain(target);

      // Simulate 50 rapid oscillations back and forth (+10 / -10) across intersection threshold
      for (let i = 0; i < 50; i++) {
        const isEntering = i % 2 === 0;
        const scrollDelta = isEntering ? 10 : -10;
        window.scrollY = Math.max(0, (window.scrollY || 0) + scrollDelta);
        window.dispatchEvent(new Event('scroll'));

        // Toggle intersection
        triggerIntersection(target, isEntering, {
          top: isEntering ? 50 : -25, // top exit tucking simulation
        });
      }

      // Finally settle on entering (in-view)
      triggerIntersection(target, true, { top: 150 });

      // Fast-forward GSAP tweens past duration
      await act(async () => {
        gsap.ticker.tick();
        await new Promise((r) => setTimeout(r, 200));
        gsap.ticker.tick();
      });

      // Verify target did not throw and style transform/opacity are cleared or opacity is 1
      expect(target).toBeDefined();
      // On entrance complete, clearProps: 'transform,opacity' removes inline transform and opacity
      expect(target.style.opacity === '' || target.style.opacity === '1').toBe(true);
      expect(target.style.transform === '' || target.style.transform.includes('matrix')).toBe(true);
    });

    it('3.2: Exiting element receives tucking transform and opacity 0.15 without throwing', async () => {
      function ExitTestComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.exit-card',
          distance: 24,
          duration: 0.1,
          bidirectional: true,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'exit-card', 'data-testid': 'exit-card' }, 'Exit Card')
        );
      }

      render(createElement(ExitTestComponent));
      const target = screen.getByTestId('exit-card');

      // First enter
      triggerIntersection(target, true, { top: 200 });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 150));
        gsap.ticker.tick();
      });

      // Now exit through top (rect.top < 0)
      triggerIntersection(target, false, { top: -50, bottom: -10 });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 500));
        gsap.ticker.tick();
      });

      // Target should have exit opacity 0.15
      expect(parseFloat(target.style.opacity)).toBeCloseTo(0.15, 1);
    });
  });

  // =========================================================================
  // SCENARIO 4: Key prop changes triggering complete re-initialization
  // =========================================================================
  describe('Scenario 4: Key prop changes triggering complete re-initialization', () => {
    it('4.1: Re-initializes cleanly across rapid key prop transitions (1 -> 10)', async () => {
      function RapidKeyComponent({ keyVal }: { keyVal: number }): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.key-item',
          distance: 20,
          key: keyVal,
        });

        return createElement(
          'div',
          { ref: containerRef, 'data-testid': 'key-container' },
          createElement('div', { className: 'key-item', 'data-testid': 'item-1' }, `Item for key ${keyVal}`)
        );
      }

      const { rerender, unmount } = render(createElement(RapidKeyComponent, { keyVal: 1 }));
      expect(observedElements.length).toBe(1);

      // Rapidly update key prop 10 times
      for (let k = 2; k <= 10; k++) {
        act(() => {
          rerender(createElement(RapidKeyComponent, { keyVal: k }));
        });
      }

      // Final unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // SCENARIO 5: Reduced motion flag enabled via dataset.reduceMotion = 'true'
  // =========================================================================
  describe('Scenario 5: Reduced motion flag enabled via dataset.reduceMotion = true', () => {
    it('5.1: Forces instant visibility with opacity 1, y 0, and clearProps when reduceMotion is initially true', () => {
      document.documentElement.dataset.reduceMotion = 'true';

      function ReducedMotionComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.reduced-card',
          distance: 30,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'reduced-card', 'data-testid': 'reduced-card' }, 'Reduced Motion Card')
        );
      }

      render(createElement(ReducedMotionComponent));
      const card = screen.getByTestId('reduced-card');

      // In reduced motion mode, NO intersection observer should be observing it
      expect(observedElements).not.toContain(card);
      // clearProps was called, so inline opacity is empty or 1
      expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
      expect(card.style.transform === '' || card.style.transform === 'none').toBe(true);
    });

    it('5.2: Dynamically setting dataset.reduceMotion = true triggers immediate visibility and clears styles', async () => {
      document.documentElement.dataset.reduceMotion = 'false';

      function DynamicReducedComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.dyn-reduced-card',
          distance: 30,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'dyn-reduced-card', 'data-testid': 'dyn-reduced-card' }, 'Card')
        );
      }

      render(createElement(DynamicReducedComponent));
      const card = screen.getByTestId('dyn-reduced-card');

      // Initially observed
      expect(observedElements).toContain(card);

      // Now toggle dataset.reduceMotion to 'true'
      await act(async () => {
        document.documentElement.dataset.reduceMotion = 'true';
        // Trigger mutation observer on document.documentElement
        await new Promise((r) => setTimeout(r, 60));
      });

      // Hook re-runs with isReduced = true, elements are forced visible and props cleared
      expect(card).toBeDefined();
      expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 6: Edge Cases: Unmount mid-tween, triggerOnce, container target, no-IO fallback
  // =========================================================================
  describe('Scenario 6: Edge Cases & Robustness Invariants', () => {
    it('6.1: Clean teardown when unmounted mid-animation without leaking tweens or stuck styles', async () => {
      function MidTweenComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.mid-tween-card',
          distance: 40,
          duration: 1.0,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'mid-tween-card', 'data-testid': 'mid-card' }, 'Mid-Tween')
        );
      }

      const { unmount } = render(createElement(MidTweenComponent));
      const target = screen.getByTestId('mid-card');

      // Start entrance animation
      triggerIntersection(target, true, { top: 100 });

      // Fast-forward slightly (mid-tween)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
        gsap.ticker.tick();
      });

      // Unmount while tween is active
      expect(() => {
        unmount();
      }).not.toThrow();

      // Inline styles should be cleared by teardown handler
      expect(target.style.opacity === '' || target.style.opacity === '1').toBe(true);
    });

    it('6.2: triggerOnce mode unobserves target upon entrance and prevents exit resets', async () => {
      function TriggerOnceComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.once-card',
          distance: 24,
          triggerOnce: true,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'once-card', 'data-testid': 'once-card' }, 'Once Card')
        );
      }

      render(createElement(TriggerOnceComponent));
      const target = screen.getByTestId('once-card');

      expect(observedElements).toContain(target);

      // Trigger entrance
      triggerIntersection(target, true, { top: 100 });

      // In triggerOnce mode, observer.unobserve(target) is called on enter
      expect(unobservedElements).toContain(target);

      // Trigger exit should not tuck or hide
      triggerIntersection(target, false, { top: -200 });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
        gsap.ticker.tick();
      });

      // Target remains visible (not tucked to 0.15)
      expect(target.style.opacity === '' || parseFloat(target.style.opacity) > 0.8).toBe(true);
    });

    it('6.3: Operates directly on container when selector is omitted', () => {
      function ContainerDirectComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          distance: 20,
        });

        return createElement(
          'div',
          { ref: containerRef, 'data-testid': 'self-animated-container' },
          createElement('span', null, 'Inner Content')
        );
      }

      render(createElement(ContainerDirectComponent));
      const container = screen.getByTestId('self-animated-container');

      // The container itself is observed
      expect(observedElements).toContain(container);
    });

    it('6.4: Graceful zero-cost fallback when IntersectionObserver is not available', () => {
      // Temporarily remove IntersectionObserver
      const originalIO = window.IntersectionObserver;
      // @ts-expect-error simulating legacy/unsupported environment
      delete window.IntersectionObserver;
      // @ts-expect-error simulating legacy/unsupported environment
      delete globalThis.IntersectionObserver;

      function FallbackComponent(): ReactElement {
        const containerRef = useScrollMotion<HTMLDivElement>({
          selector: '.fallback-card',
          distance: 24,
        });

        return createElement(
          'div',
          { ref: containerRef },
          createElement('div', { className: 'fallback-card', 'data-testid': 'fallback-card' }, 'Fallback')
        );
      }

      expect(() => {
        render(createElement(FallbackComponent));
      }).not.toThrow();

      const card = screen.getByTestId('fallback-card');
      // Should immediately be made visible
      expect(card.style.opacity === '' || card.style.opacity === '1').toBe(true);

      // Restore IO
      window.IntersectionObserver = originalIO;
      globalThis.IntersectionObserver = originalIO;
    });
  });
});
