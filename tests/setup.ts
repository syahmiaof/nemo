import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Ensure structuredClone is available in jsdom if needed
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}

if (typeof window !== 'undefined') {
  // 1. Robust window.matchMedia mock stub
  if (!window.matchMedia) {
    const mockMatchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;
    globalThis.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;
  }

  // 2. Robust IntersectionObserver mock stub
  if (!window.IntersectionObserver) {
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [];
      private callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        if (options?.root) this.root = options.root;
        if (options?.rootMargin) this.rootMargin = options.rootMargin;
        if (options?.threshold) {
          this.thresholds = Array.isArray(options.threshold)
            ? options.threshold
            : [options.threshold];
        }
      }

      observe(target: Element): void {
        if (typeof this.callback === 'function') {
          queueMicrotask(() => {
            this.callback(
              [
                {
                  isIntersecting: true,
                  target,
                  intersectionRatio: 1,
                  boundingClientRect: target.getBoundingClientRect(),
                  intersectionRect: target.getBoundingClientRect(),
                  rootBounds: null,
                  time: Date.now(),
                } as IntersectionObserverEntry,
              ],
              this
            );
          });
        }
      }

      unobserve(_target: Element): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  // 3. Robust ResizeObserver mock stub
  if (!window.ResizeObserver) {
    class MockResizeObserver implements ResizeObserver {
      private cb: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.cb = callback;
      }
      observe(target: Element, _options?: ResizeObserverOptions): void {
        this.cb([{ target, contentRect: target.getBoundingClientRect() } as any], this);
      }
      unobserve(_target: Element): void {}
      disconnect(): void {}
    }

    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }

  // 4. Register GSAP plugins globally
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}
