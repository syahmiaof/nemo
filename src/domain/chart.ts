export type ChartPoint = readonly [number, number];

/** Monotone Hermite interpolation with segment-bounded Bezier controls. */
export function pointsToSplinePath(points: readonly ChartPoint[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  const slopes = points.slice(1).map((p, i) => (p[1] - points[i][1]) / Math.max(Number.EPSILON, p[0] - points[i][0]));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === points.length - 1) return slopes[slopes.length - 1];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : 2 / (1 / slopes[i - 1] + 1 / slopes[i]);
  });
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const third = (nx - x) / 3;
    const clamp = (v: number) => Math.min(Math.max(y, ny), Math.max(Math.min(y, ny), v));
    path += ` C${x + third},${clamp(y + tangents[i] * third)} ${nx - third},${clamp(ny - tangents[i + 1] * third)} ${nx},${ny}`;
  }
  return path;
}

export function normalizeChartValues(values: readonly number[], count: number): number[] {
  return Array.from({ length: count }, (_, i) => Number.isFinite(values[i]) ? Math.max(0, values[i]) : 0);
}

/** Calendar dates stay in their written month; timestamps use the viewer's local month. */
export function monthlyCounts(dates: readonly (string | null | undefined)[], year: number): number[] {
  const counts = Array<number>(12).fill(0);
  for (const value of dates) {
    if (!value) continue;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) counts[date.getMonth()]++;
  }
  return counts;
}

export function nearestChartIndex(x: number, left: number, width: number, count: number): number {
  if (count < 2 || width <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(((x - left) / width) * (count - 1))));
}
