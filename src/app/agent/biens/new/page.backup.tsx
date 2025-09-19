'use client';

import { useState } from 'react';
import PropertyForm from '@/components/PropertyForm';
import { createPropertyAction } from './actions';
// On importe le schéma pour en déduire le type
import { propertySchema } from '@/components/PropertyForm';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

// On définit le type des données venant du formulaire
type PropertyFormData = z.infer<typeof propertySchema> & { image_paths: string[] };

export default function NewPropertyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateProperty = async (formData: PropertyFormData) => {
    setError(null);
    setSuccessMessage(null);

    const result = await createPropertyAction(formData);

    if (!result.success) {
      setError(result.error || "Une erreur inattendue est survenue.");
    } else {
      setSuccessMessage("L'annonce a été créée avec succès ! Vous allez être redirigé...");
      // Optionnel : rediriger l'utilisateur après un court délai
      setTimeout(() => {
        router.push('/agent/biens');
      }, 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Créer une nouvelle annonce</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Succès !</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      <PropertyForm onFormSubmit={handleCreateProperty} />
    </div>
  );
}
