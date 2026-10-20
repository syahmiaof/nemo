import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { monthlyCounts, nearestChartIndex, normalizeChartValues, pointsToSplinePath } from '@/domain/chart';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';

describe('Chart geometry and real-data aggregation', () => {
  it('keeps every sampled curve segment inside its neighbouring data bounds', () => {
    const points = [[0, 0], [10, 80], [20, 0], [30, 0], [40, 5], [50, 300], [60, 3]] as const;
    const segments = pointsToSplinePath(points).split(' C').slice(1);
    segments.forEach((segment, index) => {
      const numbers = segment.split(/[ ,]/).map(Number);
      const start = points[index][1];
      const end = points[index + 1][1];
      for (let sample = 0; sample <= 100; sample++) {
        const t = sample / 100;
        const y = (1 - t) ** 3 * start + 3 * (1 - t) ** 2 * t * numbers[1] + 3 * (1 - t) * t ** 2 * numbers[3] + t ** 3 * end;
        expect(y).toBeGreaterThanOrEqual(Math.min(start, end) - 1e-8);
        expect(y).toBeLessThanOrEqual(Math.max(start, end) + 1e-8);
      }
    });
  });

  it('handles empty, single-value and plateau datasets without invalid paths', () => {
    expect(pointsToSplinePath([])).toBe('');
    expect(pointsToSplinePath([[4, 8]])).toBe('M4,8');
    expect(pointsToSplinePath([[0, 0], [10, 0]])).not.toMatch(/NaN|Infinity/);
    expect(normalizeChartValues([3, NaN, Infinity, -1], 5)).toEqual([3, 0, 0, 0, 0]);
  });

  it('counts actual completion timestamps in the selected local year only', () => {
    const result = monthlyCounts(['2025-12-10T12:00:00', '2026-03-20T14:30:00', '2026-03-21', '2026-10-01T09:00:00', undefined, null, 'bad-date'], 2026);
    expect(result).toHaveLength(12);
    expect(result[2]).toBe(2);
    expect(result[9]).toBe(1);
    expect(result.reduce((sum, value) => sum + value, 0)).toBe(3);
    expect(monthlyCounts([], 2026)).toEqual(Array(12).fill(0));
  });

  it('snaps pointer positions to bounded nearest data points', () => {
    expect(nearestChartIndex(-200, 40, 600, 7)).toBe(0);
    expect(nearestChartIndex(340, 40, 600, 7)).toBe(3);
    expect(nearestChartIndex(10000, 40, 600, 7)).toBe(6);
    expect(nearestChartIndex(200, 40, 0, 0)).toBe(0);
  });
});

describe('Chart keyboard and reduced-motion interaction', () => {
  let disconnect: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect = disconnect;
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    document.documentElement.dataset.reduceMotion = 'true';
  });
  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.reduceMotion;
    vi.unstubAllGlobals();
  });

  it('exposes exact values, supports arrow/Home/End navigation, and disconnects on unmount', () => {
    const { container, unmount } = render(createElement(TavolaSplineChart, {
      labels: ['Jan', 'Feb', 'Mar'], values: [3, 5, 7], comparisonValues: [1, 2, 4], seriesName: '2026', comparisonName: '2025',
    }));
    const chart = screen.getByRole('group', { name: /2026 chart/ });
    fireEvent.focus(chart);
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Jan: 2026, 3 tasks; 2025, 1 tasks.');
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Feb: 2026, 5 tasks');
    fireEvent.keyDown(chart, { key: 'End' });
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Mar: 2026, 7 tasks');
    fireEvent.keyDown(chart, { key: 'Home' });
    expect(container.querySelector('[aria-live]')).toHaveTextContent('Jan: 2026, 3 tasks');
    fireEvent.click(screen.getByText('View chart data'));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(container.querySelectorAll('tbody tr')[1]).toHaveTextContent('Feb52');
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('applies new data immediately when app reduced motion is enabled', () => {
    const { container, rerender } = render(createElement(TavolaSplineChart, { labels: ['A', 'B'], values: [1, 2] }));
    const before = container.querySelector('.nemo-chart__line')?.getAttribute('d');
    rerender(createElement(TavolaSplineChart, { labels: ['A', 'B'], values: [4, 0] }));
    const after = container.querySelector('.nemo-chart__line')?.getAttribute('d');
    expect(after).not.toBe(before);
    expect(after).not.toMatch(/NaN|Infinity/);
  });
});
