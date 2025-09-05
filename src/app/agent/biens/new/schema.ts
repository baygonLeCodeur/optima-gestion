import * as z from 'zod';

export const formSchema = z.object({
  title: z.string().min(2, {
    message: "Le titre doit contenir au moins 2 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  price: z.coerce.number().positive({
    message: "Le prix doit être un nombre positif.",
  }),
  surface: z.coerce.number().positive({
    message: "La surface doit être un nombre positif.",
  }),
  address: z.string().min(5, {
    message: "L'adresse doit contenir au moins 5 caractères.",
  }),
  city: z.string().min(2, {
    message: "La ville doit contenir au moins 2 caractères.",
  }),
  postal_code: z.string().regex(/^\d{5}$/, {
    message: "Le code postal doit contenir 5 chiffres.",
  }),
  property_type: z.string().uuid({
    message: "Veuillez sélectionner un type de bien.",
  }),
  status: z.enum(['available', 'sold', 'rented']),
  transaction_type: z.enum(['sale', 'rent']),
  bedrooms: z.coerce.number().int().min(0, {
    message: "Le nombre de chambres ne peut être négatif.",
  }),
  bathrooms: z.coerce.number().int().min(0, {
    message: "Le nombre de salles de bain ne peut être négatif.",
  }),
  construction_year: z.coerce.number().int().min(1800).max(new Date().getFullYear(), {
    message: `L'année de construction doit être entre 1800 et ${new Date().getFullYear()}.`,
  }),
  energy_rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
});

export type FormValues = z.infer<typeof formSchema>;
