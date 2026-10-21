import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminMembersPanel } from '@/features/settings/AdminMembersPanel';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  success: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: async () => ({ data: [], error: null }),
      }),
    }),
    rpc: mocks.rpc,
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.toastError }),
}));

describe('Admin member credential handling', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.success.mockReset();
    mocks.toastError.mockReset();
    mocks.rpc.mockResolvedValue({ error: null });
  });

  afterEach(cleanup);

  it('requires an explicitly entered password and never echoes it in the success message', async () => {
    render(<AdminMembersPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Member' }));

    const passwordInput = screen.getByLabelText('Initial Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    expect(passwordInput.value).toBe('');

    fireEvent.change(screen.getByLabelText("Friend's Email"), { target: { value: 'tester@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'test-only-member-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create & Approve Member' }));

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('admin_add_workspace_member', {
      p_email: 'tester@example.com',
      p_password: 'test-only-member-password',
    }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    expect(mocks.success.mock.calls[0].join(' ')).not.toContain('test-only-member-password');
  });
});
