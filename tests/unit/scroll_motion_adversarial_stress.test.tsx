import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import gsap from 'gsap';
import { useScrollMotion, type ScrollMotionOptions } from '@/design/useScrollMotion';

function MultiCardHarness({
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
    { ref: containerRef, 'data-testid': 'adversarial-container', className: 'adversarial-container' },
    items.map((num) =>
      createElement(
        'div',
        {
          key: num,
          className: 'adv-card',
          'data-testid': `adv-card-${num}`,
        },
        `Item ${num}`
      )
    )
  );
}

describe('Empirical Challenger: Aggressive 50x Lifecycle & Zombie Tween Stress', () => {
  let activeScrollListeners: Set<EventListenerOrEventListenerObject>;
  let origAddEventListener: typeof window.addEventListener;
  let origRemoveEventListener: typeof window.removeEventListener;

  beforeEach(() => {
    cleanup();
    gsap.killTweensOf('*');
    document.documentElement.dataset.reduceMotion = 'false';
    activeScrollListeners = new Set();
    origAddEventListener = window.addEventListener.bind(window);
    origRemoveEventListener = window.removeEventListener.bind(window);

    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'scroll') {
        activeScrollListeners.add(listener);
      }
      return origAddEventListener(type, listener, options);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener, options) => {
      if (type === 'scroll') {
        activeScrollListeners.delete(listener);
      }
      return origRemoveEventListener(type, listener, options);
    });
  });

  afterEach(() => {
    cleanup();
    gsap.killTweensOf('*');
    document.documentElement.dataset.reduceMotion = 'false';
    vi.restoreAllMocks();
  });

  it('50x rapid mount and unmount with IN-FLIGHT ENTRANCE TWEENS leaves 0 zombie tweens and 0 leaked listeners', () => {
    const createdIOs: IntersectionObserver[] = [];
    const disconnectedIOs = new Set<IntersectionObserver>();
    const createdMOs: MutationObserver[] = [];
    const disconnectedMOs = new Set<MutationObserver>();

    let lastIoCallback: IntersectionObserverCallback | null = null;
    const trackedTargets: HTMLElement[] = [];

    const OrigIO = window.IntersectionObserver;
    class InstrumentedIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      private instance: IntersectionObserver;
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        lastIoCallback = cb;
        this.instance = new OrigIO(cb, opts);
        createdIOs.push(this as unknown as IntersectionObserver);
      }
      observe(t: Element) {
        trackedTargets.push(t as HTMLElement);
        this.instance.observe(t);
      }
      unobserve(t: Element) {
        this.instance.unobserve(t);
      }
      disconnect() {
        disconnectedIOs.add(this as unknown as IntersectionObserver);
        this.instance.disconnect();
      }
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = InstrumentedIO as unknown as typeof IntersectionObserver;

    const OrigMO = window.MutationObserver;
    if (typeof OrigMO !== 'undefined') {
      class InstrumentedMO implements MutationObserver {
        private instance: MutationObserver;
        private isTracked = false;
        constructor(cb: MutationCallback) {
          this.instance = new OrigMO(cb);
        }
        observe(target: Node, opts?: MutationObserverInit) {
          if ((target as HTMLElement)?.classList?.contains('adversarial-container')) {
            this.isTracked = true;
            createdMOs.push(this as unknown as MutationObserver);
          }
          this.instance.observe(target, opts);
        }
        disconnect() {
          if (this.isTracked) {
            disconnectedMOs.add(this as unknown as MutationObserver);
          }
          this.instance.disconnect();
        }
        takeRecords() {
          return [];
        }
      }
      window.MutationObserver = InstrumentedMO as unknown as typeof MutationObserver;
    }

    const MOUNT_CYCLES = 50;
    const allAnimatedElements: HTMLElement[] = [];

    for (let i = 0; i < MOUNT_CYCLES; i++) {
      const { unmount, getByTestId } = render(
        createElement(MultiCardHarness, {
          options: {
            selector: '.adv-card',
            distance: 30,
            duration: 10.0, // long duration so tween stays active
          },
          itemCount: 3,
        })
      );

      const card1 = getByTestId('adv-card-1') as HTMLElement;
      const card2 = getByTestId('adv-card-2') as HTMLElement;
      const card3 = getByTestId('adv-card-3') as HTMLElement;
      allAnimatedElements.push(card1, card2, card3);

      // Trigger entrance intersection for all 3 cards while mounted
      act(() => {
        if (lastIoCallback) {
          lastIoCallback(
            [
              {
                isIntersecting: true,
                target: card1,
                intersectionRatio: 1,
                boundingClientRect: card1.getBoundingClientRect(),
                intersectionRect: card1.getBoundingClientRect(),
                rootBounds: null,
                time: Date.now(),
              } as IntersectionObserverEntry,
              {
                isIntersecting: true,
                target: card2,
                intersectionRatio: 1,
                boundingClientRect: card2.getBoundingClientRect(),
                intersectionRect: card2.getBoundingClientRect(),
                rootBounds: null,
                time: Date.now(),
              } as IntersectionObserverEntry,
              {
                isIntersecting: true,
                target: card3,
                intersectionRatio: 1,
                boundingClientRect: card3.getBoundingClientRect(),
                intersectionRect: card3.getBoundingClientRect(),
                rootBounds: null,
                time: Date.now(),
              } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        }
      });

      // Verify tweens are actively running mid-flight on all 3 cards
      expect(gsap.getTweensOf(card1).length).toBeGreaterThan(0);
      expect(gsap.getTweensOf(card2).length).toBeGreaterThan(0);
      expect(gsap.getTweensOf(card3).length).toBeGreaterThan(0);

      // Immediately unmount while all 3 tweens are mid-flight!
      act(() => {
        unmount();
      });

      // Directly verify that after unmount, none of the 3 cards have active tweens
      expect(gsap.getTweensOf(card1).length).toBe(0);
      expect(gsap.getTweensOf(card2).length).toBe(0);
      expect(gsap.getTweensOf(card3).length).toBe(0);

      // Verify clearProps cleared inline styles
      expect(card1.style.transform).toBe('');
      expect(card1.style.opacity).toBe('');
      expect(card2.style.transform).toBe('');
      expect(card2.style.opacity).toBe('');
      expect(card3.style.transform).toBe('');
      expect(card3.style.opacity).toBe('');
    }

    // After all 50 cycles:
    // 1. Verify 0 net leaked event listeners on window
    expect(activeScrollListeners.size).toBe(0);

    // 2. Verify all 50 IntersectionObservers were cleanly disconnected
    expect(createdIOs.length).toBe(MOUNT_CYCLES);
    expect(disconnectedIOs.size).toBe(MOUNT_CYCLES);

    // 3. Verify all 50 MutationObservers were cleanly disconnected
    expect(createdMOs.length).toBe(MOUNT_CYCLES);
    expect(disconnectedMOs.size).toBe(MOUNT_CYCLES);

    // 4. Inspect GSAP globalTimeline: ZERO active element tweens remaining in global timeline
    const activeTimelineTweens = gsap.globalTimeline
      .getChildren(true, true, false)
      .filter((t: any) => {
        const targets = t.targets ? t.targets() : [t.target];
        return targets.some((target: any) => typeof target !== 'function');
      });
    expect(activeTimelineTweens.length).toBe(0);

    // 5. Inspect every single element across all 50 cycles (150 total elements)
    expect(allAnimatedElements.length).toBe(150);
    allAnimatedElements.forEach((el) => {
      expect(gsap.getTweensOf(el).length).toBe(0);
      expect(el.style.transform).toBe('');
      expect(el.style.opacity).toBe('');
    });

    window.IntersectionObserver = OrigIO;
    if (typeof OrigMO !== 'undefined') {
      window.MutationObserver = OrigMO;
    }
  });

  it('50x rapid mount and unmount with IN-FLIGHT EXIT TWEENS leaves 0 zombie tweens and 0 leaked listeners', () => {
    let lastIoCallback: IntersectionObserverCallback | null = null;
    const OrigIO = window.IntersectionObserver;
    class ControllableIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        lastIoCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = ControllableIO as unknown as typeof IntersectionObserver;

    const MOUNT_CYCLES = 50;
    const allAnimatedElements: HTMLElement[] = [];

    for (let i = 0; i < MOUNT_CYCLES; i++) {
      const { unmount, getByTestId } = render(
        createElement(MultiCardHarness, {
          options: {
            selector: '.adv-card',
            distance: 24,
            duration: 8.0,
            bidirectional: true,
          },
          itemCount: 2,
        })
      );

      const card1 = getByTestId('adv-card-1') as HTMLElement;
      const card2 = getByTestId('adv-card-2') as HTMLElement;
      allAnimatedElements.push(card1, card2);

      // First trigger enter
      act(() => {
        if (lastIoCallback) {
          lastIoCallback(
            [
              {
                isIntersecting: true,
                target: card1,
                intersectionRatio: 1,
                boundingClientRect: { top: 100, bottom: 200, height: 100 } as DOMRect,
                intersectionRect: {} as DOMRect,
                rootBounds: null,
                time: Date.now(),
              } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        }
      });

      // Now trigger exit (isIntersecting: false) to initiate exit tuck tween
      act(() => {
        if (lastIoCallback) {
          lastIoCallback(
            [
              {
                isIntersecting: false,
                target: card1,
                intersectionRatio: 0,
                boundingClientRect: { top: -100, bottom: -10, height: 90 } as DOMRect,
                intersectionRect: {} as DOMRect,
                rootBounds: null,
                time: Date.now(),
              } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        }
      });

      // Verify exit tween is in-flight
      expect(gsap.getTweensOf(card1).length).toBeGreaterThan(0);

      // Unmount while exit tween is running
      act(() => {
        unmount();
      });

      // Must be killed and cleared
      expect(gsap.getTweensOf(card1).length).toBe(0);
      expect(card1.style.transform).toBe('');
      expect(card1.style.opacity).toBe('');
    }

    expect(activeScrollListeners.size).toBe(0);
    const activeTimelineTweens = gsap.globalTimeline
      .getChildren(true, true, false)
      .filter((t: any) => {
        const targets = t.targets ? t.targets() : [t.target];
        return targets.some((target: any) => typeof target !== 'function');
      });
    expect(activeTimelineTweens.length).toBe(0);

    window.IntersectionObserver = OrigIO;
  });

  it('zero-item container handles dynamic insertion, mid-flight deletion, and unmount without leaks', async () => {
    let mutationCb: MutationCallback | null = null;
    let ioCb: IntersectionObserverCallback | null = null;
    let moDisconnected = false;
    let ioDisconnected = false;

    const OrigIO = window.IntersectionObserver;
    class TestIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        ioCb = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {
        ioDisconnected = true;
      }
      takeRecords() {
        return [];
      }
    }
    window.IntersectionObserver = TestIO as unknown as typeof IntersectionObserver;

    const OrigMO = window.MutationObserver;
    if (typeof OrigMO !== 'undefined') {
      class TestMO implements MutationObserver {
        private cb: MutationCallback;
        constructor(cb: MutationCallback) {
          this.cb = cb;
          if (cb.length > 0) {
            mutationCb = cb;
          }
        }
        observe(target?: Node) {
          if (this.cb.length > 0 || (target as HTMLElement)?.classList?.contains('adversarial-container')) {
            mutationCb = this.cb;
          }
        }
        disconnect() {
          if (this.cb === mutationCb) {
            moDisconnected = true;
          }
        }
        takeRecords() {
          return [];
        }
      }
      window.MutationObserver = TestMO as unknown as typeof MutationObserver;
      globalThis.MutationObserver = TestMO as unknown as typeof MutationObserver;
    }

    // Mount container with 0 items initially
    const { unmount, getByTestId } = render(
      createElement(MultiCardHarness, {
        options: { selector: '.adv-card', distance: 20, duration: 5.0 },
        itemCount: 0,
      })
    );

    const container = getByTestId('adversarial-container');

    // Dynamically insert 5 items directly
    const addedItems: HTMLElement[] = [];
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div');
      item.className = 'adv-card';
      item.textContent = `Dynamic ${i}`;
      container.appendChild(item);
      addedItems.push(item);
    }

    // Trigger mutation callback
    act(() => {
      if (mutationCb) {
        mutationCb(
          [
            {
              type: 'childList',
              addedNodes: addedItems as unknown as NodeList,
              removedNodes: [] as unknown as NodeList,
              target: container,
            } as unknown as MutationRecord,
          ],
          {} as MutationObserver
        );
      }
    });

    // Trigger entrance for first 2 items
    act(() => {
      if (ioCb) {
        ioCb(
          [
            {
              isIntersecting: true,
              target: addedItems[0],
              intersectionRatio: 1,
              boundingClientRect: { top: 100, bottom: 200 } as DOMRect,
              intersectionRect: {} as DOMRect,
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
            {
              isIntersecting: true,
              target: addedItems[1],
              intersectionRatio: 1,
              boundingClientRect: { top: 120, bottom: 220 } as DOMRect,
              intersectionRect: {} as DOMRect,
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      }
    });

    expect(gsap.getTweensOf(addedItems[0]).length).toBeGreaterThan(0);
    expect(gsap.getTweensOf(addedItems[1]).length).toBeGreaterThan(0);

    // Now remove addedItems[0] while tween is active
    container.removeChild(addedItems[0]);
    act(() => {
      if (mutationCb) {
        mutationCb(
          [
            {
              type: 'childList',
              addedNodes: [] as unknown as NodeList,
              removedNodes: [addedItems[0]] as unknown as NodeList,
              target: container,
            } as unknown as MutationRecord,
          ],
          {} as MutationObserver
        );
      }
    });

    // Tween on removed node should be killed immediately by mutation observer handler
    const tweensOfAdded0 = gsap.getTweensOf(addedItems[0]);
    expect(tweensOfAdded0.length).toBe(0);

    // Unmount entire container while addedItems[1] tween is still running
    act(() => {
      unmount();
    });

    // All tweens killed, clearProps applied, observers disconnected
    expect(gsap.getTweensOf(addedItems[1]).length).toBe(0);
    expect(addedItems[1].style.transform).toBe('');
    expect(addedItems[1].style.opacity).toBe('');
    expect(moDisconnected).toBe(true);
    expect(ioDisconnected).toBe(true);
    expect(activeScrollListeners.size).toBe(0);

    window.IntersectionObserver = OrigIO;
    if (typeof OrigMO !== 'undefined') {
      window.MutationObserver = OrigMO;
      globalThis.MutationObserver = OrigMO;
    }
  });
});
