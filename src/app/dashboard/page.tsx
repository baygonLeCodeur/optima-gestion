// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { useUserFavorites, FavoriteProperty } from '@/hooks/useUserFavorites';
import { useUserVisits, UserVisit } from '@/hooks/useUserVisits';
import { useUserSavedSearches } from '@/hooks/useUserSavedSearches';
// --- UI Components ---
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { ClientUpcomingVisitsWidget } from '@/components/ClientUpcomingVisitsWidget';
import { RecentFavoritesWidget } from '@/components/RecentFavoritesWidget';
import RecentActivityWidget from '@/components/RecentActivityWidget';
import { RecommendedProperties } from '@/components/RecommendedProperties';
import { NotificationsList } from '@/components/NotificationsList';
// Importations depuis la bibliothèque de composants UI (ex: ShadCN)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyCardType } from '@/types';
import { Tables } from '@/types/supabase';
import { useIsClient } from '@/hooks/use-is-client';

// --- IMPORTATION DYNAMIQUE DU COMPOSANT DE CARTE ---
const SearchResultsMap = dynamic(
  () => import('@/components/SearchResultsMap'),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-md" />
  }
);

// --- Helper Function ---
const mapPropertyData = (property: Tables<'properties'> | null): PropertyCardType | null => {
    // Vérification de nullité pour éviter l'erreur
    if (!property) {
        console.warn('Property is null, skipping mapping');
        return null;
    }
    
    const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
    const imageUrl = (property.image_paths && property.image_paths.length > 0) ? property.image_paths[0] : 'https://placehold.co/600x400.png';
    return {
      id: property.id,
      type: property.title,
      status: status,
      price: `${new Intl.NumberFormat('fr-FR' ).format(property.price)} ${property.currency}`,
      address: `${property.address}, ${property.city}`,
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

// --- Composants de Contenu d'Onglet ---
const FavoritesTabContent: React.FC<{ isLoading: boolean; favorites: FavoriteProperty[]; error: string | null }> = ({ isLoading, favorites, error }) => (
  <Card>
    <CardHeader><CardTitle>Mes Propriétés Favorites</CardTitle></CardHeader>
    <CardContent>
      {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}</div>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites
            .map((fav) => mapPropertyData(fav.properties))
            .filter((property): property is PropertyCardType => property !== null)
            .map((property) => <PropertyCard key={property.id} property={property} />)
          }
        </div>
      )}
       {!isLoading && !error && favorites.length === 0 && <p>Vous n'avez aucune propriété favorite pour le moment.</p>}
    </CardContent>
  </Card>
);

const VisitsTabContent: React.FC<{ isLoading: boolean; visits: UserVisit[]; error: string | null }> = ({ isLoading, visits, error }) => {
  const isClient = useIsClient();
  return(
        <Card>
            <CardHeader><CardTitle>Mes Visites</CardTitle></CardHeader>
            <CardContent>
                {isLoading && <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
                {error && <p className="text-red-500">{error}</p>}
                {isClient && !isLoading && !error && visits.length > 0 && (
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
    )
};

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

// --- Composant Principal (VERSION CORRIGÉE) ---
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  
  // N'initialiser les hooks de données que si l'utilisateur est connecté
  const { favorites, isLoading: isLoadingFavorites, error: favoritesError } = useUserFavorites(user);
  const { visits, isLoading: isLoadingVisits, error: visitsError } = useUserVisits(user);
  const { savedSearches, isLoading: isLoadingSearches, error: searchesError, handleAlertToggle } = useUserSavedSearches(user);

  // Effet pour gérer la redirection et l'initialisation
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsInitialized(true);
      }
    }
  }, [user, authLoading, router]);

  // Mécanisme de rafraîchissement automatique - Version forcée
  useEffect(() => {
    // Vérifier si c'est le premier chargement
    const hasRefreshed = localStorage.getItem('dashboard_auto_refreshed');
    const currentTime = Date.now();
    
    if (!hasRefreshed) {
      console.log('🔄 Programmation du rafraîchissement automatique...');
      
      // Marquer immédiatement pour éviter les boucles
      localStorage.setItem('dashboard_auto_refreshed', currentTime.toString());
      
      // Rafraîchissement forcé après 5 secondes, peu importe l'état
      const refreshTimer = setTimeout(() => {
        console.log('🔄 Exécution du rafraîchissement automatique...');
        window.location.reload();
      }, 5000);

      return () => clearTimeout(refreshTimer);
    } else {
      // Nettoyer le flag après 1 minute pour permettre un nouveau cycle si nécessaire
      const refreshTime = parseInt(hasRefreshed);
      if (currentTime - refreshTime > 60000) { // 1 minute
        localStorage.removeItem('dashboard_auto_refreshed');
      }
    }
  }, []);

  // Effet de secours - si rien ne se charge après 10 secondes
  useEffect(() => {
    const emergencyRefresh = setTimeout(() => {
      if (!user && !authLoading) {
        console.log('🚨 Rafraîchissement d\'urgence - pas d\'utilisateur après 10s');
        window.location.reload();
      }
    }, 10000);

    return () => clearTimeout(emergencyRefresh);
  }, []);

  // Gestion de l'état de chargement initial
  if (authLoading || !isInitialized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg">Chargement de votre espace...</p>
              <p className="text-sm text-gray-600 mt-2">
                Rafraîchissement automatique dans 5 secondes si nécessaire...
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Rafraîchir maintenant
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si pas d'utilisateur après initialisation, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  // Calculer les propriétés pour la carte de façon sécurisée
  const allProperties = favorites && Array.isArray(favorites) 
    ? favorites
        .map(fav => mapPropertyData(fav.properties))
        .filter((property): property is PropertyCardType => property !== null)
    : [];

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
            <TabsTrigger value="map">Carte des favoris</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <RecentActivityWidget />
              </div>
              <div className="space-y-6">
                <ClientUpcomingVisitsWidget 
                  visits={visits || []} 
                  isLoading={isLoadingVisits} 
                  onSeeAll={() => setActiveTab('visits')} 
                />
                <RecentFavoritesWidget 
                  favorites={favorites || []} 
                  isLoading={isLoadingFavorites} 
                  onSeeAll={() => setActiveTab('favorites')} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsList />
          </TabsContent>
          
          <TabsContent value="favorites">
            <FavoritesTabContent 
              isLoading={isLoadingFavorites} 
              favorites={favorites || []} 
              error={favoritesError} 
            />
          </TabsContent>
          
          <TabsContent value="visits">
            <VisitsTabContent 
              isLoading={isLoadingVisits} 
              visits={visits || []} 
              error={visitsError} 
            />
          </TabsContent>
          
          <TabsContent value="searches">
            <SavedSearchesTabContent 
              isLoading={isLoadingSearches}
              searches={savedSearches || []}
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
          
          <TabsContent value="map">
            <Card>
              <CardHeader><CardTitle>Carte de vos propriétés favorites</CardTitle></CardHeader>
              <CardContent>
                {allProperties.length > 0 ? (
                  <SearchResultsMap properties={allProperties} />
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <p>Aucune propriété favorite à afficher sur la carte</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}