import type { Point } from './particleSampler';

export interface MorphParticle {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  stageX: number;
  stageY: number;
  stageAngle: number;
  stageRadius: number;
  direction: 1 | -1;
  color: string;
  radius: number;
}

export const THEME_PALETTES = {
  midnight: ['#F5C8BC', '#FFF1EC', '#34D399', '#6EE7B7', '#C4B5FD'],
  daylight: ['#0F172A', '#334155', '#059669', '#D97706'],
  aurora: ['#34D399', '#38BDF8', '#F5C8BC', '#A7F3D0', '#E0E7FF'],
} as const;

export type MorphTheme = keyof typeof THEME_PALETTES;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function createMorphBuffer(
  sourcePoints: Point[],
  targetPoints: Point[],
  width: number,
  height: number,
  theme: MorphTheme = 'midnight'
): MorphParticle[] {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.midnight;
  const count = Math.max(sourcePoints.length, targetPoints.length);
  if (!count) return [];

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusLimit = Math.max(32, Math.min(width, height) * 0.42);
  const particles: MorphParticle[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const sourceIndex = sourcePoints.length ? Math.floor((i * sourcePoints.length) / count) : -1;
    const targetIndex = targetPoints.length ? Math.floor((i * targetPoints.length) / count) : -1;
    const sp = sourcePoints[sourceIndex] ?? { x: centerX, y: centerY };
    const tp = targetPoints[targetIndex] ?? { x: centerX, y: centerY };
    const seed = (Math.sin(i * 997.3) + 1) * 0.5;
    const sourceAngle = Math.atan2(sp.y - centerY, sp.x - centerX);
    const stageAngle = sourceAngle + (seed - 0.5) * 0.78;
    const sourceRadius = Math.hypot(sp.x - centerX, sp.y - centerY);
    const stageRadius = Math.min(radiusLimit, Math.max(18, sourceRadius + 24 + seed * radiusLimit * 0.24));

    particles[i] = {
      sx: sp.x,
      sy: sp.y,
      tx: tp.x,
      ty: tp.y,
      stageX: centerX + Math.cos(stageAngle) * stageRadius,
      stageY: centerY + Math.sin(stageAngle) * stageRadius,
      stageAngle,
      stageRadius,
      direction: i % 2 === 0 ? 1 : -1,
      color: palette[i % palette.length],
      radius: 1.05 + seed * 1.05,
    };
  }
  // Keep each palette color contiguous so a frame needs one particle pass,
  // rather than scanning the entire buffer once per color.
  const paletteIndex = new Map<string, number>(palette.map((color, index) => [color, index]));
  particles.sort((a, b) => (paletteIndex.get(a.color) ?? 0) - (paletteIndex.get(b.color) ?? 0));
  return particles;
}

/** Cubic Bezier helper retained for small deterministic motion tests/consumers. */
export function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const oneMinusT = 1 - t;
  return oneMinusT ** 3 * p0 + 3 * oneMinusT ** 2 * t * p1 + 3 * oneMinusT * t ** 2 * p2 + t ** 3 * p3;
}

export type MorphPhase = 'shimmer' | 'breakup' | 'swirl' | 'reform';

export function getMorphPhase(progress: number): MorphPhase {
  const t = clamp01(progress);
  if (t < 0.12) return 'shimmer';
  if (t < 0.32) return 'breakup';
  if (t < 0.76) return 'swirl';
  return 'reform';
}

/** Draws only during an active transition. Particles leave glyphs, make one
 * coherent orbital pass, then settle onto sampled target glyph pixels. */
export function drawMorphFrame(
  ctx: CanvasRenderingContext2D,
  particles: MorphParticle[],
  progress: number,
  width: number,
  height: number,
  _theme: MorphTheme = 'midnight'
) {
  ctx.clearRect(0, 0, width, height);
  if (!particles.length) return;

  const t = clamp01(progress);
  const phase = getMorphPhase(t);
  const centerX = width / 2;
  const centerY = height / 2;
  const shimmerScale = phase === 'shimmer' ? 0.82 + (t / 0.12) * 0.38 : 1;
  const alpha = phase === 'shimmer' ? 0.58 + (t / 0.12) * 0.32 : phase === 'swirl' ? 0.9 : 1;

  let activeColor = '';
  ctx.globalAlpha = alpha;
  for (const p of particles) {
    if (p.color !== activeColor) {
      if (activeColor) ctx.fill();
      ctx.beginPath();
      activeColor = p.color;
      ctx.fillStyle = activeColor;
    }
    let x: number;
    let y: number;
    if (phase === 'shimmer') {
      x = p.sx;
      y = p.sy;
    } else if (phase === 'breakup') {
      const release = smoothstep((t - 0.12) / 0.2);
      x = p.sx + (p.stageX - p.sx) * release;
      y = p.sy + (p.stageY - p.sy) * release;
    } else if (phase === 'swirl') {
      const orbit = (t - 0.32) / 0.44;
      const angle = p.stageAngle + p.direction * Math.PI * 2 * orbit;
      x = centerX + Math.cos(angle) * p.stageRadius;
      y = centerY + Math.sin(angle) * p.stageRadius;
    } else {
      const reform = smoothstep((t - 0.76) / 0.24);
      x = p.stageX + (p.tx - p.stageX) * reform;
      y = p.stageY + (p.ty - p.stageY) * reform;
    }
    ctx.moveTo(x + p.radius * shimmerScale, y);
    ctx.arc(x, y, p.radius * shimmerScale, 0, Math.PI * 2);
  }
  if (activeColor) ctx.fill();
  ctx.globalAlpha = 1;
}
