// src/app/location-vente/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { LeaseSalePageFilter } from '@/components/LeaseSalePageFilter'; // MODIFIÉ
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyCardType } from '@/types';

const mapPropertyData = (property: any): PropertyCardType & { 
  property_type_id: string;
  city: string; 
  raw_address: string; 
  raw_price: number; 
} => {
  const statusText = 'Location-Vente'; // MODIFIÉ
  let imageUrl = 'https://placehold.co/600x400.png';
  if (property.image_paths && Array.isArray(property.image_paths) && property.image_paths.length > 0) { // [cite: 6]
    const imagePath = property.image_paths[0];
    if (imagePath && typeof imagePath === 'string') { // [cite: 7]
      if (imagePath.startsWith('http')) { // [cite: 7]
        imageUrl = imagePath;
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties-images/${imagePath}`; // [cite: 8]
      }
    }
  }
  let displayAddress = 'Adresse inconnue';
  if (property.address && property.city) { // [cite: 10]
    displayAddress = `${property.address}, ${property.city}`;
  } else if (property.address) { // [cite: 11]
    displayAddress = property.address;
  } else if (property.city) { // [cite: 12]
    displayAddress = property.city;
  }
  let displayPrice = 'Prix non spécifié';
  if (property.price && typeof property.price === 'number' && !isNaN(property.price) && property.price > 0) { // [cite: 13]
    const currency = property.currency || 'XOF'; // [cite: 13, 14]
    displayPrice = `${new Intl.NumberFormat('fr-FR').format(property.price)} ${currency}`; // [cite: 14]
  }
  const propertyTypeName = property.property_types?.name || 'Type inconnu';
  
  return {
    id: property.id,
    type: propertyTypeName,
    status: statusText,
    price: displayPrice,
    address: displayAddress,
    rooms: property.number_of_rooms || 0, // [cite: 15, 16]
    bathrooms: property.number_of_bathrooms || 0, // [cite: 16]
    area: property.area_sqm || 0, // [cite: 16, 17]
    image_url: imageUrl,
    isFeatured: property.is_featured || false,
    dataAiHint: property.description?.substring(0, 50) || 'property image', // [cite: 17, 18]
    latitude: property.latitude || null, // [cite: 18]
    longitude: property.longitude || null, // [cite: 18, 19]
    property_type_id: property.property_type_id || '', // [cite: 19]
    city: property.city || '', // [cite: 19, 20]
    raw_address: property.address || '', // [cite: 20]
    raw_price: property.price || 0, // [cite: 20]
  };
};

export default function LeaseSalePage() { // MODIFIÉ
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
          .eq('is_for_sale', true)   // MODIFIÉ
          .eq('is_for_rent', true)    // MODIFIÉ
          .eq('status', 'available');
          
        if (error) throw error;
        if (data) {
          const mappedData = data.map(mapPropertyData);
          setAllProperties(mappedData);
          setFilteredProperties(mappedData);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Erreur de chargement des propriétés:", err); // [cite: 26]
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

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
      const priceValue = parseInt(filters.price); // [cite: 28]
      filtered = filtered.filter(property => property.raw_price === priceValue);
    }
    setFilteredProperties(filtered);
  }, [allProperties]);

  const handleResetFilters = useCallback(() => {
    setFilteredProperties(allProperties);
  }, [allProperties]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline">
            Biens disponibles en Location-Vente {/* MODIFIÉ */}
          </h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <LeaseSalePageFilter  // MODIFIÉ
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