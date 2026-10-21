import type { Point } from './particleSampler';

export interface MorphParticle {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  color: string;
  radius: number;
  glow: boolean;
}

export const THEME_PALETTES = {
  midnight: [
    '#F5C8BC', // warm peach
    '#FFF1EC', // ivory stardust
    '#34D399', // mint stardust
    '#6EE7B7', // light mint
    '#C4B5FD', // soft lilac glimmer
  ],
  daylight: [
    '#0F172A', // deep navy
    '#334155', // slate
    '#059669', // emerald
    '#D97706', // warm amber
  ],
  aurora: [
    '#34D399', // bright aurora emerald
    '#38BDF8', // cyan glow
    '#F5C8BC', // peach star
    '#A7F3D0', // soft mint
    '#E0E7FF', // crystal white
  ],
};

/**
 * Creates an array of particles mapped from source glyph points to target glyph points.
 * Generates natural orbital Bezier control points for fairytale-like swirling stardust.
 */
export function createMorphBuffer(
  sourcePoints: Point[],
  targetPoints: Point[],
  width: number,
  height: number,
  theme: 'midnight' | 'daylight' | 'aurora' = 'midnight'
): MorphParticle[] {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.midnight;
  const count = Math.max(sourcePoints.length, targetPoints.length);

  if (count === 0) return [];

  const particles: MorphParticle[] = [];
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < count; i++) {
    const sp = sourcePoints[i % Math.max(sourcePoints.length, 1)] || { x: centerX, y: centerY };
    const tp = targetPoints[i % Math.max(targetPoints.length, 1)] || { x: centerX, y: centerY };

    // Deterministic pseudo-random seed based on index
    const seed = (Math.sin(i * 997.3) + 1) / 2;
    const seed2 = (Math.cos(i * 613.7) + 1) / 2;
    const angle = seed * Math.PI * 2;
    const distance = 40 + seed2 * (Math.min(width, height) * 0.45);

    // Orbital spiral control points pulling outward in a gentle vortex
    const swirlDir = i % 2 === 0 ? 1 : -1;
    const c1x = sp.x + Math.cos(angle) * distance * 0.75;
    const c1y = sp.y + Math.sin(angle) * distance * 0.65 - 15 * swirlDir;

    const c2x = tp.x + Math.cos(angle + swirlDir * 1.2) * distance * 0.65;
    const c2y = tp.y + Math.sin(angle + swirlDir * 1.2) * distance * 0.55 + 15 * swirlDir;

    const color = palette[i % palette.length];
    const radius = 1.3 + seed * 1.5;
    const glow = seed > 0.82; // ~18% have luminous stardust glimmer

    particles.push({
      sx: sp.x,
      sy: sp.y,
      tx: tp.x,
      ty: tp.y,
      c1x,
      c1y,
      c2x,
      c2y,
      color,
      radius,
      glow,
    });
  }

  return particles;
}

/**
 * Evaluates Cubic Bezier curve at t: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
 */
export function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const oneMinusT = 1 - t;
  return (
    oneMinusT * oneMinusT * oneMinusT * p0 +
    3 * oneMinusT * oneMinusT * t * p1 +
    3 * oneMinusT * t * t * p2 +
    t * t * t * p3
  );
}

/**
 * Draws all particles at the current transition progress (0 to 1)
 */
export function drawMorphFrame(
  ctx: CanvasRenderingContext2D,
  particles: MorphParticle[],
  progress: number,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  if (!particles.length) return;

  // Clamped progress
  const t = Math.max(0, Math.min(1, progress));

  // Natural ease shaping:
  // Breakup phase (0 - 0.25): particles loosen from glyphs
  // Swirl phase (0.25 - 0.75): graceful orbital transit
  // Settling phase (0.75 - 1.0): deceleration into new letters
  const len = particles.length;

  for (let i = 0; i < len; i++) {
    const p = particles[i];

    // Slight per-particle temporal offset for organic flow
    const particleProgress = Math.max(0, Math.min(1, t));

    const x = cubicBezier(p.sx, p.c1x, p.c2x, p.tx, particleProgress);
    const y = cubicBezier(p.sy, p.c1y, p.c2y, p.ty, particleProgress);

    // Subtle breathing scale during flight
    const midFlight = Math.sin(particleProgress * Math.PI);
    const r = p.radius * (1 + midFlight * 0.35);

    // Stardust opacity
    const alpha = 0.75 + midFlight * 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.glow && midFlight > 0.3) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
