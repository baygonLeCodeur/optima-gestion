// src/hooks/useUserFavorites.ts
 'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

// Type étendu pour inclure les détails de la propriété
export type FavoriteProperty = Tables<'user_favorites'> & {
  properties: Tables<'properties'>;
};

/**
 * Hook personnalisé pour récupérer les propriétés favorites d'un utilisateur.
 * Gère l'état de chargement, les erreurs et les données.
 * @param user - L'objet utilisateur de Supabase.
 */
export function useUserFavorites(user: User | null) {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('user_favorites')
        .select('*, properties(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setFavorites(data as FavoriteProperty[]);
    } catch (err: any) {
      const errorMessage = "Impossible de charger vos favoris.";
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
    fetchFavorites();
    // Écouter les changements globaux de favoris pour rafraîchir automatiquement
    const handler = () => fetchFavorites();
    window.addEventListener('favoritesChanged', handler as EventListener);
    return () => {
      window.removeEventListener('favoritesChanged', handler as EventListener);
    };
  }, [fetchFavorites]);

  return { favorites, isLoading, error, refetch: fetchFavorites };
}
