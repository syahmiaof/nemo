import type { Point, GlyphFragment, GlyphGeometry } from "./particleSampler";

export const THEME_PALETTES = {
  midnight: ["#F4ECE6", "#EFC3B4", "#ADDACB", "#B1C4DB"],
  daylight: ["#263A4D", "#885146", "#376B60", "#48617C"],
  aurora: ["#EEEDE7", "#EDC3B5", "#A9DACC", "#AFCCDF"],
} as const;
export type MorphTheme = keyof typeof THEME_PALETTES;
export type MotionPrototype = "vortex" | "ink";
export const MORPH_DURATION = 1.25;
export const FINAL_PROTOTYPE: MotionPrototype = "ink";
export interface MorphParticle {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  source?: GlyphFragment;
  target?: GlyphFragment;
  sourcePrimary: boolean;
  targetPrimary: boolean;
  seed: number;
  release: number;
  arrival: number;
  depth: number;
  radius: number;
  color: string;
  colorGroup: number;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const seedFor = (i: number) => {
  const n = Math.sin((i + 1) * 127.1) * 43758.5453;
  return n - Math.floor(n);
};

/** Morton ordering preserves neighbourhoods in both masks. Population expansion
 * is stratified; only one owner paints a duplicated source/destination tile. */
function spatialOrder(points: Point[], width: number, height: number) {
  const spread = (value: number) => {
    let n = value;
    n = (n | (n << 8)) & 0x00ff00ff;
    n = (n | (n << 4)) & 0x0f0f0f0f;
    n = (n | (n << 2)) & 0x33333333;
    return (n | (n << 1)) & 0x55555555;
  };
  const key = (p: Point) =>
    spread(Math.round(clamp01(p.x / width) * 1023)) |
    (spread(Math.round(clamp01(p.y / height) * 1023)) << 1);
  return [...points].sort((a, b) => key(a) - key(b));
}
export function createMorphBuffer(
  sourcePoints: Point[],
  targetPoints: Point[],
  width: number,
  height: number,
  theme: MorphTheme = "midnight",
): MorphParticle[] {
  const source = spatialOrder(sourcePoints, width, height),
    target = spatialOrder(targetPoints, width, height);
  const count = Math.max(source.length, target.length),
    palette = THEME_PALETTES[theme];
  let previousSource = -1,
    previousTarget = -1;
  return Array.from({ length: count }, (_, i) => {
    const si = Math.floor((i * source.length) / count),
      ti = Math.floor((i * target.length) / count);
    const a = source[si] ?? { x: width / 2, y: height / 2 },
      b = target[ti] ?? { x: width / 2, y: height / 2 };
    const seed = seedFor(i);
    const particle: MorphParticle = {
      sx: a.x,
      sy: a.y,
      tx: b.x,
      ty: b.y,
      source: "size" in a ? (a as GlyphFragment) : undefined,
      target: "size" in b ? (b as GlyphFragment) : undefined,
      sourcePrimary: si !== previousSource,
      targetPrimary: ti !== previousTarget,
      seed,
      release: 0.105 + clamp01(a.x / width) * 0.115 + seed * 0.035,
      arrival:
        0.78 +
        clamp01(b.x / width) * 0.14 +
        ("edge" in b && b.edge ? -0.035 : 0.015) +
        seed * 0.025,
      depth: 0.35 + seed * 0.65,
      radius: 0.38 + seed * 0.48,
      color: palette[seed < 0.64 ? 0 : seed < 0.84 ? 1 : seed < 0.96 ? 2 : 3],
      colorGroup: seed < 0.64 ? 0 : seed < 0.84 ? 1 : seed < 0.96 ? 2 : 3,
    };
    previousSource = si;
    previousTarget = ti;
    return particle;
  });
}
export function cubicBezier(
  a: number,
  b: number,
  c: number,
  d: number,
  t: number,
) {
  return (
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t * t * c +
    t ** 3 * d
  );
}
export type MorphPhase = "shimmer" | "breakup" | "swirl" | "reform";
export function getMorphPhase(t: number): MorphPhase {
  return t < 0.12
    ? "shimmer"
    : t < 0.32
      ? "breakup"
      : t < 0.76
        ? "swirl"
        : "reform";
}
export function getCinematicPhase(t: number) {
  return t < 0.105
    ? "living"
    : t < 0.26
      ? "fracture"
      : t < 0.38
        ? "dissolve"
        : t < 0.6
          ? "orbital"
          : t < 0.94
            ? "summoning"
            : "settlement";
}

/** One continuous field with zero endpoint velocity; no jumps between phases.
 * out: x, y, local travel, depth. Reuse scratch storage instead of frame allocations. */
export function particlePosition(
  p: MorphParticle,
  progress: number,
  width: number,
  height: number,
  prototype: MotionPrototype,
  out: Float64Array,
) {
  const travel = clamp01((progress - p.release) / (p.arrival - p.release)),
    u = smooth(travel),
    envelope = Math.sin(Math.PI * u);
  const lane = (p.sx / width) * 5.4 + p.seed * 0.7,
    angle = u * Math.PI * 2 + lane;
  const xFlow =
    prototype === "vortex"
      ? Math.cos(angle) * width * 0.14
      : Math.sin(u * Math.PI * 2 + lane * 0.3) * width * 0.075;
  const yFlow =
    (Math.sin(angle) * (prototype === "vortex" ? 0.32 : 0.38) +
      (p.seed - 0.5) * 0.09) *
    height;
  out[0] = Math.max(
    2,
    Math.min(width - 2, mix(p.sx, p.tx, u) + envelope * xFlow),
  );
  out[1] = Math.max(
    2,
    Math.min(height - 2, mix(p.sy, p.ty, u) + envelope * yFlow),
  );
  out[2] = travel;
  out[3] = 0.65 + 0.35 * Math.cos(angle);
}
export interface MorphArtwork {
  source: GlyphGeometry;
  target: GlyphGeometry;
  prototype?: MotionPrototype;
}
const position = new Float64Array(4),
  tail = new Float64Array(4);
function paintGlyphMask(
  ctx: CanvasRenderingContext2D,
  geometry: GlyphGeometry,
  particles: MorphParticle[],
  progress: number,
  destination: boolean,
) {
  ctx.save();
  ctx.beginPath();
  let visible = false;
  for (const p of particles) {
    const fragment = destination ? p.target : p.source;
    if (!fragment || !(destination ? p.targetPrimary : p.sourcePrimary)) continue;
    const travel = clamp01((progress - p.release) / (p.arrival - p.release));
    const coverage = destination
      ? smooth((travel - 0.78) / 0.22)
      : 1 - smooth(travel / 0.22);
    if (coverage <= 0) continue;
    const inset = fragment.size * (1 - coverage) / 2;
    ctx.rect(fragment.left + inset, fragment.top + inset,
      fragment.size * coverage, fragment.size * coverage);
    visible = true;
  }
  if (visible) {
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.drawImage(geometry.mask, 0, 0, geometry.width, geometry.height);
  }
  ctx.restore();
}
/** A travelling erosion front exposes glyph-derived dust. Destination coverage
 * grows only as those particles arrive. Two clipped mask draws replace hundreds
 * of individual drawImage calls; the DOM remains hidden throughout assembly. */
export function drawMorphFrame(
  ctx: CanvasRenderingContext2D,
  particles: MorphParticle[],
  progress: number,
  width: number,
  height: number,
  _theme: MorphTheme = "midnight",
  artwork?: MorphArtwork,
) {
  ctx.clearRect(0, 0, width, height);
  const t = clamp01(progress),
    prototype = artwork?.prototype ?? FINAL_PROTOTYPE;
  const dustPaths = artwork ? Array.from({length: 16}, () => new Path2D()) : null;
  const trailPaths = artwork ? Array.from({length: 4}, () => new Path2D()) : null;
  const haloPaths = artwork ? Array.from({length: 4}, () => new Path2D()) : null;
  if (artwork) {
    paintGlyphMask(ctx, artwork.source, particles, t, false);
    paintGlyphMask(ctx, artwork.target, particles, t, true);
  }
  for (const p of particles) {
    particlePosition(p, t, width, height, prototype, position);
    const x = position[0],
      y = position[1],
      travel = position[2],
      depth = position[3];
    const dust = artwork
      ? Math.min(1, smooth(travel / 0.13)) *
        (1 - smooth((travel - 0.82) / 0.18))
      : 1;
    if (dust > 0.005) {
      const radius = p.radius * (0.65 + depth * 0.5);
      if (artwork && p.seed > 0.94) {
        const halo = haloPaths![p.colorGroup];
        halo.moveTo(x + radius * 3, y);
        halo.arc(x, y, radius * 3, 0, Math.PI * 2);
      }
      if (artwork && p.seed > 0.82 && travel > 0.14 && travel < 0.84) {
        particlePosition(
          p,
          Math.max(p.release, t - 0.012),
          width,
          height,
          prototype,
          tail,
        );
        const trail = trailPaths![p.colorGroup];
        trail.moveTo(tail[0], tail[1]);
        trail.lineTo(x, y);
      }
      if (dustPaths) {
        const band = Math.min(3, Math.floor(dust * (0.5 + depth * 0.42) * 4));
        const path = dustPaths[p.colorGroup * 4 + band];
        path.moveTo(x + radius, y);
        path.arc(x, y, radius, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = dust * (0.5 + depth * 0.42);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Activation light traces only still-owned contour tiles.
    if (artwork && p.sourcePrimary && travel === 0 && t > 0) {
      const light = Math.max(0, 1 - Math.abs(p.sx / width - t / 0.23) * 13);
      if (light && p.source?.edge) {
        ctx.globalAlpha = light * 0.45;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (dustPaths && trailPaths && haloPaths) {
    for (let color = 0; color < 4; color++) {
      ctx.fillStyle = ctx.strokeStyle = THEME_PALETTES[_theme][color];
      ctx.globalAlpha = 0.055;
      ctx.fill(haloPaths[color]);
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 0.45;
      ctx.stroke(trailPaths[color]);
      for (let band = 0; band < 4; band++) {
        ctx.globalAlpha = (band + 0.5) / 4;
        ctx.fill(dustPaths[color * 4 + band]);
      }
    }
  }
  ctx.globalAlpha = 1;
}
