import { describe, expect, it } from "vitest";
import { fragmentGlyphMask } from "@/features/overview/motion/particleSampler";
import {
  createMorphBuffer,
  particlePosition,
  getCinematicPhase,
} from "@/features/overview/motion/particleMorph";

describe("enchanted typography geometry", () => {
  const width = 36,
    height = 24;
  const mask = new Uint8ClampedArray(width * height * 4);
  // Two glyph-like vertical strokes with a connecting bar, including interiors.
  for (let y = 3; y < 21; y++)
    for (let x = 5; x < 28; x++)
      if (x < 10 || x > 22 || (y > 9 && y < 14))
        mask[(y * width + x) * 4 + 3] = 255;
  it("conserves every covered alpha pixel without overlapping tiles", () => {
    const tiles = fragmentGlyphMask(mask, width, height, 1, 120);
    expect(tiles.length).toBeGreaterThan(0);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (mask[(y * width + x) * 4 + 3]) {
          expect(
            tiles.filter(
              (t) =>
                x >= t.left &&
                x < t.left + t.size &&
                y >= t.top &&
                y < t.top + t.size,
            ),
          ).toHaveLength(1);
        }
    expect(tiles.some((t) => t.edge)).toBe(true);
    expect(tiles.some((t) => !t.edge)).toBe(true);
  });
  it("caps sampling without dropping glyph pixels and handles empty masks", () => {
    expect(
      fragmentGlyphMask(mask, width, height, 1, 8).length,
    ).toBeLessThanOrEqual(8);
    expect(
      fragmentGlyphMask(new Uint8ClampedArray(400), 10, 10, 1, 100),
    ).toEqual([]);
    expect(fragmentGlyphMask(mask, width, height, 1, 0)).toEqual([]);
  });
  it("has deterministic locality-preserving correspondence and exactly one tile owner", () => {
    const a = fragmentGlyphMask(mask, width, height, 1, 18),
      b = fragmentGlyphMask(mask, width, height, 1, 80);
    const particles = createMorphBuffer(a, b, width, height);
    expect(particles).toEqual(createMorphBuffer(a, b, width, height));
    expect(particles.filter((p) => p.sourcePrimary)).toHaveLength(a.length);
    expect(particles.filter((p) => p.targetPrimary)).toHaveLength(b.length);
    expect(
      new Set(particles.filter((p) => p.targetPrimary).map((p) => p.target)),
    ).toHaveProperty("size", b.length);
  });
  it.each(["ink", "vortex"] as const)(
    "%s trajectories are continuous, bounded and land at exact glyph coordinates",
    (prototype) => {
      const points = fragmentGlyphMask(mask, width, height, 1, 35);
      const particles = createMorphBuffer(
        points,
        points.slice(0, 8),
        width,
        height,
      );
      const out = new Float64Array(4),
        previous = new Float64Array(4);
      for (const p of particles) {
        particlePosition(p, 0, width, height, prototype, out);
        expect(Array.from(out.slice(0, 2))).toEqual([p.sx, p.sy]);
        let maxStep = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let t = 0; t <= 1; t += 0.001) {
          previous.set(out);
          particlePosition(p, t, width, height, prototype, out);
          maxStep = Math.max(maxStep, Math.hypot(out[0] - previous[0], out[1] - previous[1]));
          minX = Math.min(minX, out[0]); maxX = Math.max(maxX, out[0]);
          minY = Math.min(minY, out[1]); maxY = Math.max(maxY, out[1]);
        }
        expect(maxStep).toBeLessThan(1);
        expect(minX).toBeGreaterThanOrEqual(0);
        expect(maxX).toBeLessThanOrEqual(width);
        expect(minY).toBeGreaterThanOrEqual(0);
        expect(maxY).toBeLessThanOrEqual(height);
        particlePosition(p, 1, width, height, prototype, out);
        expect(out[0]).toBeCloseTo(p.tx, 10);
        expect(out[1]).toBeCloseTo(p.ty, 10);
      }
    },
  );
  it("exposes all six authored phases", () => {
    expect([0.05, 0.2, 0.3, 0.5, 0.8, 0.97].map(getCinematicPhase)).toEqual([
      "living",
      "fracture",
      "dissolve",
      "orbital",
      "summoning",
      "settlement",
    ]);
  });
});
