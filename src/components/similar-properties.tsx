"use client";

import { useEffect, useState } from 'react';
import PropertyCard from '@/components/property-card';
import { PropertyCardType } from '@/types';
// no direct supabase client required; similar properties are fetched via server API

interface SimilarPropertiesProps {
  propertyId: string;
  city: string;
  propertyTypeId: string;
  price: number;
  area: number | null;
}

const mapApiDataToPropertyCard = (property: any): PropertyCardType => {
  const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
  const imageUrl = property.image_paths?.length > 0 ? property.image_paths[0] : 'https://placehold.co/600x400.png';
  const getBedrooms = (p: any) => (p.number_of_rooms ?? p.number_of_bedrooms ?? 0) as number;
  const getBathrooms = (p: any) => (p.number_of_bathrooms ?? p.number_of_bathrooms ?? 0) as number;

  const mapped = {
    id: property.id,
    type: property.title,
    status: status,
    price: `${new Intl.NumberFormat('fr-FR').format(property.price)} ${property.currency}`,
    address: `${property.address}, ${property.city}`,
    bedrooms: getBedrooms(property),
    bathrooms: getBathrooms(property),
    area: property.area_sqm || 0,
    image_url: imageUrl,
    isFeatured: property.is_featured || false,
    dataAiHint: property.description?.substring(0, 100) || '',
    latitude: property.latitude ?? undefined,
    longitude: property.longitude ?? undefined,
  };

  return mapped as unknown as PropertyCardType;
};


export function SimilarProperties({ propertyId, city, propertyTypeId, price, area }: SimilarPropertiesProps) {
  const [properties, setProperties] = useState<PropertyCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilarProperties() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          propertyId,
          city,
          propertyTypeId,
          price: price.toString(),
        });

        if (area !== null) {
          params.append('area', area.toString());
        }

        const response = await fetch(`/api/properties/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch similar properties');
        }

        const data = await response.json();
        setProperties(data.map(mapApiDataToPropertyCard));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarProperties();
  }, [propertyId, city, propertyTypeId, price, area]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-96 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (properties.length === 0) {
    return <p className="text-gray-500 text-center">Aucun bien similaire trouvé.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
