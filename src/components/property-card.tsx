// src/components/property-card.tsx
'use client';

import { Heart, Home, Bath, Maximize, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyCardType } from '@/types';
import { CatchPhrase } from './catch-phrase';

interface PropertyCardProps {
  property: PropertyCardType;
  onToggleCompare?: (property: PropertyCardType) => void;
  isSelected?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onToggleCompare, isSelected }) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    const checkFavorite = async () => {
      if (!user) return setIsFavorite(false);
      try {
        const { data } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', user.id)
          .eq('property_id', property.id)
          .single();
        if (mounted) setIsFavorite(!!data);
      } catch (e) {
        // ignore
      }
    };
    checkFavorite();
    return () => { mounted = false; };
  }, [user, property.id]);

  const toggleFavorite = async () => {
    if (!user) {
      // redirect to login or show toast - keep simple here
      window.location.href = '/login';
      return;
    }
    try {
      if (isFavorite) {
        const res = await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: property.id }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to remove favorite');
        setIsFavorite(false);
        toast({ title: 'Favori supprimé', description: 'Le bien a été retiré de vos favoris.' });
      } else {
        const res = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: property.id }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to add favorite');
        setIsFavorite(true);
        toast({ title: 'Favori ajouté', description: 'Le bien a été ajouté à vos favoris.' });
      }
      // Notify other components to refetch favorites
      window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { propertyId: property.id } }));
    } catch (err) {
      console.error('Favorite toggle error', err);
    }
  };
  return (
    <Card className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-0">
        <div className="relative">
          <Link href={`/biens/${property.id}`}>
            <Image src={property.image_url} alt={`Photo de ${property.type}`} width={600} height={400} className="object-cover w-full h-48" />
          </Link>
          {/* Correction: Utiliser property.status directement qui est déjà formaté par mapPropertyData */}
          <div className={`absolute top-2 left-2 px-3 py-1 text-sm font-semibold text-white rounded-full ${property.status === 'À Vendre' ? 'bg-green-600' : property.status === 'À Louer' ? 'bg-blue-600' : 'bg-purple-600'}`}>{property.status}</div>
          {onToggleCompare && (
            <Button size="icon" className="absolute top-2 right-10 bg-white/80 hover:bg-white text-primary rounded-full" variant="ghost" onClick={() => onToggleCompare(property)}>
              {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </Button>
          )}
          <Button size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white text-destructive rounded-full" variant="ghost" onClick={toggleFavorite} aria-pressed={isFavorite}>
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-600' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {/* Correction: Utiliser property.address directement qui est déjà formaté par mapPropertyData */}
        <h3 className="text-lg font-bold truncate"><Link href={`/biens/${property.id}`} className="hover:text-primary">{property.type} à {property.address}</Link></h3>
        <p className="text-2xl font-bold text-primary my-2">{property.price}</p>
        <CatchPhrase description={property.dataAiHint} />
        <div className="flex justify-around text-sm text-muted-foreground border-t border-b py-2 my-2 mt-auto">
          <div className="flex items-center"><Home className="w-4 h-4 mr-1" /><span>{property.rooms}</span></div>
          <div className="flex items-center"><Bath className="w-4 h-4 mr-1" /><span>{property.bathrooms}</span></div>
          <div className="flex items-center"><Maximize className="w-4 h-4 mr-1" /><span>{property.area} m²</span></div>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <Link href={`/biens/${property.id}`} className="w-full"><Button className="w-full">Voir les détails</Button></Link>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
