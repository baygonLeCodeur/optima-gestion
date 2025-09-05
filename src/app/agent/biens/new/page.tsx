'use client';

import PropertyForm from '@/components/PropertyForm';
import { createPropertyAction } from './actions';
// On importe le schéma pour en déduire le type
import { propertySchema } from '@/components/PropertyForm';
import * as z from 'zod';

// On définit le type des données venant du formulaire
type PropertyFormData = z.infer<typeof propertySchema> & { image_paths: string[] };

export default function NewPropertyPage() {
  const handleCreateProperty = async (formData: PropertyFormData) => {
    try {
      // On passe les données directement, car l'action s'attend maintenant à ce format
      await createPropertyAction(formData);
    } catch (error) {
      console.error('Failed to create property via server action', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Créer une nouvelle annonce</h1>
      <PropertyForm onFormSubmit={handleCreateProperty} />
    </div>
  );
}
