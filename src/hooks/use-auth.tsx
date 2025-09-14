// src/hooks/use-auth.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Tables } from '@/types/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isClient: boolean; // <-- Ajout du nouveau rôle
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type UserWithRole = Pick<Tables<'users'>, 'role'>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isClient, setIsClient] = useState(false); // <-- Ajout de l'état pour le client
  const supabase = createClient();

  useEffect(() => {
    const getUserAndSetRole = async (currentUser: User | null) => {
      // Réinitialiser les rôles par défaut
      setIsAdmin(false);
      setIsAgent(false);
      setIsClient(false);

      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          const typedUser = userData as UserWithRole;
          // --- DÉBUT DE LA CORRECTION ---
          // Définit les états en fonction du rôle trouvé
          setIsAdmin(typedUser.role === 'admin');
          setIsAgent(typedUser.role === 'agent');
          setIsClient(typedUser.role === 'client');
          // --- FIN DE LA CORRECTION ---
        }
      }
      setUser(currentUser);
    };

    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await getUserAndSetRole(user);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentUser = session?.user ?? null;
          await getUserAndSetRole(currentUser);
        }
      );
        
      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();

  }, []);

  const value = { user, loading, isAdmin, isAgent, isClient }; // <-- Ajout de isClient à la valeur du contexte

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};