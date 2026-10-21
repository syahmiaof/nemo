import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  KeyRound,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

interface WorkspaceMember {
  email: string;
  is_approved: boolean;
  created_at: string;
  owner_user_id: string | null;
}

export const AdminMembersPanel: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_owners')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsAdding(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.rpc('admin_add_workspace_member', {
        p_email: cleanEmail,
        p_password: newPassword,
      });

      if (error) throw error;

      success('Member Added', `${cleanEmail} can now sign in with the password you set.`);
      setNewEmail('');
      setNewPassword('');
      setShowAddForm(false);
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add workspace member.';
      setErrorMessage(msg);
      toastError('Error', msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === 'syahmiaof123@gmail.com') {
      toastError('Action Not Allowed', 'Primary owner cannot be removed.');
      return;
    }

    setDeletingEmail(emailToRemove);
    try {
      const { error } = await supabase.rpc('admin_remove_workspace_member', {
        p_email: emailToRemove,
      });

      if (error) throw error;

      success('Member Removed', `${emailToRemove} has been revoked.`);
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove member.';
      toastError('Remove Failed', msg);
    } finally {
      setDeletingEmail(null);
    }
  };

  return (
    <div data-scroll-panel="true" className="rounded-2xl bg-surface border border-accent-mint/30 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint-500/15 border border-mint-500/30 flex items-center justify-center text-accent-mint">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-content-primary">
                Workspace Members (Admin)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                Owner Only
              </span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              Manage allowed accounts that can test cloud synchronization with their own credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadMembers}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
            title="Refresh members list"
            aria-label="Refresh members list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          className="p-4 rounded-xl bg-surface-subtle border border-accent-mint/30 space-y-3 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-mint">
            <UserPlus className="w-4 h-4" />
            <span>Add Friend or Tester Account</span>
          </div>

          <p className="text-[11px] text-content-secondary leading-relaxed">
            Enter your friend's email and set their initial login password. They can immediately log in on their device.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="member-email" className="block text-[11px] font-medium text-content-secondary mb-1">
                Friend's Email
              </label>
              <input
                id="member-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-accent-mint focus:ring-1 focus:ring-accent-mint text-content-primary placeholder-content-tertiary"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="member-password" className="block text-[11px] font-medium text-content-secondary mb-1">
                Initial Password
              </label>
              <div className="relative">
                <input
                  id="member-password"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-accent-mint focus:ring-1 focus:ring-accent-mint text-content-primary font-mono"
                />
                <KeyRound className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-xs text-content-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-3.5 py-1.5 rounded-lg bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAdding ? 'Adding Member...' : 'Create & Approve Member'}
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => {
          const isPrimary = member.email.toLowerCase() === 'syahmiaof123@gmail.com';
          const isDeleting = deletingEmail === member.email;

          return (
            <div
              key={member.email}
              className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isPrimary
                      ? 'bg-mint-500/15 text-accent-mint'
                      : 'bg-white/[0.06] text-content-secondary'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-content-primary truncate">
                      {member.email}
                    </p>
                    {isPrimary ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                        Primary Owner
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        Approved Member
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-content-tertiary">
                    Added {new Date(member.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!isPrimary && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.email)}
                  disabled={isDeleting}
                  className="self-end sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title={`Revoke access for ${member.email}`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isDeleting ? 'Revoking...' : 'Revoke Access'}</span>
                </button>
              )}
            </div>
          );
        })}

        {members.length === 0 && !isLoading && (
          <p className="text-xs text-content-tertiary p-2 text-center">
            No approved members found.
          </p>
        )}
      </div>
    </div>
  );
};
