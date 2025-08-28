// src/types/index.ts
import { Tables } from './supabase'; // Assurez-vous que le chemin est correct

// Le type brut d'une propriété, directement depuis la DB
export type RawProperty = Tables<'properties'>;

// Le type pour une visite, qui inclut les détails de la propriété liée
export type Visit = Tables<'visits'> & {
  properties: RawProperty;
};

// Le type pour un favori, qui inclut les détails de la propriété liée
export type FavoriteProperty = Tables<'user_favorites'> & {
  properties: RawProperty;
};

// Type pour une recherche sauvegardée
export type SavedSearch = Tables<'saved_searches'>;


// Type de base pour une propriété, utilisé par exemple sur la page d'accueil
export interface Property {
    id: string;
    type: string;
    status: string;
    price: string;
  // Valeur numérique du prix (si disponible) — utile pour tri/filtrage
  numeric_price?: number | null;
    address: string;
    rooms: number;
    bathrooms: number;
    area: number;
    image_url: string;
    isFeatured: boolean;
    dataAiHint: string;
}

// Type étendu pour la page de recherche, incluant les données de géolocalisation et utilisé pour la comparaison
export interface PropertyCardType extends Property {
    latitude: number | null;
    longitude: number | null;
}

// Type pour la phrase d'accroche générée par l'IA
export type CatchPhrase = {
    catchPhrase: string;
}

// Type pour une propriété avec des statistiques aggrégées (leads, visites)
export type PropertyWithStats = Tables<'properties'> & {
  leads: [{ count: number }];
  visits: [{ count: number }];
};