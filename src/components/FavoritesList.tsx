// src/components/FavoritesList.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import PropertyCard from './property-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types from generated supabase types are used where possible; when PostgREST typings block us,
// we cast locally to `any` to keep runtime behavior while unblocking compilation.
import { Tables, Database } from '@/types/supabase';
import type { FavoriteJoin, PropertyWithType } from '@/types/custom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBedrooms as utilGetBedrooms, getBathrooms as utilGetBathrooms, normalizeLatLng } from '@/lib/property-utils';

type RawProperty = Tables<'properties'>;
// use FavoriteJoin from types/custom

type PropertyCardType = {
    id: string;
    type: string;
    status: string;
    price: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    image_url: string;
    isFeatured: boolean;
    dataAiHint: string;
    latitude?: number;
    longitude?: number;
};

const mapPropertyData = (property: RawProperty | PropertyWithType): PropertyCardType => {
    const status = property.is_for_sale ? 'À Vendre' : 'À Louer';
    const imageUrl = (property.image_paths && property.image_paths.length > 0) ? property.image_paths[0] : 'https://placehold.co/600x400.png';

    return {
        id: property.id,
        type: property.title,
        status,
        price: `${new Intl.NumberFormat('fr-FR').format(property.price)} ${property.currency}`,
        address: `${property.address}, ${property.city}`,
    bedrooms: utilGetBedrooms(property as unknown as Tables<'properties'>),
    bathrooms: utilGetBathrooms(property as unknown as Tables<'properties'>),
        area: property.area_sqm || 0,
        image_url: imageUrl,
        isFeatured: property.is_featured || false,
        dataAiHint: (property.description as string | undefined)?.substring(0, 50) || 'property image',
    ...normalizeLatLng(property as unknown as Tables<'properties'>),
    };
};

export const FavoritesList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            const sb = supabase as unknown as SupabaseClient<Database>;
            const { data, error } = await sb
                .from('user_favorites')
                .select(`user_id, property_id, properties (*)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const validData = (data as FavoriteJoin[]) || [];
            const mappedFavorites = validData
                .map(fav => fav.properties)
                .filter((p): p is PropertyWithType => p !== null)
                .map(mapPropertyData);

            setFavorites(mappedFavorites);
        } catch (err: any) {
            toast({ title: 'Erreur', description: 'Impossible de charger vos favoris.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

    const handleRemoveFavorite = async (propertyId: string) => {
        if (!user) return;
        try {
            const supabase = createClient();
            const sb = supabase as unknown as SupabaseClient<Database>;
            const { error } = await sb.from('user_favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
            if (error) throw error;
            toast({ title: 'Favori supprimé', description: 'Le bien a été retiré de vos favoris.' });
            fetchFavorites();
        } catch (err) {
            toast({ title: 'Erreur', description: 'Impossible de supprimer le favori.', variant: 'destructive' });
        }
    };

    if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}</div>;

    if (favorites.length === 0) return (
        <Alert>
            <Heart className="h-4 w-4" />
            <AlertTitle>Aucun favori</AlertTitle>
            <AlertDescription>Vous n'avez pas encore ajouté de bien à vos favoris.</AlertDescription>
        </Alert>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property: any) => (
                <div key={property.id} className="relative group">
                    <PropertyCard property={property} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>Cette action est irréversible et supprimera définitivement ce bien de vos favoris.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveFavorite(property.id)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            ))}
        </div>
    );
};
