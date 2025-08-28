// src/hooks/useUserVisits.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

// Type étendu pour inclure les détails de la propriété
export type UserVisit = Tables<'visits'> & {
  properties: Tables<'properties'>;
};

/**
 * Hook personnalisé pour récupérer les visites planifiées d'un utilisateur.
 * Gère l'état de chargement, les erreurs et les données.
 * @param user - L'objet utilisateur de Supabase.
 */
export function useUserVisits(user: User | null) {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [visits, setVisits] = useState<UserVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('visits')
        .select('*, properties(*)')
        .eq('client_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setVisits(data as UserVisit[]);
    } catch (err: any) {
      const errorMessage = "Impossible de charger vos visites.";
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return { visits, isLoading, error, refetch: fetchVisits };
}
