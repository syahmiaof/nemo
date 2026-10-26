import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { AccountSyncPanel } from '@/features/settings/AccountSyncPanel';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
    from: mocks.from,
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/features/settings/AdminMembersPanel', () => ({
  AdminMembersPanel: () => null,
}));

function createMockQueryBuilder(rows: any[] = [], singleRow: any = null) {
  const result = { data: rows, error: null };
  const singleResult = { data: singleRow, error: null };
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue(singleResult),
    single: vi.fn().mockResolvedValue(singleResult),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(result).catch(reject),
  };
  return builder;
}

const userA = {
  id: 'user-a-uuid',
  email: 'syahmiaof123@gmail.com',
};

const userB = {
  id: 'user-b-uuid',
  email: 'syahmiaof123@gmail.com',
};

const userC = {
  id: 'user-c-uuid-new-tester',
  email: 'syahmiaof123@gmail.com',
};

const TestApp: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <output data-testid="user-id">{auth.user?.id || 'none'}</output>
      <output data-testid="auth-loading">{auth.isLoading ? 'loading' : 'ready'}</output>
      <button onClick={() => void auth.signInWithPassword('password123', userA.email)}>Login User A</button>
      <button onClick={() => void auth.signInWithPassword('password456', userB.email)}>Login User B</button>
      <button onClick={() => void auth.signInWithPassword('password789', userC.email)}>Login User C</button>
      <button onClick={() => void auth.signOut()}>Sign Out</button>
      <AccountSyncPanel />
    </div>
  );
};

describe('Multi-User Data Isolation & Cache Sanitization (R1 & R2)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await resetWorkspaceData();
    mocks.signInWithPassword.mockReset();
    mocks.signOut.mockReset();
    mocks.from.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.onAuthStateChange.mockImplementation((_cb) => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));

    // Default mock for queries
    mocks.from.mockImplementation((table: string) => {
      if (table === 'app_owners') {
        return createMockQueryBuilder([], { email: 'syahmiaof123@gmail.com' });
      }
      return createMockQueryBuilder([], null);
    });
  });

  afterEach(async () => {
    cleanup();
    localStorage.clear();
    await resetWorkspaceData();
  });

  async function seedUserASensitiveData() {
    await db.tasks.put({
      id: 'task-a-1',
      title: 'User A Secret Project Plan',
      status: 'todo',
      priority: 'urgent',
      tags: ['secret'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.projects.put({
      id: 'proj-a-1',
      title: 'User A Confidential Strategy',
      priority: 'high',
      status: 'in_progress',
      tags: ['confidential'],
      techStack: ['React'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.financialProfiles.put({
      id: 'profile-a',
      monthlyIncomeNet: 15000,
      currency: 'MYR',
      updatedAt: new Date().toISOString(),
    });

    await db.financialCommitments.put({
      id: 'commit-a-1',
      title: 'User A Private Mortgage',
      amount: 2500,
      dueDayOfMonth: 1,
      category: 'needs',
      isPaidThisMonth: false,
      autoRenew: true,
      notes: 'Secret account',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.ibadahDailyLogs.put({
      id: 'ibadah-a-1',
      date: '2026-10-26',
      prayers: {
        subuh: { status: 'on_time' },
        zohor: { status: 'on_time' },
        asar: { status: 'on_time' },
        maghrib: { status: 'on_time' },
        isyak: { status: 'on_time' },
      },
      sunnahPrayers: {},
      quranPagesRead: 5,
      dhikrCount: 100,
      sedekahDone: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.assetBlobs.put({
      id: 'blob-a-1',
      ownerType: 'profile',
      ownerId: 'user-a-uuid',
      mimeType: 'image/png',
      size: 1024,
      data: 'data:image/png;base64,SECRET_USER_A_PHOTO',
      createdAt: new Date().toISOString(),
    });

    await db.syncMutations.put({
      id: 'mut-a-1',
      ownerUserId: 'user-a-uuid',
      entityType: 'task',
      entityId: 'task-a-1',
      operation: 'UPSERT',
      payload: { title: 'User A Secret Task Mutation' },
      clientTimestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  it('R1: Signing out completely wipes all local IndexedDB records and queued mutations', async () => {
    // 1. Seed User A's data
    await seedUserASensitiveData();
    localStorage.setItem('nemo_last_auth_user_id', userA.id);

    expect(await db.tasks.count()).toBe(1);
    expect(await db.projects.count()).toBe(1);
    expect(await db.financialProfiles.count()).toBe(1);
    expect(await db.financialCommitments.count()).toBe(1);
    expect(await db.ibadahDailyLogs.count()).toBe(1);
    expect(await db.assetBlobs.count()).toBe(1);
    expect(await db.syncMutations.count()).toBeGreaterThanOrEqual(1);

    // 2. Render provider and trigger signOut
    mocks.getSession.mockResolvedValue({ data: { session: { user: userA } } });
    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

    await waitFor(async () => {
      expect(await db.tasks.count()).toBe(0);
      expect(await db.projects.count()).toBe(0);
      expect(await db.financialProfiles.count()).toBe(0);
      expect(await db.financialCommitments.count()).toBe(0);
      expect(await db.ibadahDailyLogs.count()).toBe(0);
      expect(await db.assetBlobs.count()).toBe(0);
      expect(await db.syncMutations.count()).toBe(0);
    });

    // Verify localStorage last user ID is sanitized
    expect(localStorage.getItem('nemo_last_auth_user_id')).toBeNull();
  });

  it('R1: AccountSyncPanel Log Out button triggers resetWorkspaceData', async () => {
    await seedUserASensitiveData();
    mocks.getSession.mockResolvedValue({ data: { session: { user: userA } } });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready'));
    const logOutBtn = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logOutBtn);

    await waitFor(async () => {
      expect(await db.tasks.count()).toBe(0);
      expect(await db.financialProfiles.count()).toBe(0);
      expect(await db.syncMutations.count()).toBe(0);
    });
  });

  it('R1 & R2: Direct account switch (User A -> User B) sanitizes User A records and hydrates User B', async () => {
    // Seed User A local records
    await seedUserASensitiveData();
    localStorage.setItem('nemo_last_auth_user_id', userA.id);

    // Mock User B sign in returning User B
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: userB },
      error: null,
    });

    // Mock remote data for User B
    const remoteUserBTasks = [
      {
        id: 'task-b-1',
        user_id: userB.id,
        title: "User B's Fresh Cloud Task",
        status: 'todo',
        priority: 'high',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    mocks.from.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return createMockQueryBuilder(remoteUserBTasks);
      }
      if (table === 'app_owners') {
        return createMockQueryBuilder([], { email: userB.email });
      }
      return createMockQueryBuilder([], null);
    });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready'));

    // Trigger Login User B
    fireEvent.click(screen.getByRole('button', { name: 'Login User B' }));

    await waitFor(async () => {
      // User A's task MUST NOT exist
      const taskA = await db.tasks.get('task-a-1');
      expect(taskA).toBeUndefined();

      // User A's financial profile MUST NOT exist
      const finA = await db.financialProfiles.get('profile-a');
      expect(finA).toBeUndefined();

      // User A's outbox mutation MUST NOT exist
      const mutA = await db.syncMutations.get('mut-a-1');
      expect(mutA).toBeUndefined();

      // User B's fresh cloud task MUST be re-hydrated
      const taskB = await db.tasks.get('task-b-1');
      expect(taskB).toBeDefined();
      expect(taskB?.title).toBe("User B's Fresh Cloud Task");
    });

    // User B's active ID is recorded
    expect(localStorage.getItem('nemo_last_auth_user_id')).toBe(userB.id);
  });

  it('R2: A newly registered tester (User C) sees an honest clean empty state without residual data', async () => {
    // Prior session left User A data
    await seedUserASensitiveData();
    localStorage.setItem('nemo_last_auth_user_id', userA.id);

    mocks.signInWithPassword.mockResolvedValue({
      data: { user: userC },
      error: null,
    });

    // User C has no cloud records
    mocks.from.mockImplementation((table: string) => {
      if (table === 'app_owners') {
        return createMockQueryBuilder([], { email: userC.email });
      }
      return createMockQueryBuilder([], null);
    });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Login User C' }));

    await waitFor(async () => {
      expect(screen.getByTestId('user-id')).toHaveTextContent(userC.id);
      expect(await db.tasks.count()).toBe(0);
      expect(await db.projects.count()).toBe(0);
      expect(await db.financialProfiles.count()).toBe(0);
      expect(await db.financialCommitments.count()).toBe(0);
      expect(await db.ibadahDailyLogs.count()).toBe(0);
      expect(await db.syncMutations.count()).toBe(0);
    });

    expect(localStorage.getItem('nemo_last_auth_user_id')).toBe(userC.id);
  });

  it('R1: Prevents unauthenticated secondary users on shared device from seeing previous user data', async () => {
    // User A was authenticated in prior browser session
    await seedUserASensitiveData();
    localStorage.setItem('nemo_last_auth_user_id', userA.id);

    // Session has expired or is revoked on server
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    );

    await waitFor(async () => {
      // Local workspace must be completely sanitized on cold start when previous user session is gone
      expect(await db.tasks.count()).toBe(0);
      expect(await db.financialProfiles.count()).toBe(0);
      expect(await db.syncMutations.count()).toBe(0);
    });

    expect(localStorage.getItem('nemo_last_auth_user_id')).toBeNull();
  });
});
