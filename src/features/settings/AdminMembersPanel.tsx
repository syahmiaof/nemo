import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Copy,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

interface WorkspaceMember {
  email: string;
  is_approved: boolean;
  created_at: string;
  owner_user_id: string | null;
  initial_password?: string | null;
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Password visibility map (email -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Edit Password modal / inline state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const togglePasswordVisibility = (email: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

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

  const handleUpdatePassword = async (email: string) => {
    if (editPasswordValue.length < 6) {
      toastError('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.rpc('admin_update_member_password', {
        p_email: email,
        p_new_password: editPasswordValue,
      });

      if (error) throw error;

      success('Password Updated', `New password for ${email} has been saved.`);
      setEditingEmail(null);
      setEditPasswordValue('');
      await loadMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      toastError('Update Failed', msg);
    } finally {
      setIsUpdatingPassword(false);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied', `${label} copied to clipboard!`);
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
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3 pr-16 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-accent-mint focus:ring-1 focus:ring-accent-mint text-content-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
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
          const isEditing = editingEmail === member.email;
          const isVisible = visiblePasswords[member.email] || false;
          const pwd = member.initial_password || '••••••••';

          return (
            <div
              key={member.email}
              className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isPrimary
                        ? 'bg-mint-500/15 text-accent-mint'
                        : 'bg-white/[0.06] text-content-secondary'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
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

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isPrimary && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingEmail(null);
                          } else {
                            setEditingEmail(member.email);
                            setEditPasswordValue(member.initial_password || '');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-subtle border border-border-subtle text-xs font-medium text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
                        title="Edit member password"
                      >
                        <Edit2 className="w-3 h-3 text-accent-mint" />
                        <span>{isEditing ? 'Cancel Edit' : 'Edit Password'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.email)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title={`Revoke access for ${member.email}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isDeleting ? 'Revoking...' : 'Revoke'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Password Display / Edit Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border-subtle/60 text-xs">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full animate-fade-in">
                    <span className="text-[11px] font-medium text-accent-mint shrink-0 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      New Password:
                    </span>
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={editPasswordValue}
                      onChange={(e) => setEditPasswordValue(e.target.value)}
                      placeholder="Min 6 characters"
                      className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-accent-mint/50 focus:border-accent-mint text-content-primary font-mono grow max-w-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={isUpdatingPassword}
                      onClick={() => handleUpdatePassword(member.email)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-accent-mint text-navy-950 font-semibold text-xs hover:bg-accent-mint/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isUpdatingPassword ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEmail(null)}
                      className="p-1 rounded-lg bg-surface text-content-tertiary hover:text-content-primary border border-border-subtle cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-content-secondary">
                    <span className="text-[11px] text-content-tertiary flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />
                      Password:
                    </span>
                    <span className="font-mono px-2 py-0.5 rounded bg-surface border border-border-subtle text-content-primary font-medium tracking-wider">
                      {isVisible ? pwd : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(member.email)}
                      className="p-1 rounded text-content-tertiary hover:text-content-primary transition-colors cursor-pointer"
                      title={isVisible ? 'Hide password' : 'Show password'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {isVisible && pwd !== '••••••••' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(pwd, 'Password')}
                        className="p-1 rounded text-content-tertiary hover:text-accent-mint transition-colors cursor-pointer"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
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
