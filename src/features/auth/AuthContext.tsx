import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEngine } from '@/sync/syncEngine';

interface AuthContextValue {
  isConfigured: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isApprovedOwner: boolean;
  currentPassword: string;
  signInWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
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
const DEFAULT_OWNER_PASSWORD = 'Nemo2026@owner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApprovedOwner, setIsApprovedOwner] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nemo_owner_active_password') || DEFAULT_OWNER_PASSWORD;
    }
    return DEFAULT_OWNER_PASSWORD;
  });

  const checkOwnerApproval = async (userEmail?: string): Promise<boolean> => {
    if (!userEmail) return false;
    return userEmail.trim().toLowerCase() === APPROVED_OWNER_EMAIL.toLowerCase();
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Check existing session on cold start
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);

      if (currentUser?.email) {
        const approved = currentUser.email.toLowerCase() === APPROVED_OWNER_EMAIL.toLowerCase();
        setIsApprovedOwner(approved);
        if (approved) {
          syncEngine.setAuthenticatedUser(currentUser.id, currentUser.email);
        } else {
          // Deny unapproved users immediately
          supabase.auth.signOut();
          syncEngine.setAuthenticatedUser(null, null);
        }
      } else {
        syncEngine.setAuthenticatedUser(null, null);
      }
      setIsLoading(false);
    });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser?.email) {
        const approved = await checkOwnerApproval(currentUser.email);
        setIsApprovedOwner(approved);
        if (approved) {
          syncEngine.setAuthenticatedUser(currentUser.id, currentUser.email);
        } else {
          await supabase.auth.signOut();
          syncEngine.setAuthenticatedUser(null, null);
        }
      } else {
        setIsApprovedOwner(false);
        syncEngine.setAuthenticatedUser(null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: APPROVED_OWNER_EMAIL,
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }

      if (data.user?.email) {
        const approved = await checkOwnerApproval(data.user.email);
        if (!approved) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Access denied: Unauthorized owner account.',
          };
        }
        setIsApprovedOwner(true);
        setCurrentPassword(password.trim());
        if (typeof window !== 'undefined') {
          localStorage.setItem('nemo_owner_active_password', password.trim());
        }
        syncEngine.setAuthenticatedUser(data.user.id, data.user.email);
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
      setCurrentPassword(newPassword.trim());
      if (typeof window !== 'undefined') {
        localStorage.setItem('nemo_owner_active_password', newPassword.trim());
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
          return {
            success: false,
            error: 'Access denied: This account is not authorized to access this private cloud workspace.',
          };
        }
        setIsApprovedOwner(true);
        syncEngine.setAuthenticatedUser(data.session.user.id, data.session.user.email || null);
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
  };

  const value = useMemo(
    () => ({
      isConfigured: isSupabaseConfigured,
      user,
      session,
      isLoading,
      isApprovedOwner,
      currentPassword,
      signInWithPassword,
      updatePassword,
      signInWithEmailOtp,
      verifyEmailOtp,
      signOut,
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
    }),
    [user, session, isLoading, isApprovedOwner, isAuthModalOpen, currentPassword]
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

