export interface Point {
  x: number;
  y: number;
}

export interface GlyphSampleOptions {
  text: string;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  /** A CSS font shorthand captured from the rendered quote when available. */
  font?: string;
  lineHeight?: number;
  maxParticles?: number;
  maxTextWidth?: number;
  dpr?: number;
}

/**
 * Wraps text into lines according to available width
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length ? lines : [text];
}

/**
 * Samples pixel glyph coordinates from rendered text using an offscreen canvas.
 * Returns centered (x, y) coordinates for particle initialization.
 */
export function sampleTextGlyphs(options: GlyphSampleOptions): Point[] {
  const {
    text,
    width,
    height,
    fontSize = 24,
    fontFamily = 'Urbanist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight = 600,
    font,
    lineHeight = 1.35,
    maxParticles = 650,
    maxTextWidth: requestedTextWidth,
    dpr: requestedDpr,
  } = options;

  if (typeof document === 'undefined' || width <= 0 || height <= 0 || !text.trim()) {
    return [];
  }

  const canvas = document.createElement('canvas');
  const dpr = Math.min(Math.max(requestedDpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), 1), 2);
  canvas.width = Math.max(Math.floor(width * dpr), 100);
  canvas.height = Math.max(Math.floor(height * dpr), 60);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.scale(dpr, dpr);
  ctx.font = font || `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTextWidth = Math.max(Math.min(requestedTextWidth ?? width - 24, width), 80);
  const lines = wrapText(ctx, text, maxTextWidth);
  const totalLineHeight = fontSize * lineHeight;
  const startY = height / 2 - ((lines.length - 1) * totalLineHeight) / 2;
  const centerX = width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * totalLineHeight);
  });

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  // Count first, then select evenly among covered pixels. This bounds point
  // allocations even for long copy or a high-DPR display.
  const step = Math.max(Math.floor(dpr * 2), 2);
  let covered = 0;
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] > 130) covered++;
    }
  }

  if (covered === 0 || maxParticles <= 0) {
    return [];
  }
  const count = Math.min(covered, Math.floor(maxParticles));
  const stride = covered / count;
  const points: Point[] = [];
  let seen = 0;
  let nextSample = 0;
  for (let y = 0; y < canvas.height && points.length < count; y += step) {
    for (let x = 0; x < canvas.width && points.length < count; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] <= 130) continue;
      if (seen >= nextSample) {
        points.push({ x: (x + step / 2) / dpr, y: (y + step / 2) / dpr });
        nextSample += stride;
      }
      seen++;
    }
  }
  return points;
}
