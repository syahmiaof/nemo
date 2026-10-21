export interface Point {
  x: number;
  y: number;
}

export interface GlyphFragment extends Point {
  left: number;
  top: number;
  size: number;
  edge: boolean;
}

export interface GlyphGeometry {
  mask: HTMLCanvasElement;
  fragments: GlyphFragment[];
  width: number;
  height: number;
  dpr: number;
  lines: number;
}

/** Partition the entire alpha mask, including stroke interiors and contours.
 * Unlike point-only sampling, these non-overlapping tiles conserve every pixel
 * of the letterforms at both ends of the morph. */
export function fragmentGlyphMask(
  data: Uint8ClampedArray,
  pixelWidth: number,
  pixelHeight: number,
  dpr: number,
  budget: number,
): GlyphFragment[] {
  if (budget <= 0 || pixelWidth <= 0 || pixelHeight <= 0) return [];
  const alpha = (x: number, y: number) =>
    x < 0 || y < 0 || x >= pixelWidth || y >= pixelHeight
      ? 0
      : data[(y * pixelWidth + x) * 4 + 3];
  let cell = Math.max(2, Math.round(dpr * 1.5));
  for (;;) {
    const fragments: GlyphFragment[] = [];
    for (let y = 0; y < pixelHeight; y += cell) {
      for (let x = 0; x < pixelWidth; x += cell) {
        let covered = false;
        let edge = false;
        for (let py = y; py < Math.min(y + cell, pixelHeight); py++) {
          for (let px = x; px < Math.min(x + cell, pixelWidth); px++) {
            if (alpha(px, py) < 20) continue;
            covered = true;
            if (
              alpha(px - 1, py) < 80 ||
              alpha(px + 1, py) < 80 ||
              alpha(px, py - 1) < 80 ||
              alpha(px, py + 1) < 80
            )
              edge = true;
          }
        }
        if (covered)
          fragments.push({
            x: (x + cell / 2) / dpr,
            y: (y + cell / 2) / dpr,
            left: x / dpr,
            top: y / dpr,
            size: cell / dpr,
            edge,
          });
      }
    }
    if (fragments.length <= budget) return fragments;
    cell++;
  }
}

/** Use the browser's own line boxes and kerning positions, rather than a
 * second word-wrapping algorithm. The hidden clone is removed synchronously. */
export function rasterizeQuote(
  text: string,
  element: HTMLParagraphElement,
  width: number,
  height: number,
  dpr: number,
  budget: number,
): GlyphGeometry | null {
  const parent = element.parentElement;
  if (!parent || width <= 0 || height <= 0) return null;
  const style = getComputedStyle(element);
  const parentStyle = getComputedStyle(parent);
  const availableWidth =
    width -
    parseFloat(parentStyle.paddingLeft || "0") -
    parseFloat(parentStyle.paddingRight || "0");
  const clone = element.cloneNode(false) as HTMLParagraphElement;
  clone.removeAttribute("id");
  clone.setAttribute("aria-hidden", "true");
  clone.textContent = text;
  Object.assign(clone.style, {
    position: "absolute",
    width: `${availableWidth}px`,
    height: "auto",
    minHeight: "0",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    margin: "0",
    visibility: "hidden",
    opacity: "1",
    transition: "none",
    pointerEvents: "none",
  });
  parent.appendChild(clone);
  const mask = document.createElement("canvas");
  mask.width = Math.ceil(width * dpr);
  mask.height = Math.ceil(height * dpr);
  const ctx = mask.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    clone.remove();
    return null;
  }
  ctx.scale(dpr, dpr);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fontKerning = "normal";
  // Range positions include letter-spacing. Painting a character at each range
  // origin also works on engines without CanvasRenderingContext2D.letterSpacing.
  const node = clone.firstChild!;
  const range = document.createRange();
  const container = parent.getBoundingClientRect();
  const scaleX = container.width / width || 1;
  const scaleY = container.height / height || 1;
  const fontMetrics = ctx.measureText("Mg");
  const fontSize = parseFloat(style.fontSize);
  const ascent = fontMetrics.fontBoundingBoxAscent ?? fontSize * 0.95;
  const descent = fontMetrics.fontBoundingBoxDescent ?? fontSize * 0.25;
  const lineTops = new Set<number>();
  try {
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const box = range.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      lineTops.add(Math.round(box.top));
      const baseline =
        (box.top - container.top) / scaleY + (box.height / scaleY - ascent - descent) / 2 + ascent;
      ctx.fillText(text[i], (box.left - container.left) / scaleX, baseline);
    }
  } finally {
    range.detach();
    clone.remove();
  }
  const pixels = ctx.getImageData(0, 0, mask.width, mask.height);
  return {
    mask,
    fragments: fragmentGlyphMask(
      pixels.data,
      mask.width,
      mask.height,
      dpr,
      budget,
    ),
    width,
    height,
    dpr,
    lines: lineTops.size,
  };
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
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

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

  if (
    typeof document === "undefined" ||
    width <= 0 ||
    height <= 0 ||
    !text.trim()
  ) {
    return [];
  }

  const canvas = document.createElement("canvas");
  const dpr = Math.min(
    Math.max(
      requestedDpr ??
        (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
      1,
    ),
    2,
  );
  canvas.width = Math.max(Math.floor(width * dpr), 100);
  canvas.height = Math.max(Math.floor(height * dpr), 60);

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.scale(dpr, dpr);
  ctx.font = font || `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxTextWidth = Math.max(
    Math.min(requestedTextWidth ?? width - 24, width),
    80,
  );
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
