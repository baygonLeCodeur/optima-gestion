// src/hooks/useUserSavedSearches.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, Database } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

type SavedSearch = Tables<'saved_searches'>;
type SavedSearchUpdate = { email_alerts?: boolean | null };

/**
 * Hook personnalisé pour gérer les recherches sauvegardées d'un utilisateur.
 * @param user - L'objet utilisateur de Supabase.
 */
export function useUserSavedSearches(user: User | null) {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedSearches = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }
      
      setSavedSearches(data as SavedSearch[]);
    } catch (err: any) {
      const errorMessage = "Impossible de charger vos recherches sauvegardées.";
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
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  const handleAlertToggle = async (searchId: string, currentStatus: boolean | null) => {
    if (!user) return;
    
    const newStatus = !currentStatus;
  // Use a typed Supabase client instead of a broad `any` cast
  // two-step cast via `unknown` to avoid strict incompatible generic instantiation errors
  const sb = supabase as unknown as SupabaseClient<Database>;
  const { error: updateError } = await sb
      .from('saved_searches')
      .update({ email_alerts: newStatus })
      .eq('user_id', user.id) // Sécurité : On s'assure de ne modifier que ses propres recherches
      .eq('id', searchId);

    if (updateError) {
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'alerte.",
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: `Alertes email ${newStatus ? 'activées' : 'désactivées'}.`,
      });
      // Rafraîchir la liste pour refléter le changement
      fetchSavedSearches(); 
    }
  };

  return { 
    savedSearches, 
    isLoading, 
    error, 
    handleAlertToggle, 
    refetch: fetchSavedSearches 
  };
}
