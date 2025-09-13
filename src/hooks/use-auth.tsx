// src/hooks/use-auth.tsx
 'use client';

import { useState, useEffect, createContext, useContext, useMemo } from 'react';
// On importe la fonction pour créer un client côté NAVIGATEUR
import { createClient } from '@/lib/supabase/client'; 
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'agent' | 'client';

interface UserWithRole extends User {
  role: UserRole;
}

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>; // Nouvelle méthode ajoutée
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Crée le client Supabase au montage (évite la création lors de l'import du module)
  const supabase = useMemo(() => createClient(), []);

  // Fonction pour mettre à jour l'état utilisateur à partir d'une session
  const updateUserFromSession = (currentSession: Session | null) => {
    setSession(currentSession);
    
    if (currentSession?.user) {
      const role = currentSession.user.user_metadata?.role || 'client';
      setUser({ ...currentSession.user, role });
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  // Nouvelle méthode pour rafraîchir manuellement la session
  const refreshSession = async () => {
    try {
      // Force la récupération de la session actuelle depuis les cookies
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Debug: log de diagnostic
      // eslint-disable-next-line no-console
      console.debug('use-auth: refreshSession result', currentSession);
      
      updateUserFromSession(currentSession);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur refreshSession', err);
    }
  };

  useEffect(() => {
    // Cette fonction est appelée au chargement initial pour récupérer la session.
    const getInitialSession = async () => {
      try {
        // Définit un timeout pour éviter que getSession() reste bloquée indéfiniment
        const timeoutMs = 5000;
        const getSessionPromise = supabase.auth.getSession();
        const result = await Promise.race([
          getSessionPromise,
          new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), timeoutMs)),
        ]);
  const initialSession = (result as unknown as { data?: { session: Session | null } })?.data?.session ?? null;
        // Debug: log de diagnostic (sera visible dans la console du navigateur)
        // eslint-disable-next-line no-console
        console.debug('use-auth: getInitialSession result', result);
        
        updateUserFromSession(initialSession);
      } catch (err) {
        // En cas d'erreur réseau ou d'API, on logge côté console et on continue pour ne pas bloquer l'UI
        // eslint-disable-next-line no-console
        console.error('Erreur getInitialSession', err);
        setLoading(false);
      }
    };

    getInitialSession();

    // Le listener de Supabase est la clé. Il réagit à SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, changedSession) => {
  // eslint-disable-next-line no-console
  console.debug('use-auth: onAuthStateChange', event, changedSession);
  
        updateUserFromSession(changedSession);
      }
    );

    return () => {
      try {
        // authListener peut être undefined si l'enregistrement a échoué
        if ((authListener as unknown as { subscription?: { unsubscribe?: () => void } })?.subscription?.unsubscribe) {
          (authListener as unknown as { subscription?: { unsubscribe?: () => void } })?.subscription?.unsubscribe?.();
        } else {
          // eslint-disable-next-line no-console
          console.debug('use-auth: authListener subscription not present on cleanup');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Erreur lors du nettoyage du listener auth', err);
      }
    };
  }, []); // Pas besoin de dépendances ici

  const signOut = async () => {
    await supabase.auth.signOut();
    // Pas besoin de vider l'état manuellement, le listener onAuthStateChange s'en chargera.
    router.push('/'); // Redirige vers l'accueil après déconnexion.
  };

  const value = { user, session, loading, signOut, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
