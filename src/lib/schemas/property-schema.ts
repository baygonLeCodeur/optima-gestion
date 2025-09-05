// src/lib/schemas/property-schema.ts
import * as z from 'zod';

// Ce schéma représente les données telles qu'elles sont dans la base de données
// et utilisées par les actions serveur.
export const propertyActionSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères.").optional(),
  price: z.coerce.number().positive("Le prix doit être un nombre positif."),
  area_sqm: z.coerce.number().positive("La surface doit être un nombre positif."),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères."),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères."),
  zip_code: z.string().optional(), // Le code postal est optionnel
  property_type_id: z.string().uuid("Veuillez sélectionner un type de bien."),
  status: z.enum(['available', 'rented', 'sold', 'under_contract', 'archived']),
  is_for_sale: z.boolean(),
  is_for_rent: z.boolean(),
  number_of_rooms: z.coerce.number().int().min(0),
  number_of_bathrooms: z.coerce.number().int().min(0),
  year_built: z.coerce.number().int().min(1800).max(new Date().getFullYear()),
  energy_rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  // On ajoute image_paths pour le formulaire
  image_paths: z.array(z.string()).optional(),
});

export type PropertyActionValues = z.infer<typeof propertyActionSchema>;
