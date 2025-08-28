// src/app/agent/biens/new/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client'; 
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import PropertyForm, { propertySchema } from '@/components/PropertyForm';
import Header from '@/components/header';
import Footer from '@/components/footer';
import * as z from 'zod';

type FormValues = z.infer<typeof propertySchema> & { image_paths: string[] };

export default function NewPropertyPage() {
  const { user } = useAuth();

  const handleFormSubmit = async (values: FormValues) => {
    if (!user) {
      throw new Error("Vous devez être connecté pour créer un bien.");
    }

    // --- CORRECTION APPLIQUÉE ICI ---

    // 1. On vérifie la présence et la validité du prix.
    //    Votre logique de validation Zod `superRefine` devrait déjà couvrir ce cas,
    //    mais cette double vérification est une sécurité supplémentaire.
    if (values.price == null || values.price <= 0) {
      throw new Error("Le prix est requis et doit être un montant positif.");
    }

    // 2. On sépare les chemins d'images et le prix du reste des données.
    //    Cela nous permet de traiter `price` séparément pour satisfaire TypeScript.
    const { image_paths, price, ...propertyData } = values;

    // 3. On construit l'objet final à insérer.
    const dataToInsert = {
      ...propertyData,
      // En assignant `price` de cette manière après la vérification,
      // nous garantissons à TypeScript que la valeur est bien un `number`.
      price: price, 
      agent_id: user.id,
      image_paths: image_paths,
      is_featured: true,
    };

    // --- FIN DE LA CORRECTION ---

    // L'objet `dataToInsert` a maintenant un type qui correspond parfaitement
    // à ce que la fonction `insert()` attend.
  const supabase = createClient(); 
  const sb = supabase as unknown as SupabaseClient<Database>;
  const { error } = await sb.from('properties').insert(dataToInsert);

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Ajouter un nouveau bien</h1>
            <PropertyForm onFormSubmit={handleFormSubmit} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
