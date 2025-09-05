// src/app/recherche/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PropertyCardType } from '@/types';

// Imports directs pour les exports par défaut
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import PropertyListItem from '@/components/PropertyListItem';

// Imports depuis l'index pour les autres
import {
    Skeleton,
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    Input,
    Label,
    ComparisonBar,
    Switch,
    SearchResultsMap
} from '@/components';
import { List, Grid, Map as MapIcon } from 'lucide-react';

interface FiltersState {
    price: { min: number; max: number };
    rooms: string;
    bathrooms: string;
    parking: string;
    area: { min: string; max: string };
    features: { pool: boolean; garden: boolean };
}

const mapPropertyData = (property: any): PropertyCardType => {
    // 1. Correction du statut (Location-Vente, À vendre, À louer)
    let statusText = '';
    if (property.is_for_rent && property.is_for_sale) {
        statusText = 'Location-Vente';
    } else if (property.is_for_rent && !property.is_for_sale) {
        statusText = 'À Louer';
    } else if (!property.is_for_rent && property.is_for_sale) {
        statusText = 'À Vendre';
    } else {
        statusText = 'Statut inconnu';
    }

    // 2. Correction de l'image (URL complète du Storage Supabase)
    let imageUrl = 'https://placehold.co/600x400.png';
    if (property.image_paths && Array.isArray(property.image_paths) && property.image_paths.length > 0) {
        const imagePath = property.image_paths[0];
        console.log('>>> DEBUG IMAGE - imagePath original:', imagePath);
        if (imagePath && typeof imagePath === 'string') {
            // Vérifier si l'URL est déjà complète (commence par http)
            if (imagePath.startsWith('http')) {
                imageUrl = imagePath;
                console.log('>>> DEBUG IMAGE - URL déjà complète, utilisation directe:', imageUrl);
            } else {
                // Construire l'URL complète pour le Storage Supabase
                imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties-images/${imagePath}`;
                console.log('>>> DEBUG IMAGE - URL construite:', imageUrl);
            }
        }
    }

    // 3. Correction de l'adresse (undefined, undefined)
    let displayAddress = 'Adresse inconnue';
    if (property.address && property.city) {
        displayAddress = `${property.address}, ${property.city}`;
    } else if (property.address) {
        displayAddress = property.address;
    } else if (property.city) {
        displayAddress = property.city;
    }

    // 4. Correction du prix (NaN undefined)
    let displayPrice = 'Prix non spécifié';
    if (property.price && typeof property.price === 'number' && !isNaN(property.price) && property.price > 0) {
        const currency = property.currency || 'XOF';
        displayPrice = `${new Intl.NumberFormat('fr-FR').format(property.price)} ${currency}`;
    }

    // 5. Correction du type de bien
    const propertyTypeName = property.property_types?.name || 'Type inconnu';

    return {
      id: property.id,
      type: propertyTypeName,
      status: statusText,
      price: displayPrice,
  // Tenter de récupérer une valeur numérique du prix même si la source fournit une chaîne
  numeric_price: (typeof property.price === 'number' && !isNaN(property.price)) ? property.price : (typeof property.price === 'string' ? (Number(property.price.replace(/[^0-9.-]+/g, '')) || null) : null),
      address: displayAddress,
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

const INITIAL_FILTERS_STATE: FiltersState = {
    price: { min: 0, max: 500000000 },
    rooms: 'any',
    bathrooms: 'any',
    parking: 'any',
    area: { min: '', max: '' },
    features: { pool: false, garden: false },
};

export default function SearchResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(INITIAL_FILTERS_STATE);
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchName, setSearchName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<PropertyCardType[]>([]);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceOptions, setPriceOptions] = useState<number[]>([]);

  const handleToggleCompare = (property: PropertyCardType) => {
    setSelectedProperties(prev => {
        const isSelected = prev.some(p => p.id === property.id);
        if (isSelected) {
            return prev.filter(p => p.id !== property.id);
        } else {
            if (prev.length >= 4) {
                toast({ title: "Limite atteinte", description: "Vous ne pouvez comparer que 4 biens à la fois." });
                return prev;
            }
            return [...prev, property];
        }
    });
  };

  const currentSearchCriteria = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const criteria: { [key: string]: any } = {};
    for (const [key, value] of params.entries()) {
        criteria[key] = value;
    }
    return criteria;
  }, [searchParams]);

  const handleFiltersChange = useCallback((newFilters: Partial<FiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS_STATE);
  }, []);
  
  const handleSaveSearch = async () => {
    if (!user) {
        toast({ title: "Connexion requise", description: "Vous devez être connecté pour sauvegarder une recherche.", variant: "destructive" });
        return router.push('/login');
    }
    if (!searchName.trim()) {
        toast({ title: "Nom manquant", description: "Veuillez donner un nom à votre recherche.", variant: "destructive" });
        return;
    }

    const searchCriteriaToSave = { ...currentSearchCriteria, ...filters };

    try {
    const supabase = createClient();
    const sb = supabase as unknown as SupabaseClient<Database>;
  const { error } = await sb.from('saved_searches').insert({
          user_id: user.id,
          name: searchName,
          search_criteria: searchCriteriaToSave,
          email_alerts: emailAlerts
      });
      if (error) throw error;
      toast({ title: "Recherche sauvegardée", description: `Votre recherche "${searchName}" a été sauvegardée.` });
      setIsDialogOpen(false);
      setSearchName('');
      setEmailAlerts(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        let query = supabase
          .from('properties')
          .select('*, property_types(name)')
          .eq('status', 'available');
        
        // --- NOUVELLE LOGIQUE DE RECHERCHE DE LOCALISATION ---
        if (currentSearchCriteria.location) {
          const location = currentSearchCriteria.location as string;
          if (location.includes('/')) {
            const [city, address] = location.split('/');
            query = query.ilike('city', `%${city.trim()}%`).ilike('address', `%${address.trim()}%`);
          } else {
            query = query.or(`city.ilike.%${location}%,address.ilike.%${location}%`);
          }
        }
        // --- FIN DE LA NOUVELLE LOGIQUE ---

        if (currentSearchCriteria.type) {
           query = query.eq('property_type_id', currentSearchCriteria.type);
        }
        
        if (currentSearchCriteria.operation) {
          switch (currentSearchCriteria.operation) {
            case 'À Vendre':
              query = query.eq('is_for_sale', true);
              break;
            case 'À Louer':
              query = query.eq('is_for_rent', true);
              break;
            case 'Location-Vente':
              query = query.eq('is_for_rent', true).eq('is_for_sale', true);
              break;
          }
        }
        
        query = query.gte('price', filters.price.min).lte('price', filters.price.max);
        if (filters.rooms !== 'any') query = query.gte('number_of_rooms', parseInt(filters.rooms));
        if (filters.bathrooms !== 'any') query = query.gte('number_of_bathrooms', parseInt(filters.bathrooms));
        if (filters.parking !== 'any') query = query.gte('number_of_parkings', parseInt(filters.parking));
        if (filters.area.min) query = query.gte('area_sqm', parseInt(filters.area.min));
        if (filters.area.max) query = query.lte('area_sqm', parseInt(filters.area.max));
        if (filters.features.pool) query = query.eq('has_pool', true);
        if (filters.features.garden) query = query.eq('has_garden', true);

        const { data, error } = await query;
        if (error) throw error;
        if (data) setProperties(data.map(mapPropertyData));
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [currentSearchCriteria, filters, searchParams]);

  // Effet dédié : mettre à jour les options de prix quand les propriétés sont chargées
  useEffect(() => {
    if (properties && properties.length > 0) {
      const nums = properties
        .map(p => p.numeric_price ?? null)
        .filter((n): n is number => typeof n === 'number')
        .sort((a, b) => a - b);

      const unique = Array.from(new Set(nums));
      setPriceOptions(unique);

      if (unique.length > 0 && (!filters.price || filters.price.max === INITIAL_FILTERS_STATE.price.max)) {
        setFilters(prev => ({ ...prev, price: { ...prev.price, max: unique[0] } }));
      }
    } else {
      setPriceOptions([]);
    }
  }, [properties]);

  // Fonction pour générer le titre de la page selon les critères de recherche (MODIFIÉE)
  const getSearchTitle = () => {
    const location = currentSearchCriteria.location;
    const operation = currentSearchCriteria.operation;
    const typeName = currentSearchCriteria.typeName; // Nom du type passé depuis Hero
    
    let title = 'Résultats de recherche';

    if (location && operation && typeName) {
      // Normaliser l'opération pour l'affichage
      let displayOperation = operation;
      if (operation === 'À Vendre') {
        displayOperation = 'à vendre';
      } else if (operation === 'À Louer') {
        displayOperation = 'à louer';
      } else if (operation === 'Location-Vente') {
        displayOperation = 'en location-vente';
      }
      
      title = `Résultats pour ${typeName.toLowerCase()} ${displayOperation} à ${location.toLowerCase()}`;
    } else if (location) {
      title = `Résultats de recherche pour ${location.toLowerCase()}`;
    }
    
    // Mettre la première lettre en majuscule
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{getSearchTitle()}</h1>
              {/* Afficher le nombre de résultats */}
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {loading ? 'Recherche en cours...' : `${properties.length} bien${properties.length > 1 ? 's' : ''} trouvé${properties.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button>Sauvegarder la recherche</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Sauvegarder la recherche</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-name">Nom de la recherche</Label>
                    <Input id="search-name" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Ex: Appartement Paris 10e" />
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch id="email-alerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                    <Label htmlFor="email-alerts">Recevoir les alertes par email</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSearch}>Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              {/* Filtre simplifié : une seule liste déroulante de prix triés (asc) */}
              <div className="bg-white p-4 rounded shadow">
                <label htmlFor="price-select" className="block text-sm font-medium text-gray-700">Filtrer par prix (max)</label>
                <select
                  id="price-select"
                  autoFocus
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={filters.price.max}
                  onChange={(e) => {
                    const val = parseInt(e.target.value || '0', 10);
                    handleFiltersChange({ price: { ...filters.price, max: val } });
                  }}
                >
                  <option value={INITIAL_FILTERS_STATE.price.max}>Tous les prix</option>
                  {priceOptions.map((p) => (
                    <option key={p} value={p}>{new Intl.NumberFormat('fr-FR').format(p)} { /* currency not shown intentionally */ }</option>
                  ))}
                </select>
                <div className="mt-3 text-sm text-gray-500">Choisissez un prix maximum pour limiter les résultats.</div>
              </div>
            </aside>
            <div className="lg:col-span-3">
               <div className="flex justify-end items-center mb-4">
                 <div className="flex items-center space-x-2 rounded-md bg-gray-200 p-1">
                    <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setView('grid')}><Grid/></Button>
                    <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setView('list')}><List/></Button>
                    <Button variant={view === 'map' ? 'default' : 'ghost'} size="icon" onClick={() => setView('map')}><MapIcon/></Button>
                 </div>
               </div>
              {loading && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">{[...Array(6)].map((_,i) => <Skeleton key={i} className="h-96 w-full"/>)}</div>}
              {error && <p className="text-red-500">Erreur: {error}</p>}
              {!loading && !error && (
                <>
                  {view === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {properties.map((p) => <PropertyCard key={p.id} property={p} onToggleCompare={handleToggleCompare} isSelected={selectedProperties.some(sp => sp.id === p.id)} />)}
                    </div>
                  )}
                  {view === 'list' && (
                    <div className="space-y-4">
                      {properties.map((p) => <PropertyListItem key={p.id} property={p} onToggleCompare={handleToggleCompare} isSelected={selectedProperties.some(sp => sp.id === p.id)} />)}
                    </div>
                  )}
                  {view === 'map' && <SearchResultsMap properties={properties} />}
                  {properties.length === 0 && <div className="text-center py-12 px-6 rounded-lg border-2 border-dashed"><h3 className="text-xl font-semibold">Aucun résultat</h3><p className="mt-2 text-gray-500">Essayez d'ajuster vos filtres ou de modifier vos critères de recherche.</p></div>}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ComparisonBar selectedProperties={selectedProperties} onClear={() => setSelectedProperties([])} />
    </div>
  );
}
