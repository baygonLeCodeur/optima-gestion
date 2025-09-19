// src/app/agent/biens/new/page-fixed.tsx
'use client';

import PropertyFormFixed from '@/components/PropertyForm';
import { createPropertyActionFixed } from './actions';
import { propertySchema } from '@/components/PropertyForm';
import * as z from 'zod';

// Type des données venant du formulaire
type PropertyFormData = z.infer<typeof propertySchema> & { image_paths: string[] };

export default function NewPropertyPageFixed() {
  const handleCreateProperty = async (formData: PropertyFormData) => {
    try {
      // 🔧 CORRECTION: Utilisation de l'action corrigée avec vérification préalable du solde
      await createPropertyActionFixed(formData);
    } catch (error) {
      console.error('Failed to create property via server action', error);
      // 🔧 CORRECTION: Re-lancer l'erreur pour qu'elle soit gérée par le PropertyForm
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Créer une nouvelle annonce</h1>
      <PropertyFormFixed onFormSubmit={handleCreateProperty} />
    </div>
  );
}
