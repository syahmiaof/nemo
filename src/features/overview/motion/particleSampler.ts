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
  lineHeight?: number;
  maxParticles?: number;
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
    lineHeight = 1.35,
    maxParticles = 650,
  } = options;

  if (typeof document === 'undefined' || width <= 0 || height <= 0 || !text.trim()) {
    return [];
  }

  const canvas = document.createElement('canvas');
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  canvas.width = Math.max(Math.floor(width * dpr), 100);
  canvas.height = Math.max(Math.floor(height * dpr), 60);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.scale(dpr, dpr);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTextWidth = Math.max(width - 40, 100);
  const lines = wrapText(ctx, text, maxTextWidth);
  const totalLineHeight = fontSize * lineHeight;
  const startY = height / 2 - ((lines.length - 1) * totalLineHeight) / 2;
  const centerX = width / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * totalLineHeight);
  });

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const rawPoints: Point[] = [];

  // Determine sampling density based on pixel canvas dimensions to respect maxParticles
  const step = Math.max(Math.floor(dpr * 2), 2);

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 130) {
        rawPoints.push({
          x: x / dpr,
          y: y / dpr,
        });
      }
    }
  }

  if (rawPoints.length === 0) {
    return [];
  }

  // Downsample or shuffle if count exceeds maxParticles
  if (rawPoints.length > maxParticles) {
    const stride = rawPoints.length / maxParticles;
    const sampled: Point[] = [];
    for (let i = 0; i < maxParticles; i++) {
      const idx = Math.min(Math.floor(i * stride), rawPoints.length - 1);
      sampled.push(rawPoints[idx]);
    }
    return sampled;
  }

  return rawPoints;
}
