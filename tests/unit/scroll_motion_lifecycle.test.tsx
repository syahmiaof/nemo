import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import gsap from 'gsap';
import { useScrollMotion, type ScrollMotionOptions } from '@/design/useScrollMotion';

// Controlled harness component
function MotionStressHarness({
  options,
  itemCount = 3,
}: {
  options?: ScrollMotionOptions;
  itemCount?: number;
}) {
  const containerRef = useScrollMotion<HTMLDivElement>(options);
  const items = Array.from({ length: itemCount }, (_, i) => i + 1);

  return createElement(
    'div',
    { ref: containerRef, 'data-testid': 'motion-container', className: 'motion-container' },
    items.map((num) =>
      createElement(
        'div',
        {
          key: num,
          className: 'motion-card',
          'data-testid': `motion-card-${num}`,
        },
        `Item ${num}`
      )
    )
  );
}

// Dynamic key harness to test dependency re-runs
function DynamicKeyHarness({
  options,
  currentKey,
}: {
  options?: ScrollMotionOptions;
  currentKey: string | number;
}) {
  const containerRef = useScrollMotion<HTMLDivElement>({
    ...options,
    key: currentKey,
  });

  return createElement(
    'div',
    { ref: containerRef, 'data-testid': 'key-container' },
    createElement('div', { className: 'motion-item', 'data-testid': 'key-item' }, 'Dynamic Item')
  );
}

describe('useScrollMotion Lifecycle & Stress Test Harness', () => {
  beforeEach(() => {
    cleanup();
    gsap.killTweensOf('*');
    document.documentElement.dataset.reduceMotion = 'false';
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    gsap.killTweensOf('*');
    document.documentElement.dataset.reduceMotion = 'false';
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. 50x Rapid Mount and Unmount Stress Test
  // ==========================================================================
  it('stress-tests 50x rapid mount and unmount cycles without leaking listeners or observers', () => {
    // Track active event listeners on window
    const activeScrollListeners = new Set<EventListenerOrEventListenerObject>();
    const origAddEventListener = window.addEventListener.bind(window);
    const origRemoveEventListener = window.removeEventListener.bind(window);

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(
      (type, listener, options) => {
        if (type === 'scroll') {
          activeScrollListeners.add(listener);
        }
        return origAddEventListener(type, listener, options);
      }
    );

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(
      (type, listener, options) => {
        if (type === 'scroll') {
          activeScrollListeners.delete(listener);
        }
        return origRemoveEventListener(type, listener, options);
      }
    );

    // Track IntersectionObserver instances and disconnect calls
    const createdObservers: IntersectionObserver[] = [];
    const disconnectedObservers = new Set<IntersectionObserver>();

    const OrigIO = window.IntersectionObserver;
    class InstrumentedIO implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [];
      private instance: IntersectionObserver;

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.instance = new OrigIO(callback, options);
        createdObservers.push(this as unknown as IntersectionObserver);
      }

      observe(target: Element): void {
        this.instance.observe(target);
      }
      unobserve(target: Element): void {
        this.instance.unobserve(target);
      }
      disconnect(): void {
        disconnectedObservers.add(this as unknown as IntersectionObserver);
        this.instance.disconnect();
      }
      takeRecords(): IntersectionObserverEntry[] {
        return this.instance.takeRecords();
      }
    }
    window.IntersectionObserver = InstrumentedIO as unknown as typeof IntersectionObserver;

    // Track MutationObserver disconnect calls
    const createdMutationObservers: MutationObserver[] = [];
    const disconnectedMutationObservers = new Set<MutationObserver>();

    const OrigMO = window.MutationObserver;
    if (typeof OrigMO !== 'undefined') {
      class InstrumentedMO implements MutationObserver {
        private instance: MutationObserver;
        private isTracked = false;
        constructor(callback: MutationCallback) {
          this.instance = new OrigMO(callback);
        }
        observe(target: Node, options?: MutationObserverInit): void {
          if ((target as HTMLElement)?.classList?.contains('motion-container')) {
            this.isTracked = true;
            createdMutationObservers.push(this as unknown as MutationObserver);
          }
          this.instance.observe(target, options);
        }
        disconnect(): void {
          if (this.isTracked) {
            disconnectedMutationObservers.add(this as unknown as MutationObserver);
          }
          this.instance.disconnect();
        }
        takeRecords(): MutationRecord[] {
          return this.instance.takeRecords();
        }
      }
      window.MutationObserver = InstrumentedMO as unknown as typeof MutationObserver;
    }

    const MOUNT_CYCLES = 50;

    // Execute 50 rapid mount and unmount cycles
    for (let i = 0; i < MOUNT_CYCLES; i++) {
      const { unmount, getByTestId } = render(
        createElement(MotionStressHarness, {
          options: { selector: '.motion-card' },
        })
      );

      const card = getByTestId('motion-card-1');
      expect(card).toBeDefined();

      // Rapidly unmount
      act(() => {
        unmount();
      });
    }

    // 1. Verify exact balance of addEventListener and removeEventListener for 'scroll'
    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(activeScrollListeners.size).toBe(0);

    // 2. Verify all 50 IntersectionObserver instances were cleanly disconnected
    expect(createdObservers.length).toBe(MOUNT_CYCLES);
    expect(disconnectedObservers.size).toBe(MOUNT_CYCLES);

    // 3. Verify all 50 MutationObserver instances were cleanly disconnected
    if (createdMutationObservers.length > 0) {
      expect(createdMutationObservers.length).toBe(MOUNT_CYCLES);
      expect(disconnectedMutationObservers.size).toBe(MOUNT_CYCLES);
    }

    // Restore original observers
    window.IntersectionObserver = OrigIO;
    if (typeof OrigMO !== 'undefined') {
      window.MutationObserver = OrigMO;
    }
  });

  // ==========================================================================
  // 2. 50x Rapid Key Change Stress Test (Re-initialization without leak)
  // ==========================================================================
  it('stress-tests 50x rapid key updates ensuring previous observers and listeners are torn down', () => {
    const activeScrollListeners = new Set<EventListenerOrEventListenerObject>();
    const origAdd = window.addEventListener.bind(window);
    const origRemove = window.removeEventListener.bind(window);

    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'scroll') activeScrollListeners.add(listener);
      return origAdd(type, listener, options);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener, options) => {
      if (type === 'scroll') activeScrollListeners.delete(listener);
      return origRemove(type, listener, options);
    });

    let disconnectCount = 0;
    const OrigIO = window.IntersectionObserver;
    class InstrumentedIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      private instance: IntersectionObserver;
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        this.instance = new OrigIO(cb, opts);
      }
      observe(t: Element) { this.instance.observe(t); }
      unobserve(t: Element) { this.instance.unobserve(t); }
      disconnect() {
        disconnectCount++;
        this.instance.disconnect();
      }
      takeRecords() { return []; }
    }
    window.IntersectionObserver = InstrumentedIO as unknown as typeof IntersectionObserver;

    const KEY_CYCLES = 50;
    const { rerender, unmount } = render(
      createElement(DynamicKeyHarness, {
        options: { selector: '.motion-item' },
        currentKey: 'initial',
      })
    );

    for (let i = 1; i <= KEY_CYCLES; i++) {
      act(() => {
        rerender(
          createElement(DynamicKeyHarness, {
            options: { selector: '.motion-item' },
            currentKey: `cycle-${i}`,
          })
        );
      });
    }

    // Unmount final instance
    act(() => {
      unmount();
    });

    // Each cycle must have cleanly disconnected before re-mounting
    expect(activeScrollListeners.size).toBe(0);
    expect(disconnectCount).toBe(KEY_CYCLES + 1);

    window.IntersectionObserver = OrigIO;
  });

  // ==========================================================================
  // 3. clearProps: 'transform,opacity' Verification on Entrance Completion
  // ==========================================================================
  it('clears inline transform and opacity via clearProps once entrance animation completes', async () => {
    let capturedCallback: IntersectionObserverCallback | null = null;
    let observedTarget: Element | null = null;

    const OrigIO = window.IntersectionObserver;
    class ControllableIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        capturedCallback = cb;
      }
      observe(target: Element) {
        observedTarget = target;
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    window.IntersectionObserver = ControllableIO as unknown as typeof IntersectionObserver;

    const { getByTestId, unmount } = render(
      createElement(MotionStressHarness, {
        options: {
          selector: '.motion-card',
          distance: 24,
          duration: 0.05, // very short for test
          stagger: 0,
        },
        itemCount: 1,
      })
    );

    const card = getByTestId('motion-card-1') as HTMLElement;
    expect(card).toBeDefined();
    expect(capturedCallback).not.toBeNull();
    expect(observedTarget).toBe(card);

    // Initial state: card outside initial view or initialized by gsap.set
    // In our harness, getBoundingClientRect returns 0 in jsdom so inInitialView is false -> set to opacity 0, y: 24
    expect(card.style.opacity).toBe('0');
    expect(card.style.transform).toContain('translate');

    // Trigger intersection enter
    act(() => {
      if (capturedCallback && observedTarget) {
        capturedCallback(
          [
            {
              isIntersecting: true,
              target: observedTarget,
              intersectionRatio: 1,
              boundingClientRect: observedTarget.getBoundingClientRect(),
              intersectionRect: observedTarget.getBoundingClientRect(),
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          new ControllableIO(capturedCallback)
        );
      }
    });

    // Wait for the short GSAP entrance tween (0.05s) to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // CRITICAL ASSERTION: clearProps: 'transform,opacity' must clear inline styles completely
    // Leaving the DOM clean without inline style pollution
    expect(card.style.transform).toBe('');
    expect(card.style.opacity).toBe('');

    unmount();
    window.IntersectionObserver = OrigIO;
  });

  // ==========================================================================
  // 4. clearProps: 'transform,opacity' on Teardown / Unmount (DEFECT IDENTIFIED)
  // ==========================================================================
  it('clears inline transform and opacity on unmount teardown even if tween was interrupted', () => {
    let capturedCallback: IntersectionObserverCallback | null = null;
    let observedTarget: Element | null = null;

    const OrigIO = window.IntersectionObserver;
    class ControllableIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        capturedCallback = cb;
      }
      observe(target: Element) {
        observedTarget = target;
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    window.IntersectionObserver = ControllableIO as unknown as typeof IntersectionObserver;

    const { getByTestId, unmount } = render(
      createElement(MotionStressHarness, {
        options: {
          selector: '.motion-card',
          distance: 24,
          duration: 5.0, // long tween to interrupt mid-flight
        },
        itemCount: 1,
      })
    );

    const card = getByTestId('motion-card-1') as HTMLElement;

    // Trigger entrance to start mid-flight animation
    act(() => {
      if (capturedCallback && observedTarget) {
        capturedCallback(
          [
            {
              isIntersecting: true,
              target: observedTarget,
              intersectionRatio: 1,
              boundingClientRect: observedTarget.getBoundingClientRect(),
              intersectionRect: observedTarget.getBoundingClientRect(),
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          new ControllableIO(capturedCallback)
        );
      }
    });

    // Verify tween is currently active mid-flight
    expect(gsap.getTweensOf(card).length).toBeGreaterThan(0);

    // Unmount mid-flight
    act(() => {
      unmount();
    });

    // Teardown should have killed all tweens of card
    expect(gsap.getTweensOf(card).length).toBe(0);

    // Teardown should have applied clearProps: 'transform,opacity'
    expect(card.style.transform).toBe('');
    expect(card.style.opacity).toBe('');

    window.IntersectionObserver = OrigIO;
  });

  // ==========================================================================
  // 5. Reduced Motion Mode immediate clearProps
  // ==========================================================================
  it('in reduced motion mode, immediately reveals elements and clears inline transform/opacity', () => {
    document.documentElement.dataset.reduceMotion = 'true';

    const { getByTestId, unmount } = render(
      createElement(MotionStressHarness, {
        options: { selector: '.motion-card' },
        itemCount: 2,
      })
    );

    const card1 = getByTestId('motion-card-1') as HTMLElement;
    const card2 = getByTestId('motion-card-2') as HTMLElement;

    // In reduced motion mode, gsap.set clears inline transform and opacity immediately
    expect(card1.style.transform).toBe('');
    expect(card1.style.opacity).toBe('');
    expect(card2.style.transform).toBe('');
    expect(card2.style.opacity).toBe('');

    unmount();
  });

  // ==========================================================================
  // 6. MutationObserver attached on zero initial targets
  // ==========================================================================
  it('attaches MutationObserver even if container mounts before async items load', () => {
    let observeCalledOnContainer = false;
    const OrigMO = window.MutationObserver;
    if (typeof OrigMO !== 'undefined') {
      class TestMO implements MutationObserver {
        private instance: MutationObserver;
        constructor(cb: MutationCallback) {
          this.instance = new OrigMO(cb);
        }
        observe(target: Node, options?: MutationObserverInit) {
          if ((target as HTMLElement)?.classList?.contains('motion-container')) {
            observeCalledOnContainer = true;
          }
          this.instance.observe(target, options);
        }
        disconnect() {
          this.instance.disconnect();
        }
        takeRecords() {
          return this.instance.takeRecords();
        }
      }
      window.MutationObserver = TestMO as unknown as typeof MutationObserver;
    }

    // Mount container with selector, but 0 items initially (e.g. Dexie loading state)
    const { unmount } = render(
      createElement(MotionStressHarness, {
        options: { selector: '.motion-card' },
        itemCount: 0,
      })
    );

    // MutationObserver is attached to container even when initialTargets.length === 0
    expect(observeCalledOnContainer).toBe(true);

    unmount();
    if (typeof OrigMO !== 'undefined') {
      window.MutationObserver = OrigMO;
    }
  });
});

