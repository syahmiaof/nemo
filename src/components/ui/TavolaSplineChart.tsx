import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { nearestChartIndex, normalizeChartValues, pointsToSplinePath } from '@/domain/chart';
import { useReducedMotion } from '@/design/useReducedMotion';
import '@/design/charts.css';

gsap.registerPlugin(useGSAP);
interface SplineChartProps {
  labels: string[];
  values: number[];
  comparisonValues?: number[];
  seriesName?: string;
  comparisonName?: string;
  unit?: string;
  height?: number;
}
interface ChartFrame { main: number[]; comparison: number[]; maximum: number }

export const TavolaSplineChart: React.FC<SplineChartProps> = ({
  labels, values, comparisonValues, seriesName = 'This week', comparisonName = 'Last week', unit = 'tasks', height = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<SVGRectElement>(null);
  const [width, setWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  // Content keys avoid restarting an unchanged chart on live-query renders.
  const dataKey = JSON.stringify([normalizeChartValues(values, labels.length), comparisonValues ? normalizeChartValues(comparisonValues, labels.length) : []]);
  const target = useMemo<ChartFrame>(() => {
    const [main, comparison] = JSON.parse(dataKey) as [number[], number[]];
    const maximum = Math.max(4, Math.ceil(Math.max(0, ...main, ...comparison) / 4) * 4);
    return { main, comparison, maximum };
  }, [dataKey]);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const reveal = revealRef.current;
    if (!reveal) return;
    if (reduced) { gsap.set(reveal, { attr: { width: '100%' } }); return; }
    gsap.fromTo(reveal, { attr: { width: '0%' } }, {
      attr: { width: '100%' }, duration: 1.4, ease: 'power2.inOut',
    });
  }, { scope: containerRef, dependencies: [reduced], revertOnUpdate: true });

  // Keep geometry derived from the canonical data. The previous implementation
  // called React setState on every GSAP tick, rebuilding every SVG path at 60fps.
  // The chart's SVG reveal supplies motion without rerendering the whole page.
  const frame: ChartFrame = target;
  const padding = { left: 38, right: 20, top: 26, bottom: 34 };
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const bottom = height - padding.bottom;
  const getX = (i: number) => padding.left + (labels.length < 2 ? plotWidth / 2 : i / (labels.length - 1) * plotWidth);
  const getY = (value: number) => padding.top + (1 - value / frame.maximum) * (bottom - padding.top);
  const mainPoints = frame.main.map((value, i) => [getX(i), getY(value)] as const);
  const path = pointsToSplinePath(mainPoints);
  const area = mainPoints.length > 1 ? `${path} L${getX(mainPoints.length - 1)},${bottom} L${getX(0)},${bottom} Z` : '';
  const comparisonPath = pointsToSplinePath(frame.comparison.map((value, i) => [getX(i), getY(value)] as const));
  const active = hoverIndex !== null && hoverIndex < labels.length ? hoverIndex : null;
  const labelStride = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(plotWidth / 60))));
  const handleKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!labels.length) return;
    if (event.key === 'Escape') { setHoverIndex(null); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setHoverIndex(event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1 : Math.max(0, Math.min(labels.length - 1, (active ?? 0) + (event.key === 'ArrowLeft' ? -1 : 1))));
  };
  return (
    <div ref={containerRef} className="nemo-chart" data-motion={reduced ? 'reduced' : 'full'}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
        className="nemo-chart__svg" tabIndex={labels.length ? 0 : -1} role="group"
        aria-label={`${seriesName} chart. Use left and right arrows, Home or End to explore.`}
        aria-describedby={`${id}-description`} onKeyDown={handleKey}
        onFocus={() => setHoverIndex(0)} onBlur={() => setHoverIndex(null)}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (bounds.width > 0) setHoverIndex(nearestChartIndex((event.clientX - bounds.left) * width / bounds.width, padding.left, plotWidth, labels.length));
        }}
        onPointerLeave={(event) => { if (document.activeElement !== event.currentTarget) setHoverIndex(null); }}>
        <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-peach, #efb2a2)" stopOpacity=".28" />
          <stop offset="100%" stopColor="var(--chart-peach, #efb2a2)" stopOpacity=".015" />
        </linearGradient><clipPath id={`${id}-reveal`}><rect ref={revealRef} x="0" y="0" width="100%" height="100%" /></clipPath></defs>
        {[0, 0.5, 1].map((fraction) => <g key={fraction} className="nemo-chart__grid">
          <line x1={padding.left} x2={width - padding.right} y1={getY(frame.maximum * fraction)} y2={getY(frame.maximum * fraction)} strokeDasharray="3 6" />
          <text x={padding.left - 10} y={getY(frame.maximum * fraction) + 5} textAnchor="end">{Math.round(frame.maximum * fraction)}</text>
        </g>)}
        {labels.map((label, i) => i % labelStride === 0 || i === labels.length - 1 ? <text key={`${label}-${i}`} className="nemo-chart__label" x={getX(i)} y={height - 8} textAnchor="middle">{label}</text> : null)}
        <g clipPath={`url(#${id}-reveal)`}>
          {area && <path d={area} fill={`url(#${id}-fill)`} />}
          {comparisonPath && <path d={comparisonPath} className="nemo-chart__comparison" />}
          {path && <path d={path} className="nemo-chart__line" />}
        </g>
        {mainPoints.length === 1 && <circle cx={mainPoints[0][0]} cy={mainPoints[0][1]} r="4" className="nemo-chart__dot" />}
        {active !== null && <g>
          <line className="nemo-chart__crosshair" x1={getX(active)} x2={getX(active)} y1={padding.top} y2={bottom} />
          {frame.comparison.length > active && <circle cx={getX(active)} cy={getY(frame.comparison[active])} r="4" className="nemo-chart__comparison-dot" />}
          <circle cx={getX(active)} cy={getY(frame.main[active] ?? 0)} r="6" className="nemo-chart__dot" />
        </g>}
      </svg>
      <p id={`${id}-description`} className="sr-only">Values in {unit}. Exact values are available in the data table below.</p>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{active !== null ? `${labels[active]}: ${seriesName}, ${target.main[active]} ${unit}${target.comparison.length ? `; ${comparisonName}, ${target.comparison[active]} ${unit}` : ''}.` : ''}</span>
      {active !== null && <div className="nemo-chart__tooltip" aria-hidden="true" style={{ transform: `translate3d(${Math.max(0, Math.min(Math.max(0, width - Math.min(228, width)), getX(active) - 114))}px, ${Math.max(0, getY(frame.main[active] ?? 0) - 95)}px, 0)` }}>
        <strong>{labels[active]}</strong><span><i />{seriesName}<b>{target.main[active]} {unit}</b></span>
        {!!target.comparison.length && <span className="nemo-chart__tooltip-comparison"><i />{comparisonName}<b>{target.comparison[active]} {unit}</b></span>}
      </div>}
      <details className="nemo-chart__data"><summary>View chart data</summary><div className="nemo-chart__table-wrap"><table>
        <caption>{seriesName}{target.comparison.length ? ` compared with ${comparisonName}` : ''} ({unit})</caption>
        <thead><tr><th scope="col">Period</th><th scope="col">{seriesName}</th>{!!target.comparison.length && <th scope="col">{comparisonName}</th>}</tr></thead>
        <tbody>{labels.map((label, i) => <tr key={`${label}-${i}`}><th scope="row">{label}</th><td>{target.main[i]}</td>{!!target.comparison.length && <td>{target.comparison[i]}</td>}</tr>)}</tbody>
      </table></div></details>
    </div>
  );
};
