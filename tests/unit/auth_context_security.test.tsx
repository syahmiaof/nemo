import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { AccountSyncPanel } from '@/features/settings/AccountSyncPanel';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  setAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      updateUser: mocks.updateUser,
      signOut: mocks.signOut,
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}));

vi.mock('@/sync/syncEngine', () => ({
  syncEngine: { setAuthenticatedUser: mocks.setAuthenticatedUser },
}));

vi.mock('@/sync/useSync', () => ({
  useSync: () => ({
    status: 'signed_in',
    lastSyncAt: null,
    pendingCount: 0,
    errorMessage: null,
    isSyncing: false,
    triggerSync: vi.fn(),
  }),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/features/settings/AdminMembersPanel', () => ({
  AdminMembersPanel: () => null,
}));

const authenticatedUser = {
  id: 'owner-user-id',
  email: 'syahmiaof123@gmail.com',
};
let authStateCallback: ((event: string, session: { user: typeof authenticatedUser } | null) => void) | undefined;

const AuthActions: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <output data-testid="auth-state">{auth.user ? 'signed-in' : 'signed-out'}</output>
      <output data-testid="auth-loading">{auth.isLoading ? 'loading' : 'ready'}</output>
      <output data-testid="legacy-password-api">{'currentPassword' in auth ? 'exposed' : 'absent'}</output>
      <button onClick={() => void auth.signInWithPassword('test-only-password')}>Sign in</button>
      <button onClick={() => void auth.updatePassword('test-only-new-password')}>Update password</button>
      <AccountSyncPanel />
    </div>
  );
};

describe('Auth credential handling', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.signInWithPassword.mockReset();
    mocks.updateUser.mockReset();
    mocks.signOut.mockReset();
    mocks.setAuthenticatedUser.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    authStateCallback = undefined;
    mocks.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('removes the legacy plaintext password value on provider startup', async () => {
    localStorage.setItem('nemo_owner_active_password', 'legacy-test-only-password');

    render(<AuthProvider><AuthActions /></AuthProvider>);

    await waitFor(() => {
      expect(localStorage.getItem('nemo_owner_active_password')).toBeNull();
    });
  });

  it('uses Supabase for sign-in and password changes without caching or exposing either password', async () => {
    mocks.signInWithPassword.mockImplementation(async () => {
      authStateCallback?.('SIGNED_IN', { user: authenticatedUser });
      return {
        data: { user: authenticatedUser },
        error: null,
      };
    });
    mocks.updateUser.mockResolvedValue({ error: null });

    render(<AuthProvider><AuthActions /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signed-in'));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: authenticatedUser.email,
      password: 'test-only-password',
    });
    expect(mocks.setAuthenticatedUser).toHaveBeenCalledWith(authenticatedUser.id, authenticatedUser.email);

    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'test-only-new-password' }));

    expect(localStorage.getItem('nemo_owner_active_password')).toBeNull();
    expect(screen.getByTestId('legacy-password-api')).toHaveTextContent('absent');
    expect(screen.queryByText('Current Account Password')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy password/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show password/i })).not.toBeInTheDocument();
  });
});
