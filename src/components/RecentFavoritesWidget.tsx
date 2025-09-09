// src/components/RecentFavoritesWidget.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PropertyCard from './property-card';
import { PropertyCardType, FavoriteProperty, RawProperty } from '@/types';
import type { PropertyWithType } from '@/types/custom';
import { getBedrooms as utilGetBedrooms, getBathrooms as utilGetBathrooms, normalizeLatLng } from '@/lib/property-utils';

const mapPropertyData = (property: RawProperty | null): PropertyCardType | null => {
    // Vérification de nullité pour éviter l'erreur
    if (!property) {
        console.warn('Property is null in RecentFavoritesWidget, skipping mapping');
        return null;
    }
    
    const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
    const imageUrl = (property.image_paths && property.image_paths.length > 0) ? property.image_paths[0] : 'https://placehold.co/600x400.png';
  const getBedrooms = (p: RawProperty | PropertyWithType) => utilGetBedrooms(p as unknown as RawProperty);
  const getBathrooms = (p: RawProperty | PropertyWithType) => utilGetBathrooms(p as unknown as RawProperty);

    return {
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
      dataAiHint: property.description?.substring(0, 50) || 'property image',
  ...normalizeLatLng(property as unknown as RawProperty),
  } as unknown as PropertyCardType;
};

interface RecentFavoritesWidgetProps {
  favorites: FavoriteProperty[];
  isLoading: boolean;
  onSeeAll: () => void;
}

export const RecentFavoritesWidget = ({ favorites, isLoading, onSeeAll }: RecentFavoritesWidgetProps) => {
    
  const recentFavorites = favorites
    .sort((a, b) => {
        // CORRECTION : Gérer les dates potentiellement nulles
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Tri descendant
    })
    .slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernier Favori Ajouté</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Chargement...</p>
        ) : recentFavorites.length > 0 ? (
          <div className="space-y-4">
            {recentFavorites
              .map((fav) => mapPropertyData(fav.properties as unknown as PropertyWithType))
              .filter((property): property is PropertyCardType => property !== null)
              .map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            }
            <Button variant="link" className="p-0 mt-4" onClick={onSeeAll}>
                Voir tous les favoris
            </Button>
          </div>
        ) : (
          <p>Vous n'avez pas encore de favoris.</p>
        )}
      </CardContent>
    </Card>
  );
};
