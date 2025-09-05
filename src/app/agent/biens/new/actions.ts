// src/app/agent/biens/new/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { propertySchema } from '@/components/PropertyForm';
import * as z from 'zod';
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type ActionValues = z.infer<typeof propertySchema> & { image_paths: string[] };

export async function createPropertyAction(values: ActionValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const typedSupabase = supabase as unknown as SupabaseClient<Database>;

  // --- LA CORRECTION EST ICI ---
  // On valide les données, mais surtout, on s'assure que les champs obligatoires ne sont pas null.
  
  if (values.price == null || values.price <= 0) {
    throw new Error("Le prix est obligatoire et doit être positif.");
  }
  if (values.area_sqm == null || values.area_sqm <= 0) {
    throw new Error("La superficie est obligatoire et doit être positive.");
  }
  // Ajoutez d'autres vérifications si nécessaire pour les champs obligatoires

  // On crée un objet propre pour l'insertion, en s'assurant que les types correspondent.
  const propertyDataForDb = {
    title: values.title,
    description: values.description,
    price: values.price, // Maintenant, on est sûr que ce n'est pas null
    area_sqm: values.area_sqm, // Idem
    address: values.address,
    city: values.city,
    country: values.country,
    property_type_id: values.property_type_id,
    status: values.status,
    is_for_sale: values.is_for_sale,
    is_for_rent: values.is_for_rent,
    is_featured: values.is_featured,
    // Pour les champs qui peuvent être null dans la BDD, on utilise l'opérateur '??'
    // pour fournir une valeur par défaut si c'est undefined/null.
    number_of_rooms: values.number_of_rooms ?? 0,
    number_of_bathrooms: values.number_of_bathrooms ?? 0,
    year_built: values.year_built, // Peut être null dans la BDD
    security_deposit: values.security_deposit, // Peut être null
    advance_rent: values.advance_rent, // Peut être null
    virtual_tour_config: values.virtual_tour_config,
    image_paths: values.image_paths,
    agent_id: user.id,
  };

  const { data, error } = await typedSupabase
    .from('properties')
    .insert([propertyDataForDb]) // On insère l'objet nettoyé
    .select();

  if (error) {
    console.error('Error creating property:', error);
    throw error;
  }

  return data;
}
