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
  signInWithEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const APPROVED_OWNER_EMAIL = 'syahmiaof123@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApprovedOwner, setIsApprovedOwner] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

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

  const signInWithEmailOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== APPROVED_OWNER_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `Akses ditolak: Hanya emel pemilik yang dibenarkan (${APPROVED_OWNER_EMAIL}).`,
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
      const message = err instanceof Error ? err.message : 'Gagal menghantar kod OTP';
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
            error: 'Akses ditolak: Akaun ini tidak dibenarkan mengakses ruang kerja awan peribadi.',
          };
        }
        setIsApprovedOwner(true);
        syncEngine.setAuthenticatedUser(data.session.user.id, data.session.user.email || null);
        setIsAuthModalOpen(false);
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kod OTP tidak sah';
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

