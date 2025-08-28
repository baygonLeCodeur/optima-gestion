// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserFavorites, FavoriteProperty } from '@/hooks/useUserFavorites';
import { useUserVisits, UserVisit } from '@/hooks/useUserVisits';
import { useUserSavedSearches } from '@/hooks/useUserSavedSearches';

// UI Components
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { ClientUpcomingVisitsWidget } from '@/components/ClientUpcomingVisitsWidget';
import { RecentFavoritesWidget } from '@/components/RecentFavoritesWidget';
import RecentActivityWidget from '@/components/RecentActivityWidget';
import { RecommendedProperties } from '@/components/RecommendedProperties';
import { NotificationsList } from '@/components/NotificationsList';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Switch,
  Label,
  Skeleton
} from '@/components';
import { PropertyCardType } from '@/types';
import { Tables } from '@/types/supabase';


// --- Helper Function (avec la correction) ---
const mapPropertyData = (property: Tables<'properties'>): PropertyCardType => {
    const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
    const imageUrl = (property.image_paths && property.image_paths.length > 0) ? property.image_paths[0] : 'https://placehold.co/600x400.png';
    return {
      id: property.id,
      type: property.title,
      status: status,
      // La BDD attend un NUMERIC(15, 2 ) qui ne peut pas être null, donc pas besoin de fallback sur 0
      price: `${new Intl.NumberFormat('fr-FR').format(property.price)} ${property.currency}`,
      address: `${property.address}, ${property.city}`,
      // --- CORRECTION DE L'ERREUR ---
      // On utilise 'number_of_rooms' qui est disponible dans les types Supabase.
      // Si 'number_of_bedrooms' est le champ correct, il faudra régénérer les types.
      rooms: property.number_of_rooms || 0, 
      bathrooms: property.number_of_bathrooms || 0,
      area: property.area_sqm || 0,
      image_url: imageUrl,
      isFeatured: property.is_featured || false,
      dataAiHint: property.description?.substring(0, 50) || 'property image',
      latitude: property.latitude,
      longitude: property.longitude,
    };
};

// --- Le reste du fichier est déjà bien structuré et n'a pas besoin de modification ---

// --- Composants de Contenu d'Onglet ---
const FavoritesTabContent: React.FC<{ isLoading: boolean; favorites: FavoriteProperty[]; error: string | null }> = ({ isLoading, favorites, error }) => (
  <Card>
    <CardHeader><CardTitle>Mes Propriétés Favorites</CardTitle></CardHeader>
    <CardContent>
      {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}</div>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => <PropertyCard key={fav.id} property={mapPropertyData(fav.properties)} />)}
        </div>
      )}
    </CardContent>
  </Card>
);

const VisitsTabContent: React.FC<{ isLoading: boolean; visits: UserVisit[]; error: string | null }> = ({ isLoading, visits, error }) => (
    <Card>
        <CardHeader><CardTitle>Mes Visites</CardTitle></CardHeader>
        <CardContent>
            {isLoading && <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && !error && visits.length > 0 && (
                <div className="space-y-4">
                    {visits.map((visit) => (
                        <div key={visit.id} className="p-4 border rounded-md">
                            <h3 className="font-bold">{visit.properties.title}</h3>
                            <p>{visit.properties.address}</p>
                            <p>Status: <span className="font-semibold">{visit.status}</span></p>
                            <p>Date: {new Date(visit.scheduled_at).toLocaleString('fr-FR')}</p>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && !error && visits.length === 0 && <p>Vous n'avez aucune visite planifiée.</p>}
        </CardContent>
    </Card>
);

const SavedSearchesTabContent: React.FC<{
  isLoading: boolean;
  searches: Tables<'saved_searches'>[];
  error: string | null;
  onToggleAlert: (id: string, status: boolean | null) => void;
  onNavigate: (params: string) => void;
}> = ({ isLoading, searches, error, onToggleAlert, onNavigate }) => (
  <Card>
    <CardHeader><CardTitle>Mes Recherches Sauvegardées</CardTitle></CardHeader>
    <CardContent>
      {isLoading && <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && searches.length > 0 && (
        <div className="space-y-4">
          {searches.map((search) => (
            <div key={search.id} className="p-4 border rounded-md flex justify-between items-center">
              <div>
                <h3 className="font-bold">{search.name}</h3>
                <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sc = search.search_criteria;
                      const paramsString = typeof sc === 'string' ? sc : new URLSearchParams((sc as unknown as Record<string, string>)).toString();
                      onNavigate(paramsString);
                    }}
                  >
                    Voir les résultats
                  </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id={`alert-${search.id}`} checked={!!search.email_alerts} onCheckedChange={() => onToggleAlert(search.id, search.email_alerts)} />
                <Label htmlFor={`alert-${search.id}`}>Alertes Email</Label>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && searches.length === 0 && <p>Vous n'avez aucune recherche sauvegardée.</p>}
    </CardContent>
  </Card>
);


// --- Composant Principal ---
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebug = searchParams?.get('debug') === '1';
  const [activeTab, setActiveTab] = useState("dashboard");

  const { favorites, isLoading: isLoadingFavorites, error: favoritesError } = useUserFavorites(user);
  const { visits, isLoading: isLoadingVisits, error: visitsError } = useUserVisits(user);
  const { savedSearches, isLoading: isLoadingSearches, error: searchesError, handleAlertToggle } = useUserSavedSearches(user);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p>Chargement de votre espace...</p>
          {showDebug && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-sm">
              <strong>DEBUG:</strong>
              <pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, authLoading }, null, 2)}</pre>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mon Espace Client</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="favorites">Mes Favoris</TabsTrigger>
            <TabsTrigger value="visits">Mes Visites</TabsTrigger>
            <TabsTrigger value="searches">Mes Recherches</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <RecentActivityWidget />
              </div>
              <div className="space-y-6">
                <ClientUpcomingVisitsWidget visits={visits} isLoading={isLoadingVisits} onSeeAll={() => setActiveTab('visits')} />
                <RecentFavoritesWidget favorites={favorites} isLoading={isLoadingFavorites} onSeeAll={() => setActiveTab('favorites')} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications"><NotificationsList /></TabsContent>
          <TabsContent value="favorites"><FavoritesTabContent isLoading={isLoadingFavorites} favorites={favorites} error={favoritesError} /></TabsContent>
          <TabsContent value="visits"><VisitsTabContent isLoading={isLoadingVisits} visits={visits} error={visitsError} /></TabsContent>
          <TabsContent value="searches">
            <SavedSearchesTabContent 
              isLoading={isLoadingSearches}
              searches={savedSearches}
              error={searchesError}
              onToggleAlert={handleAlertToggle}
              onNavigate={(params) => router.push(`/recherche?${params}`)}
            />
          </TabsContent>
          <TabsContent value="recommendations">
            <Card>
              <CardHeader><CardTitle>Recommandations Personnalisées</CardTitle></CardHeader>
              <CardContent><RecommendedProperties /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
