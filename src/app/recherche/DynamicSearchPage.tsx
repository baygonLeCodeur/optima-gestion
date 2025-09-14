// src/app/recherche/DynamicSearchPage.tsx
'use client'; // <-- La directive est ici, c'est crucial !

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Un composant de chargement pour une meilleure expérience
const SearchPageLoadingSkeleton = () => (
  <main className="flex-grow py-16">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Skeleton className="h-24 w-full" />
        </aside>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full"/>)}
          </div>
        </div>
      </div>
    </div>
  </main>
);

// On importe dynamiquement la page client, SANS rendu côté serveur (SSR)
// Le chemin './SearchClientPage' est maintenant correct car il est relatif à ce fichier.
const SearchClientPage = dynamic(
  () => import('./SearchClientPage'), 
  { 
    ssr: false,
    loading: () => <SearchPageLoadingSkeleton />,
  }
);

export default function DynamicSearchPage() {
  return <SearchClientPage />;
}