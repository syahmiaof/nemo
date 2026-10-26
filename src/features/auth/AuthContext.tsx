import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEngine } from '@/sync/syncEngine';
import { resetWorkspaceData } from '@/db/nemoDb';

interface AuthContextValue {
  isConfigured: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isApprovedOwner: boolean;
  signInWithPassword: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const APPROVED_OWNER_EMAIL = 'syahmiaof123@gmail.com';
const LEGACY_PASSWORD_STORAGE_KEY = 'nemo_owner_active_password';
const LAST_AUTH_USER_ID_STORAGE_KEY = 'nemo_last_auth_user_id';

function getStoredLastAuthUserId(): string | null {
  try {
    return window.localStorage.getItem(LAST_AUTH_USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredLastAuthUserId(userId: string | null): void {
  try {
    if (userId) {
      window.localStorage.setItem(LAST_AUTH_USER_ID_STORAGE_KEY, userId);
    } else {
      window.localStorage.removeItem(LAST_AUTH_USER_ID_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApprovedOwner, setIsApprovedOwner] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const checkOwnerApproval = async (userEmail?: string): Promise<boolean> => {
    if (!userEmail) return false;
    const clean = userEmail.trim().toLowerCase();
    if (clean === APPROVED_OWNER_EMAIL.toLowerCase()) return true;

    try {
      const { data } = await supabase
        .from('app_owners')
        .select('email')
        .eq('email', clean)
        .maybeSingle();
      if (data?.email) return true;
    } catch {
      // Fallback to primary owner check
    }
    return false;
  };

  useEffect(() => {
    // Older builds persisted the account password in localStorage. Remove that
    // legacy value as soon as this provider mounts; passwords are never cached.
    try {
      window.localStorage.removeItem(LEGACY_PASSWORD_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Check existing session on cold start
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);

      if (currentUser?.email) {
        const approved = await checkOwnerApproval(currentUser.email);
        setIsApprovedOwner(approved);
        if (approved) {
          const previousUserId = getStoredLastAuthUserId();
          if (previousUserId && previousUserId !== currentUser.id) {
            await resetWorkspaceData();
          }
          setStoredLastAuthUserId(currentUser.id);
          syncEngine.setAuthenticatedUser(currentUser.id, currentUser.email);
        } else {
          // Deny unapproved users immediately
          await supabase.auth.signOut();
          syncEngine.setAuthenticatedUser(null, null);
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
        }
      } else {
        syncEngine.setAuthenticatedUser(null, null);
        const previousUserId = getStoredLastAuthUserId();
        if (previousUserId) {
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
        }
      }
      setIsLoading(false);
    });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser?.email) {
        const approved = await checkOwnerApproval(currentUser.email);
        setIsApprovedOwner(approved);
        if (approved) {
          const previousUserId = getStoredLastAuthUserId();
          if (previousUserId && previousUserId !== currentUser.id) {
            await resetWorkspaceData();
          }
          setStoredLastAuthUserId(currentUser.id);
          syncEngine.setAuthenticatedUser(currentUser.id, currentUser.email);
        } else {
          await supabase.auth.signOut();
          syncEngine.setAuthenticatedUser(null, null);
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
        }
      } else {
        setIsApprovedOwner(false);
        syncEngine.setAuthenticatedUser(null, null);
        const previousUserId = getStoredLastAuthUserId();
        if (previousUserId || event === 'SIGNED_OUT') {
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (
    password: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const targetEmail = (email || '').trim().toLowerCase() || APPROVED_OWNER_EMAIL.toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: 'Incorrect email or password. Please verify and try again.' };
      }

      if (data.user?.email) {
        const approved = await checkOwnerApproval(data.user.email);
        if (!approved) {
          await supabase.auth.signOut();
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
          return {
            success: false,
            error: 'Access denied: Unauthorized owner account.',
          };
        }
        setIsApprovedOwner(true);
        setUser(data.user);
        if (data.session) setSession(data.session);

        const previousUserId = getStoredLastAuthUserId();
        if (previousUserId !== data.user.id) {
          await resetWorkspaceData();
        }
        setStoredLastAuthUserId(data.user.id);

        syncEngine.setAuthenticatedUser(data.user.id, data.user.email);
        if (typeof syncEngine.syncNow === 'function') {
          try {
            await syncEngine.syncNow();
          } catch (syncErr) {
            console.warn('Post-login cloud sync error:', syncErr);
          }
        }
        setIsAuthModalOpen(false);
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in error';
      return { success: false, error: message };
    }
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !user) {
      return { success: false, error: 'Please sign in first.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      return { success: false, error: message };
    }
  };

  const signInWithEmailOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== APPROVED_OWNER_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `Access denied: Only the authorized owner email (${APPROVED_OWNER_EMAIL}) is permitted.`,
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: (typeof window !== 'undefined' && window.location.origin ? window.location.origin + '/settings' : 'https://nemo.syahmiaof.my/settings'),
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP code';
      return { success: false, error: message };
    }
  };

  const verifyEmailOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        const approved = await checkOwnerApproval(data.session.user.email);
        if (!approved) {
          await supabase.auth.signOut();
          setStoredLastAuthUserId(null);
          await resetWorkspaceData();
          return {
            success: false,
            error: 'Access denied: This account is not authorized to access this private cloud workspace.',
          };
        }
        setIsApprovedOwner(true);
        setUser(data.session.user);
        setSession(data.session);

        const previousUserId = getStoredLastAuthUserId();
        if (previousUserId !== data.session.user.id) {
          await resetWorkspaceData();
        }
        setStoredLastAuthUserId(data.session.user.id);

        syncEngine.setAuthenticatedUser(data.session.user.id, data.session.user.email || null);
        if (typeof syncEngine.syncNow === 'function') {
          try {
            await syncEngine.syncNow();
          } catch (syncErr) {
            console.warn('Initial cloud sync on OTP verify error:', syncErr);
          }
        }
        setIsAuthModalOpen(false);
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid OTP code';
      return { success: false, error: message };
    }
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsApprovedOwner(false);
    syncEngine.setAuthenticatedUser(null, null);
    setStoredLastAuthUserId(null);
    await resetWorkspaceData();
  };

  const value = useMemo(
    () => ({
      isConfigured: isSupabaseConfigured,
      user,
      session,
      isLoading,
      isApprovedOwner,
      signInWithPassword,
      updatePassword,
      signInWithEmailOtp,
      verifyEmailOtp,
      signOut,
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
    }),
    [user, session, isLoading, isApprovedOwner, isAuthModalOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

