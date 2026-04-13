import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSession, onAuthStateChange, supabase } from '@/lib/supabase';
import { isOwnerAccount } from '@/lib/access';

// Always use relative /api so Vite proxy routes to Express (port 3001)
const API_BASE_URL = '/api';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  business_name?: string | null;
  avatar_url?: string | null;
  invoice_prefix?: string;
  default_currency?: string;
  default_tax?: number;
  onboarding_completed?: boolean;
  notify_invoice_viewed?: boolean;
  notify_payment_received?: boolean;
  notify_daily_digest?: boolean;
  reminder_days?: number;
  plan?: string;
  trial_end?: string | null;
  is_owner?: boolean;
}

async function syncProfile(session: Session | null): Promise<UserProfile | null> {
  if (!session?.access_token || !session.user?.email) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: session.user.user_metadata?.full_name || null }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Failed to sync profile', e);
  }
  return null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Fast session check
    getSession().then(async currentSession => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user || null);
      if (currentSession) {
        const p = await syncProfile(currentSession);
        if (mounted && p) setProfile(p);
      }
      setIsLoading(false);
    }).catch(error => {
      if (!mounted) return;
      setIsLoading(false);
      console.error('Error initializing auth:', error);
    });

    // Listen for auth state changes
    const subscription = onAuthStateChange(async (newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession) {
        const p = await syncProfile(newSession);
        if (p) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    isOwner: isOwnerAccount(user?.email || profile?.email || ''),
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
