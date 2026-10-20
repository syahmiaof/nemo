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
 * Generates an SVG data URL for a project typographic cover based on title and category.
 */
export function generateTypographicCover(title: string, category?: string): string {
  const cleanTitle = title.trim() || 'Project';
  const initial = cleanTitle.charAt(0).toUpperCase();
  const sub = category ? category.trim().toUpperCase() : 'NEMO PROJECT';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" fill="none">
    <rect width="600" height="340" fill="#0F1A2D"/>
    <rect x="1" y="1" width="598" height="338" stroke="#1B2C44" stroke-width="2"/>
    <circle cx="500" cy="80" r="140" fill="#142138" opacity="0.6"/>
    <text x="48" y="80" fill="#A8DCC8" font-family="monospace" font-size="12" font-weight="600" letter-spacing="2">${sub}</text>
    <text x="48" y="240" fill="#EEF2FB" font-family="sans-serif" font-size="36" font-weight="700">${cleanTitle.slice(0, 24)}</text>
    <text x="520" y="280" fill="#1B2C44" font-family="sans-serif" font-size="120" font-weight="900" text-anchor="middle" opacity="0.5">${initial}</text>
    <path d="M 48 270 L 140 270" stroke="#A8DCC8" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
