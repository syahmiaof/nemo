import { describe, expect, it, vi } from 'vitest';
import { createMorphBuffer, drawMorphFrame, getMorphPhase } from '@/features/overview/motion/particleMorph';

function createCanvasContext() {
  const arcs: Array<[number, number, number]> = [];
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arc: vi.fn((x: number, y: number, radius: number) => arcs.push([x, y, radius])),
    fill: vi.fn(),
    globalAlpha: 1,
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D;
  return { ctx, arcs };
}

describe('particle quote morph', () => {
  it('exposes stable shimmer, breakup, swirl, and reform checkpoints', () => {
    expect(getMorphPhase(0.05)).toBe('shimmer');
    expect(getMorphPhase(0.2)).toBe('breakup');
    expect(getMorphPhase(0.5)).toBe('swirl');
    expect(getMorphPhase(0.9)).toBe('reform');
  });

  it('starts on source glyphs and lands exactly on sampled target glyphs', () => {
    const source = [{ x: 12, y: 18 }, { x: 22, y: 28 }];
    const target = [{ x: 72, y: 68 }, { x: 82, y: 78 }];
    const particles = createMorphBuffer(source, target, 100, 100);
    const { ctx, arcs } = createCanvasContext();

    drawMorphFrame(ctx, particles, 0, 100, 100);
    expect(arcs.slice(0, 2).map(([x, y]) => [x, y])).toEqual(source.map(({ x, y }) => [x, y]));

    arcs.length = 0;
    drawMorphFrame(ctx, particles, 1, 100, 100);
    expect(arcs.slice(0, 2).map(([x, y]) => [x, y])).toEqual(target.map(({ x, y }) => [x, y]));
  });

  it('bounds the morph buffer to the larger glyph cloud', () => {
    expect(createMorphBuffer([{ x: 1, y: 2 }], [{ x: 3, y: 4 }, { x: 5, y: 6 }], 100, 100)).toHaveLength(2);
    expect(createMorphBuffer([], [], 100, 100)).toHaveLength(0);
  });
});
