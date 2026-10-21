import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Validates that a string is a safe http/https URL.
 */
export function isValidWebUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if a string is a direct image URL.
 */
export function isDirectImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(clean) ||
    clean.includes('images.unsplash.com') ||
    clean.includes('imgur.com') ||
    clean.includes('res.cloudinary.com');
}

/**
 * Returns an automatic high-resolution website screenshot preview URL
 * (similar to WhatsApp / Slack link previews) without requiring manual upload.
 */
export function getProjectWebPreviewUrl(liveUrl?: string | null): string | null {
  if (!liveUrl || typeof liveUrl !== 'string') return null;
  const raw = liveUrl.trim();
  if (!raw) return null;
  const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    
    // If it's already a direct image URL, return as-is
    if (isDirectImageUrl(normalized)) {
      return normalized;
    }
    
    // High-performance, reliable screenshot preview API
    return `https://api.microlink.io/?url=${encodeURIComponent(normalized)}&screenshot=true&meta=false&embed=screenshot.url`;
  } catch {
    return null;
  }
}

/**
 * Secondary fallback screenshot generator if primary service fails
 */
export function getFallbackWebPreviewUrl(liveUrl?: string | null): string | null {
  if (!liveUrl || typeof liveUrl !== 'string') return null;
  const raw = liveUrl.trim();
  if (!raw) return null;
  const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `https://image.thum.io/get/width/600/crop/340/${normalized}`;
  } catch {
    return null;
  }
}

/**
 * Escapes XML/SVG special characters to prevent markup injection or parsing failure.
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generates an SVG data URL for a project typographic cover based on title and category.
 */
export function generateTypographicCover(title: string, _category?: string): string {
  const cleanTitle = title.trim() || 'Project';
  const initial = escapeXml(cleanTitle.charAt(0).toUpperCase());
  const safeTitle = escapeXml(cleanTitle.slice(0, 24));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" fill="none">
    <rect width="600" height="340" fill="#0F1A2D"/>
    <rect x="1" y="1" width="598" height="338" stroke="#1B2C44" stroke-width="2"/>
    <circle cx="500" cy="80" r="140" fill="#142138" opacity="0.6"/>
    <text x="48" y="240" fill="#EEF2FB" font-family="sans-serif" font-size="36" font-weight="700">${safeTitle}</text>
    <text x="520" y="280" fill="#1B2C44" font-family="sans-serif" font-size="120" font-weight="900" text-anchor="middle" opacity="0.5">${initial}</text>
    <path d="M 48 270 L 140 270" stroke="#A8DCC8" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
