/**
 * Generates collision-resistant unique identifiers.
 */
export function generateId(prefix?: string): string {
  let unique: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    unique = crypto.randomUUID();
  } else {
    unique = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return prefix ? `${prefix}_${unique}` : unique;
}
