// src/components/RecommendedProperties.tsx
 'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { aiPropertyRecommendations } from '@/ai/flows/ai-property-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Interface pour stocker les recommandations formatées
interface Recommendation {
  title: string;
  description: string;
}

export function RecommendedProperties() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        const [favoritesRes, searchesRes] = await Promise.all([
          supabase.from('user_favorites').select('properties(title, description)').eq('user_id', user.id),
          supabase.from('saved_searches').select('search_criteria').eq('user_id', user.id),
        ]);

        if (favoritesRes.error) throw new Error('Could not fetch favorites.');
        if (searchesRes.error) throw new Error('Could not fetch saved searches.');

  type FavoriteRow = { properties?: { title?: string } | null };
  type SearchRow = { search_criteria?: unknown };

  const userPreferences = `User has favorited these properties: ${(favoritesRes.data as FavoriteRow[] | null)?.map((f) => f.properties?.title).filter(Boolean).join(', ') ?? ''}.`;
  const searchHistory = `User has searched for: ${(searchesRes.data as SearchRow[] | null)?.map((s) => JSON.stringify(s.search_criteria)).join('; ') ?? ''}.`;

        if ((favoritesRes.data?.length ?? 0) === 0 && (searchesRes.data?.length ?? 0) === 0) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // Timeout wrapper for AI call to avoid long blocking
        const aiPromise = aiPropertyRecommendations({ userPreferences, searchHistory });
        const aiResult = await Promise.race([
          aiPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('AI request timed out')), 7000)),
        ]);

  const parsedRecs = (aiResult as unknown as { propertyRecommendations: string }).propertyRecommendations
          .split('- ')
          .filter((rec: string) => rec.trim() !== '')
          .map((rec: string) => {
            const [title, ...descriptionParts] = rec.split(':');
            return { title: title.trim(), description: descriptionParts.join(':').trim() };
          });

        setRecommendations(parsedRecs);
      } catch (e: any) {
        console.error(e);
        setError('Impossible de générer les recommandations pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Plus d'interactions, plus de recommandations !</AlertTitle>
        <AlertDescription>
          Ajoutez des biens à vos favoris ou sauvegardez des recherches pour que nous puissions vous proposer des biens sur mesure.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{rec.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
