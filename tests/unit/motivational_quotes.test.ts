import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  MOTIVATIONAL_QUOTES,
  type QuoteCategory,
  type MotivationalQuote,
} from '@/features/overview/data/motivationalQuotes';
import { useRotatingQuotes } from '@/features/overview/hooks/useRotatingQuotes';

const EXPECTED_CATEGORIES: QuoteCategory[] = [
  'focus',
  'discipline',
  'execution',
  'time',
  'study',
  'creativity',
  'resilience',
  'clarity',
  'momentum',
  'mindset',
];

describe('Motivational Quotes Data Integrity', () => {
  it('contains exactly 100 quotes', () => {
    expect(MOTIVATIONAL_QUOTES).toHaveLength(100);
  });

  it('has unique non-empty IDs for every quote', () => {
    const ids = MOTIVATIONAL_QUOTES.map((q) => q.id);
    expect(ids.every((id) => typeof id === 'string' && id.trim().length > 0)).toBe(true);

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(100);
  });

  it('has unique non-empty text strings for every quote', () => {
    const texts = MOTIVATIONAL_QUOTES.map((q) => q.text.trim());
    expect(texts.every((t) => t.length > 0)).toBe(true);

    const uniqueTexts = new Set(texts);
    expect(uniqueTexts.size).toBe(100);
  });

  it('assigns valid categories with exactly 10 quotes per category', () => {
    const counts = EXPECTED_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {});

    for (const quote of MOTIVATIONAL_QUOTES) {
      expect(EXPECTED_CATEGORIES).toContain(quote.category);
      counts[quote.category] = (counts[quote.category] || 0) + 1;
    }

    for (const cat of EXPECTED_CATEGORIES) {
      expect(counts[cat]).toBe(10);
    }
  });

  it('contains verified benchmark quotes from prompt', () => {
    // Check specific boundary and milestone quotes
    expect(MOTIVATIONAL_QUOTES[0]).toEqual({
      id: 'quote-1',
      text: 'Give your attention a destination.',
      category: 'focus',
    });

    expect(MOTIVATIONAL_QUOTES[10]).toEqual({
      id: 'quote-11',
      text: 'Show up before motivation arrives.',
      category: 'discipline',
    });

    expect(MOTIVATIONAL_QUOTES[20]).toEqual({
      id: 'quote-21',
      text: 'Start small, but start today.',
      category: 'execution',
    });

    expect(MOTIVATIONAL_QUOTES[30]).toEqual({
      id: 'quote-31',
      text: 'Spend your minutes on your future.',
      category: 'time',
    });

    expect(MOTIVATIONAL_QUOTES[40]).toEqual({
      id: 'quote-41',
      text: 'Learn deeply, not just quickly.',
      category: 'study',
    });

    expect(MOTIVATIONAL_QUOTES[50]).toEqual({
      id: 'quote-51',
      text: 'Build the thing you wish existed.',
      category: 'creativity',
    });

    expect(MOTIVATIONAL_QUOTES[60]).toEqual({
      id: 'quote-61',
      text: 'Pause if needed. Do not disappear.',
      category: 'resilience',
    });

    expect(MOTIVATIONAL_QUOTES[70]).toEqual({
      id: 'quote-71',
      text: 'Clear priorities lighten heavy days.',
      category: 'clarity',
    });

    expect(MOTIVATIONAL_QUOTES[80]).toEqual({
      id: 'quote-81',
      text: 'Little wins have lasting energy.',
      category: 'momentum',
    });

    expect(MOTIVATIONAL_QUOTES[90]).toEqual({
      id: 'quote-91',
      text: 'Be ambitious about what you finish.',
      category: 'mindset',
    });

    expect(MOTIVATIONAL_QUOTES[99]).toEqual({
      id: 'quote-100',
      text: 'Build a life worthy of your attention.',
      category: 'mindset',
    });
  });
});

describe('useRotatingQuotes Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete document.documentElement.dataset.reduceMotion;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete document.documentElement.dataset.reduceMotion;
  });

  it('initializes with valid currentQuote, distinct nextQuote, and active rotation', () => {
    const { result } = renderHook(() => useRotatingQuotes());

    expect(result.current.currentQuote).toBeDefined();
    expect(result.current.nextQuote).toBeDefined();
    expect(result.current.currentQuote.id).not.toBe(result.current.nextQuote.id);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.deck).toHaveLength(100);
  });

  it('advances quote automatically every 5000ms', () => {
    const { result } = renderHook(() => useRotatingQuotes({ intervalMs: 5000 }));

    const initialQuote = result.current.currentQuote;
    const expectedNext = result.current.nextQuote;

    // Fast-forward 5000ms
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentQuote.id).toBe(expectedNext.id);
    expect(result.current.currentQuote.id).not.toBe(initialQuote.id);
  });

  it('pauses rotation and resumes with togglePause, pause, and resume', () => {
    const { result } = renderHook(() => useRotatingQuotes({ intervalMs: 5000 }));

    // Manually pause
    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(true);

    const pausedQuote = result.current.currentQuote;

    // Advance timer while paused
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    // Quote should not change while paused
    expect(result.current.currentQuote.id).toBe(pausedQuote.id);

    // Resume via resume()
    act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    // Advance timer after resume
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.currentQuote.id).not.toBe(pausedQuote.id);

    // Pause via pause()
    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);
  });

  it('manual advanceNext moves immediately to nextQuote and triggers transition', () => {
    const { result } = renderHook(() => useRotatingQuotes());

    const firstQuote = result.current.currentQuote;
    const nextQuote = result.current.nextQuote;

    act(() => {
      result.current.advanceNext();
    });

    expect(result.current.currentQuote.id).toBe(nextQuote.id);
    expect(result.current.currentQuote.id).not.toBe(firstQuote.id);
    expect(result.current.isTransitioning).toBe(true);

    // Fast forward transition window (400ms)
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.isTransitioning).toBe(false);
  });

  it('allows manual setTransitioning override', () => {
    const { result } = renderHook(() => useRotatingQuotes());

    act(() => {
      result.current.setTransitioning(true);
    });
    expect(result.current.isTransitioning).toBe(true);

    act(() => {
      result.current.setTransitioning(false);
    });
    expect(result.current.isTransitioning).toBe(false);
  });

  it('pauses automatic rotation when document is hidden', () => {
    const { result } = renderHook(() => useRotatingQuotes({ intervalMs: 5000 }));
    const initialQuote = result.current.currentQuote;

    // Simulate tab switch / hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.currentQuote.id).toBe(initialQuote.id);

    // Return to visible tab
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.currentQuote.id).not.toBe(initialQuote.id);
  });

  it('respects prefers-reduced-motion: reduce', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const { result } = renderHook(() => useRotatingQuotes({ intervalMs: 5000 }));
    expect(result.current.prefersReducedMotion).toBe(true);

    const initialQuote = result.current.currentQuote;

    // Fast forward - timer should be suspended under reduced motion
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.currentQuote.id).toBe(initialQuote.id);

    // Manual advance still works but avoids motion transition flag
    act(() => {
      result.current.advanceNext();
    });
    expect(result.current.currentQuote.id).not.toBe(initialQuote.id);
    expect(result.current.isTransitioning).toBe(false);

    vi.unstubAllGlobals();
  });

  it('plays through an entire deck without duplicates before cycling', () => {
    const sampleQuotes: MotivationalQuote[] = [
      { id: 'q1', text: 'Quote 1', category: 'focus' },
      { id: 'q2', text: 'Quote 2', category: 'focus' },
      { id: 'q3', text: 'Quote 3', category: 'focus' },
      { id: 'q4', text: 'Quote 4', category: 'focus' },
    ];

    const { result } = renderHook(() =>
      useRotatingQuotes({ quotes: sampleQuotes, shuffle: false, intervalMs: 5000 })
    );

    const visitedIds: string[] = [result.current.currentQuote.id];

    for (let i = 0; i < sampleQuotes.length - 1; i++) {
      act(() => {
        result.current.advanceNext();
      });
      visitedIds.push(result.current.currentQuote.id);
    }

    // Every item visited in first cycle must be unique
    expect(visitedIds).toHaveLength(sampleQuotes.length);
    expect(new Set(visitedIds).size).toBe(sampleQuotes.length);

    // Advance once more to enter second cycle
    act(() => {
      result.current.advanceNext();
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('cleans up timers cleanly on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount, result } = renderHook(() => useRotatingQuotes({ intervalMs: 5000 }));

    act(() => {
      result.current.advanceNext(); // initiates transition timeout
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
