export type WorkspaceMode = 'real' | 'demo';

export const REAL_DATABASE_NAME = 'NemoDatabase';
export const DEMO_DATABASE_NAME = 'NemoDemoDatabase_v1';
export const WORKSPACE_MODE_KEY = 'nemo:workspace-mode';

/** Unknown or unavailable preferences always open the existing real workspace. */
export function getWorkspaceMode(): WorkspaceMode {
  try {
    return localStorage.getItem(WORKSPACE_MODE_KEY) === 'demo' ? 'demo' : 'real';
  } catch {
    return 'real';
  }
}

export function databaseNameForMode(mode: WorkspaceMode): string {
  return mode === 'demo' ? DEMO_DATABASE_NAME : REAL_DATABASE_NAME;
}

/** Reload unmounts all subscriptions before a different database can be used. */
export function switchWorkspace(mode: WorkspaceMode): void {
  if (mode !== 'real' && mode !== 'demo') throw new Error('Unknown workspace mode.');
  try {
    localStorage.setItem(WORKSPACE_MODE_KEY, mode);
  } catch {
    throw new Error('Browser storage is unavailable. Enable local storage to switch workspaces.');
  }
  window.location.reload();
}
