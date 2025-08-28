// src/components/SavedSearchesWidget.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';
import { Tables } from '@/types/supabase';
import { useRouter } from 'next/navigation';

type SavedSearch = Tables<'saved_searches'>;

interface SavedSearchesWidgetProps {
  searches: SavedSearch[];
  isLoading: boolean;
  onSeeAll: () => void;
}

export function SavedSearchesWidget({ searches, isLoading, onSeeAll }: SavedSearchesWidgetProps) {
  const router = useRouter();
  
    const handleRedirection = (search: SavedSearch) => {
    const criteria = search.search_criteria;
    let paramsString = '';
    try {
      if (typeof criteria === 'string') paramsString = criteria;
      else if (criteria && typeof criteria === 'object') {
        const entries = Object.entries(criteria as Record<string, unknown>)
          .map(([k, v]) => [k, String(v)]) as [string, string][];
        paramsString = new URLSearchParams(entries).toString();
      }
    } catch (e) {
      console.warn('Unable to serialize search criteria', e);
    }
    router.push(`/recherche?${paramsString}`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recherches Récentes</CardTitle>
        <Button variant="outline" size="sm" onClick={onSeeAll}>
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Chargement...</p>
        ) : searches.length > 0 ? (
          <div className="space-y-4">
            {searches.slice(0, 3).map((search) => (
              <div key={search.id} className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => handleRedirection(search)}>
                <h4 className="font-semibold">{search.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(() => {
                    try {
                      if (!search.search_criteria) return '';
                      if (typeof search.search_criteria === 'string') return search.search_criteria;
                      return Object.entries(search.search_criteria as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join(', ');
                    } catch (e) {
                      return '';
                    }
                  })()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucune recherche récente.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default SavedSearchesWidget;
