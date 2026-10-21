import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefersReducedMotion } from '@/design/motion';

describe('Settings & Global Surfaces Motion Invariants', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.dataset.reduceMotion = 'false';
  });

  it('respects prefersReducedMotion when data-reduce-motion is true', () => {
    document.documentElement.dataset.reduceMotion = 'true';
    expect(prefersReducedMotion()).toBe(true);

    document.documentElement.dataset.reduceMotion = 'false';
    expect(prefersReducedMotion()).toBe(false);
  });

  it('respects system window.matchMedia for prefers-reduced-motion', () => {
    delete document.documentElement.dataset.reduceMotion;
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;

    expect(prefersReducedMotion()).toBe(true);
  });
});
