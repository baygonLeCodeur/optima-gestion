'use client';

import { useEffect, useState, useCallback } from 'react'; // Importer useCallback
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { BuyPageFilter } from '@/components/BuyPageFilter';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyCardType } from '@/types';

// Fonction pour mapper les données de Supabase au format PropertyCardType
const mapPropertyData = (property: any): PropertyCardType & { 
  property_type_id: string; 
  city: string; 
  raw_address: string; 
  raw_price: number; 
} => {
  const statusText = 'À Vendre';
  let imageUrl = 'https://placehold.co/600x400.png';
  if (property.image_paths && Array.isArray(property.image_paths) && property.image_paths.length > 0) {
    const imagePath = property.image_paths[0];
    if (imagePath && typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) {
        imageUrl = imagePath;
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties-images/${imagePath}`;
      }
    }
  }
  let displayAddress = 'Adresse inconnue';
  if (property.address && property.city) {
    displayAddress = `${property.address}, ${property.city}`;
  } else if (property.address) {
    displayAddress = property.address;
  } else if (property.city) {
    displayAddress = property.city;
  }
  let displayPrice = 'Prix non spécifié';
  if (property.price && typeof property.price === 'number' && !isNaN(property.price) && property.price > 0) {
    const currency = property.currency || 'XOF';
    displayPrice = `${new Intl.NumberFormat('fr-FR').format(property.price)} ${currency}`;
  }
  const propertyTypeName = property.property_types?.name || 'Type inconnu';
  return {
    id: property.id,
    type: propertyTypeName,
    status: statusText,
    price: displayPrice,
    address: displayAddress,
    rooms: property.number_of_rooms || 0,
    bathrooms: property.number_of_bathrooms || 0,
    area: property.area_sqm || 0,
    image_url: imageUrl,
    isFeatured: property.is_featured || false,
    dataAiHint: property.description?.substring(0, 50) || 'property image',
    latitude: property.latitude || null,
    longitude: property.longitude || null,
    property_type_id: property.property_type_id || '',
    city: property.city || '',
    raw_address: property.address || '',
    raw_price: property.price || 0,
  };
};

export default function BuyPage() {
  const [allProperties, setAllProperties] = useState<(PropertyCardType & { 
    property_type_id: string; 
    city: string; 
    raw_address: string; 
    raw_price: number; 
  })[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<(PropertyCardType & { 
    property_type_id: string; 
    city: string; 
    raw_address: string; 
    raw_price: number; 
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  interface FilterState {
    propertyType: string;
    city: string;
    address: string;
    price: string;
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
  const supabase = createClient();
  const { data, error } = await supabase
          .from('properties')
          .select(`*, property_types(id, name)`)
          .eq('is_featured', true)
          .eq('is_for_sale', true)
          .eq('is_for_rent', false)
          .eq('status', 'available');
        if (error) throw error;
        if (data) {
          const mappedData = data.map(mapPropertyData);
          setAllProperties(mappedData);
          setFilteredProperties(mappedData);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Erreur de chargement des propriétés:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Utiliser useCallback pour mémoriser la fonction de gestion des filtres
  const handleFilterChange = useCallback((filters: FilterState) => {
    let filtered = [...allProperties];
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.property_type_id === filters.propertyType);
    }
    if (filters.city) {
      filtered = filtered.filter(property => property.city === filters.city);
    }
    if (filters.address) {
      filtered = filtered.filter(property => property.raw_address === filters.address);
    }
    if (filters.price) {
      const priceValue = parseInt(filters.price);
      filtered = filtered.filter(property => property.raw_price === priceValue);
    }
    setFilteredProperties(filtered);
  }, [allProperties]); // La fonction ne sera recréée que si `allProperties` change

  // Utiliser useCallback pour mémoriser la fonction de réinitialisation
  const handleResetFilters = useCallback(() => {
    setFilteredProperties(allProperties);
  }, [allProperties]); // La fonction ne sera recréée que si `allProperties` change

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline">
            Biens disponibles à l'achat
          </h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <BuyPageFilter 
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </div>
            <div className="lg:w-3/4">
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                      <Skeleton className="h-[225px] w-full rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="text-center text-red-500">Erreur: {error}</p>}
              {!loading && !error && (
                <>
                  <div className="mb-6">
                    <p className="text-muted-foreground">
                      {filteredProperties.length} bien{filteredProperties.length > 1 ? 's' : ''} trouvé{filteredProperties.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  {filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {filteredProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">
                        Aucun bien ne correspond à vos critères de recherche.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Essayez de modifier vos filtres pour voir plus de résultats.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
