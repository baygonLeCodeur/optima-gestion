// src/app/agent/biens/edit/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import * as z from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PropertyForm, { propertySchema } from '@/components/PropertyForm';
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { revalidatePath } from 'next/cache';
import { Tables } from '@/types/supabase';

type EditPropertyPageProps = {
  params: { id: string };
};

async function updatePropertyAction(propertyId: string, values: z.infer<typeof propertySchema> & { image_paths: string[] }) {
    'use server';
    
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentification requise pour cette action.');
    }

    // --- CORRECTION APPLIQUÉE ICI ---

    // 1. On vérifie la validité du prix, comme pour la création.
    //    C'est une sécurité supplémentaire, même si Zod le fait déjà.
    if (values.price == null || values.price <= 0) {
        throw new Error("Le prix est requis et doit être un montant positif.");
    }

    // 2. On sépare les chemins d'images ET le prix du reste des données.
    const { image_paths, price, ...propertyData } = values;

    // 3. On construit l'objet de mise à jour.
    let dataToUpdate: Partial<Tables<'properties'>> = {
      ...propertyData,
      // En ré-assignant `price` après la vérification, on garantit à TypeScript
      // que sa valeur est bien `number` et non `null`.
      price: price,
      image_paths: image_paths,
    };

    // --- FIN DE LA CORRECTION ---

    // Logique de cohérence des données avant l'écriture en BDD
    if (dataToUpdate.status === 'sold' || dataToUpdate.status === 'rented' || dataToUpdate.status === 'archived') {
        dataToUpdate.is_for_sale = false;
        dataToUpdate.is_for_rent = false;
        dataToUpdate.is_featured = false;
    } else if (dataToUpdate.status === 'under_contract') {
        dataToUpdate.is_featured = false;
    }

    const sb = supabase as unknown as SupabaseClient<Database>;
    const { error } = await sb
        .from('properties')
        .update(dataToUpdate)
        .eq('id', propertyId)
        .eq('agent_id', user.id);

    if (error) {
        console.error("Erreur de mise à jour du bien:", error);
        throw new Error("La mise à jour du bien a échoué. Raison: " + error.message);
    }

    revalidatePath(`/agent/biens/edit/${propertyId}`);
    revalidatePath('/agent/biens');
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }

    const id = (await params).id;

    const sb2 = supabase as unknown as SupabaseClient<Database>;
    const { data: property, error } = await sb2
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('agent_id', user.id)
        .single();

    if (error || !property) {
        notFound();
    }

    const handleFormSubmit = async (values: z.infer<typeof propertySchema> & { image_paths: string[] }) => {
        'use server';
    const prop = property as Tables<'properties'>;
    await updatePropertyAction(prop.id, values);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Modifier le bien : {(property as unknown as Tables<'properties'>).title}</h1>
                    <PropertyForm 
                        propertyToEdit={property} 
                        onFormSubmit={handleFormSubmit} 
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
