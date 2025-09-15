/* src/hooks/use-auth.tsx */
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
  isClientRole: boolean; // Renommé pour éviter la confusion avec isClient (hydratation)
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type UserWithRole = Pick<Tables<'users'>, 'role'>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Vérification d'hydratation
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isClientRole, setIsClientRole] = useState(false); // Renommé pour éviter la confusion
  const supabase = createClient();

  useEffect(() => {
    // Ne pas initialiser l'authentification tant qu'on n'est pas côté client
    if (!isClient) return;

    const getUserAndSetRole = async (currentUser: User | null) => {
      // Réinitialiser les rôles par défaut
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
          // Définit les états en fonction du rôle trouvé
          setIsAdmin(typedUser.role === 'admin');
          setIsAgent(typedUser.role === 'agent');
          setIsClientRole(typedUser.role === 'client');
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

  }, [isClient]); // Ajouter isClient comme dépendance

  // Modifier la valeur retournée pour inclure la vérification d'hydratation
  const value = { 
    user, 
    loading: loading || !isClient, // Garder loading=true jusqu'à l'hydratation
    isAdmin: isClient && isAdmin, // Désactiver les rôles jusqu'à l'hydratation
    isAgent: isClient && isAgent, 
    isClientRole: isClient && isClientRole // Renommé pour éviter la confusion
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