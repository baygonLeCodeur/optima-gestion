/* src/hooks/use-auth.tsx */
'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/types/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isClientRole: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type UserWithRole = Pick<Tables<'users'>, 'role'>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isClientRole, setIsClientRole] = useState(false);
  const supabase = createClient();

  const getUserAndSetRole = useCallback(async (currentUser: User | null) => {
    setIsAdmin(false);
    setIsAgent(false);
    setIsClientRole(false);

    if (currentUser) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (userData) {
        const typedUser = userData as UserWithRole;
        setIsAdmin(typedUser.role === 'admin');
        setIsAgent(typedUser.role === 'agent');
        setIsClientRole(typedUser.role === 'client');
      }
    }
    setUser(currentUser);
  }, [supabase]);

  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;

    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) {
        await getUserAndSetRole(user);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          const currentUser = session?.user ?? null;
          await getUserAndSetRole(currentUser);
        }
      }
    );
      
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };

  }, [isClient, getUserAndSetRole, supabase]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await getUserAndSetRole(user);
    setLoading(false);
  }, [getUserAndSetRole, supabase]);

  const value = { 
    user, 
    loading: loading || !isClient,
    isAdmin: isClient && isAdmin,
    isAgent: isClient && isAgent, 
    isClientRole: isClient && isClientRole,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
