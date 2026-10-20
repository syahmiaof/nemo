import React, { useState, useRef, useEffect, useId } from 'react';
import gsap from 'gsap';

interface SplineChartProps {
  labels: string[];
  values: number[];
  comparisonValues?: number[];
  seriesName?: string;
  comparisonName?: string;
  unit?: string;
  height?: number;
}

// Exact Catmull-Rom Bezier Spline formula extracted from Tavola
function pointsToSplinePath(points: [number, number][], tension = 0.18): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1 = [
      p1[0] + (p2[0] - p0[0]) * tension,
      p1[1] + (p2[1] - p0[1]) * tension,
    ];
    const cp2 = [
      p2[0] - (p3[0] - p1[0]) * tension,
      p2[1] - (p3[1] - p1[1]) * tension,
    ];

    // Clamping to avoid overshooting
    const minY = Math.min(p1[1], p2[1]);
    const maxY = Math.max(p1[1], p2[1]);
    cp1[1] = Math.max(minY, Math.min(maxY, cp1[1]));
    cp2[1] = Math.max(minY, Math.min(maxY, cp2[1]));

    d += ` C${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export const TavolaSplineChart: React.FC<SplineChartProps> = ({
  labels,
  values,
  comparisonValues,
  seriesName = 'This Week',
  comparisonName = 'Last Week',
  unit = 'tasks',
  height = 190,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const rawId = useId();
  const gradId = `tavola-grad-${rawId.replace(/\W/g, '')}`;
  const clipId = `tavola-clip-${rawId.replace(/\W/g, '')}`;

  const padding = { left: 36, right: 16, top: 18, bottom: 26 };

  // Observe width
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // GSAP Reveal Animation
  useEffect(() => {
    if (!clipRectRef.current) return;
    gsap.fromTo(
      clipRectRef.current,
      { attr: { width: 0 } },
      { attr: { width: containerWidth }, duration: 1.2, ease: 'power2.inOut' }
    );
  }, [containerWidth, values]);

  // Scalers
  const allValues = [...values, ...(comparisonValues || [])];
  const maxVal = Math.max(5, ...allValues) * 1.15;
  const getX = (i: number) =>
    padding.left + (labels.length < 2 ? 0 : (i / (labels.length - 1)) * (containerWidth - padding.left - padding.right));
  const getY = (val: number) =>
    padding.top + (1 - val / maxVal) * (height - padding.top - padding.bottom);

  // Generate Splines
  const mainPoints: [number, number][] = values.map((v, i) => [getX(i), getY(v)]);
  const mainPath = pointsToSplinePath(mainPoints);
  const areaPath = mainPoints.length > 0
    ? `${mainPath} L${getX(mainPoints.length - 1)},${height - padding.bottom} L${getX(0)},${height - padding.bottom} Z`
    : '';

  const compPoints: [number, number][] = (comparisonValues || []).map((v, i) => [getX(i), getY(v)]);
  const compPath = pointsToSplinePath(compPoints);

  // Pointer interactions
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const effectiveWidth = Math.max(1, containerWidth - padding.left - padding.right);
    const rawIdx = Math.round((x / effectiveWidth) * (labels.length - 1));
    const clamped = Math.max(0, Math.min(labels.length - 1, rawIdx));
    setHoverIndex(clamped);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${containerWidth} ${height}`}
        width="100%"
        height={height}
        className="overflow-visible"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8DCC8" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#A8DCC8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#A8DCC8" stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect ref={clipRectRef} x="0" y="0" width={containerWidth} height={height} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((pct) => {
          const y = getY(maxVal * pct);
          return (
            <g key={pct} className="text-content-tertiary/40">
              <line
                x1={padding.left}
                x2={containerWidth - padding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-content-tertiary font-mono"
              >
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {labels.map((lbl, idx) => (
          <text
            key={lbl + idx}
            x={getX(idx)}
            y={height - 6}
            textAnchor="middle"
            className="text-[11px] font-medium fill-content-secondary"
          >
            {lbl}
          </text>
        ))}

        {/* Plot Group clipped */}
        <g clipPath={`url(#${clipId})`}>
          {/* Fill Area */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {/* Benchmark comparison line (dashed) */}
          {compPath && (
            <path
              d={compPath}
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              opacity="0.6"
            />
          )}

          {/* Main Spline line (Mint Glow) */}
          {mainPath && (
            <path
              d={mainPath}
              fill="none"
              stroke="#A8DCC8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {/* Hover Crosshair & Magnetic Dot */}
        {hoverIndex !== null && hoverIndex < labels.length && (
          <g className="transition-all duration-75">
            <line
              x1={getX(hoverIndex)}
              x2={getX(hoverIndex)}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {comparisonValues && (
              <circle
                cx={getX(hoverIndex)}
                cy={getY(comparisonValues[hoverIndex] ?? 0)}
                r="3.5"
                fill="var(--text-tertiary)"
              />
            )}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(values[hoverIndex] ?? 0)}
              r="5"
              fill="#A8DCC8"
              stroke="#0A1222"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Interactive Tooltip Badge (Floating Glass) */}
      {hoverIndex !== null && hoverIndex < labels.length && (
        <div
          className="absolute pointer-events-none z-20 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border-emphasis text-xs shadow-glass-pop -translate-x-1/2 -translate-y-full transition-transform duration-75"
          style={{
            left: `${getX(hoverIndex)}px`,
            top: `${Math.max(10, getY(values[hoverIndex] ?? 0) - 10)}px`,
          }}
        >
          <p className="font-bold text-content-primary mb-0.5">{labels[hoverIndex]}</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-accent-mint font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mint inline-block" />
              {seriesName}: {values[hoverIndex] ?? 0} {unit}
            </span>
            {comparisonValues && (
              <span className="flex items-center gap-1 text-content-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-content-tertiary inline-block" />
                {comparisonName}: {comparisonValues[hoverIndex] ?? 0}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
