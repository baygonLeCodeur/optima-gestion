'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@/lib/supabase/client';
import { PropertyCardType as GlobalPropertyCardType } from '@/types';

// Type pour une carte de propriété
type PropertyCardType = {
  id: string;
  type: string;
  status: 'À Vendre' | 'À Louer';
  price: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
  isFeatured: boolean;
  dataAiHint: string;
};

// Fonction pour mapper les données de Supabase
const mapPropertyData = (property: any): PropertyCardType => {
  const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
  const imageUrl = property.image_paths?.length > 0 ? property.image_paths[0] : 'https://placehold.co/600x400.png';
  return {
    id: property.id,
    type: property.title,
    status: status,
    price: `${new Intl.NumberFormat('fr-FR').format(property.price)} ${property.currency}`,
    address: `${property.address}, ${property.city}`,
    bedrooms: property.number_of_bedrooms || 0,
    bathrooms: property.number_of_bathrooms || 0,
    area: property.area_sqm || 0,
    imageUrl: imageUrl,
    isFeatured: property.is_featured || false,
    dataAiHint: property.description?.substring(0, 50) || 'property image',
  };
};

// Composant pour afficher la grille de chargement
const LoadingSkeleton = () => (
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
);

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<PropertyCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // 'all', 'sale', 'rent'

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
  const supabase = createClient();
  let query = supabase
          .from('properties')
          .select('*')
          .eq('status', 'available');

        if (filter === 'sale') {
          query = query.eq('is_for_sale', true);
        } else if (filter === 'rent') {
          query = query.eq('is_for_rent', true);
        }
        // Pas de filtre supplémentaire pour 'all'

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setProperties(data.map(mapPropertyData));
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Erreur de chargement des propriétés:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              Découvrez tous nos biens
            </h1>
            <p className="text-muted-foreground mt-2">
              Parcourez notre catalogue complet de propriétés à vendre et à louer.
            </p>
          </div>

          <Tabs defaultValue="all" onValueChange={setFilter} className="w-full max-w-md mx-auto mb-12">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Tous les biens</TabsTrigger>
              <TabsTrigger value="sale">Acheter</TabsTrigger>
              <TabsTrigger value="rent">Louer</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading && <LoadingSkeleton />}
          
          {error && <p className="text-center text-red-500">Erreur: {error}</p>}

          {!loading && !error && properties.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property as unknown as GlobalPropertyCardType} />
              ))}
            </div>
          )}

          {!loading && !error && properties.length === 0 && (
            <p className="text-center text-muted-foreground mt-8">
              Aucun bien disponible ne correspond à ce filtre pour le moment.
            </p>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
