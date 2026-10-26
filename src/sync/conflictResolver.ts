/**
 * Nemo Conflict Resolution Engine
 * Implements non-destructive field-level merges and deterministic LWW reconciliation.
 */

export interface MergeResult<T> {
  resolved: T;
  hasConflict: boolean;
  conflictDetails?: string;
}

/**
 * Merges text fields non-destructively by preserving local changes if diverged.
 */
export function mergeTextField(
  localText?: string,
  remoteText?: string,
  localUpdated?: string,
  remoteUpdated?: string
): { text?: string; diverged: boolean } {
  if (!localText) return { text: remoteText, diverged: false };
  if (!remoteText) return { text: localText, diverged: false };
  if (localText.trim() === remoteText.trim()) return { text: remoteText, diverged: false };

  // If local update is newer
  const localTime = new Date(localUpdated || 0).getTime();
  const remoteTime = new Date(remoteUpdated || 0).getTime();

  if (localTime >= remoteTime) {
    return {
      text: `${remoteText}\n\n--- Local Draft (${new Date().toLocaleDateString()}) ---\n${localText}`,
      diverged: true,
    };
  }

  return {
    text: `${localText}\n\n--- Remote Draft (${new Date().toLocaleDateString()}) ---\n${remoteText}`,
    diverged: true,
  };
}

/**
 * Merges a local task and remote task record.
 * Status and title changes survive together; conflicting notes are safely appended.
 */
export function mergeTaskEntities(
  local: Record<string, any>,
  remote: Record<string, any>
): MergeResult<Record<string, any>> {
  const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
  const remoteTime = new Date(remote.updated_at || remote.created_at || 0).getTime();

  let hasConflict = false;
  let conflictDetails: string | undefined;

  // Base on the newer entity
  const resolved: Record<string, any> = localTime >= remoteTime ? { ...remote, ...local } : { ...local, ...remote };

  // Status priority: If either marked 'done' and completed, preserve done status
  if (local.status === 'done' || remote.status === 'done') {
    resolved.status = 'done';
    resolved.completedAt = local.completedAt || remote.completed_at || new Date().toISOString();
  }

  // Preserve notes if diverged
  if (local.notes && remote.notes && local.notes.trim() !== remote.notes.trim()) {
    const { text, diverged } = mergeTextField(
      local.notes,
      remote.notes,
      local.updatedAt,
      remote.updated_at
    );
    if (diverged) {
      resolved.notes = text;
      hasConflict = true;
      conflictDetails = `Task "${local.title || remote.title}" notes collided. Preserved both copies.`;
    }
  }

  return { resolved, hasConflict, conflictDetails };
}

/**
 * Standard Last-Write-Wins (LWW) resolver for generic entities.
 */
export function resolveGenericLWW<T extends Record<string, any>>(
  local: T,
  remote: T,
  localTimestampKey = 'updatedAt',
  remoteTimestampKey = 'updated_at'
): MergeResult<T> {
  const localTime = new Date(
    local[localTimestampKey] || local[remoteTimestampKey] || local.createdAt || local.created_at || 0
  ).getTime();
  const remoteTime = new Date(
    remote[remoteTimestampKey] || remote[localTimestampKey] || remote.created_at || remote.createdAt || 0
  ).getTime();

  if (localTime >= remoteTime) {
    return { resolved: { ...remote, ...local }, hasConflict: false };
  } else {
    return { resolved: { ...local, ...remote }, hasConflict: false };
  }
}
