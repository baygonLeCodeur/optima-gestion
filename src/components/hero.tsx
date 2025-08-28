// src/components/hero.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LocationInput from "@/components/location-input";
import { PropertyTypeSelect } from "@/components/property-type-select";
import ActionSelect from "@/components/action-select";

interface PropertyType {
  id: string;
  name: string;
}

export function Hero() {
  const router = useRouter();

  // États principaux du formulaire
  const [location, setLocation] = React.useState<string>("");
  const [propertyType, setPropertyType] = React.useState<string>("");
  const [operation, setOperation] = React.useState<string>("");

  // États pour les options dynamiques
  const [propertyTypes, setPropertyTypes] = React.useState<PropertyType[]>([]);
  const [operations, setOperations] = React.useState<string[]>([]);
  
  // États de chargement
  const [isTypesLoading, setIsTypesLoading] = React.useState(false);
  const [isOperationsLoading, setIsOperationsLoading] = React.useState(false);

  // Effet pour récupérer les types de biens quand la localisation change
  React.useEffect(() => {
    if (!location) {
      // Réinitialiser tout si pas de localisation
      setPropertyTypes([]);
      setOperations([]);
      setPropertyType("");
      setOperation("");
      return;
    }

    const fetchPropertyTypes = async () => {
      setIsTypesLoading(true);
      setPropertyType(""); // Réinitialiser la sélection
      setOperations([]); // Réinitialiser les opérations
      setOperation(""); // Réinitialiser l'opération sélectionnée
      
      try {
        const response = await fetch(`/api/properties/search?location=${encodeURIComponent(location)}`);
        if (!response.ok) throw new Error("Failed to fetch property types");
        const data = await response.json();
        setPropertyTypes(data);
      } catch (error) {
        console.error("Error fetching property types:", error);
        setPropertyTypes([]);
      } finally {
        setIsTypesLoading(false);
      }
    };

    fetchPropertyTypes();
  }, [location]);

  // Effet pour récupérer les opérations quand le type de bien change
  React.useEffect(() => {
    if (!location || !propertyType) {
      // Réinitialiser les opérations si pas de localisation ou de type
      setOperations([]);
      setOperation("");
      return;
    }

    const fetchOperations = async () => {
      setIsOperationsLoading(true);
      setOperation(""); // Réinitialiser la sélection
      
      try {
        const response = await fetch(
          `/api/properties/search?location=${encodeURIComponent(location)}&type=${encodeURIComponent(propertyType)}`
        );
        if (!response.ok) throw new Error("Failed to fetch operations");
        const data = await response.json();
        setOperations(data);
      } catch (error) {
        console.error("Error fetching operations:", error);
        setOperations([]);
      } finally {
        setIsOperationsLoading(false);
      }
    };

    fetchOperations();
  }, [location, propertyType]);
  
  // Gestionnaire pour la sélection de localisation
  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    // Les autres champs seront réinitialisés par les useEffect
  };

  // Gestionnaire pour la sélection du type de bien
  const handlePropertyTypeChange = (selectedType: string) => {
    setPropertyType(selectedType);
    // L'opération sera réinitialisée par l'useEffect
  };

  // Gestionnaire pour la sélection de l'opération
  const handleOperationChange = (selectedOperation: string) => {
    setOperation(selectedOperation);
  };
  
  // Gestionnaire pour la soumission du formulaire
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !propertyType || !operation) {
      console.log("Tous les champs doivent être remplis");
      return;
    }

    try {
      // Récupérer les biens correspondant aux critères
      const response = await fetch(
        `/api/properties/search?location=${encodeURIComponent(location)}&type=${encodeURIComponent(propertyType)}&operation=${encodeURIComponent(operation)}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch search results");
      
      const searchResults = await response.json(); 
      
      // --- DÉBOGAGE : Ajout d'un console.log pour inspecter searchResults ---
      console.log("Contenu de searchResults avant stringify:", searchResults);
      // -------------------------------------------------------------------

      // Trouver le nom du type de bien sélectionné
      const selectedPropertyType = propertyTypes.find(type => type.id === propertyType);
      const propertyTypeName = selectedPropertyType ? selectedPropertyType.name : propertyType;
      
      // Rediriger vers la page de recherche avec les résultats et le nom du type
      const query = new URLSearchParams({
        location: location,
        type: propertyType, // ID du type
        typeName: propertyTypeName, // NOUVEAU: Nom du type pour l'affichage
        operation: operation,
        results: JSON.stringify(searchResults) // <-- Assurez-vous que searchResults est bien le tableau des propriétés
      });
      
      router.push(`/recherche?${query.toString()}`);
      
    } catch (error) {
      console.error("Error performing search:", error);
    }
  };

  // Déterminer si le bouton de recherche doit être activé
  const isSearchEnabled = location && propertyType && operation && !isTypesLoading && !isOperationsLoading;

  return (
    <section>
      <div className="relative h-[600px] w-full flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/devant-og.jpg"
          alt="Arrière-plan d'un appartement de luxe"
          fill
          className="object-cover object-[center_36%]"
          priority
        />
        <div className="absolute inset-0 bg-black opacity-20"></div>

        <div className="relative z-10 w-full max-w-6xl text-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            Trouvez le bien de vos rêves
          </h1>
          <p className="mt-4 text-lg md:text-xl">
            Votre partenaire de confiance pour l'achat, la vente et la location de biens immobiliers.
          </p>
          <div className="mt-8 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/20 backdrop-blur-sm p-6 rounded-lg"
            >
              {/* Champ de localisation - toujours actif */}
              <LocationInput 
                value={location} 
                onLocationSelect={handleLocationSelect} 
              />
              
              {/* Sélecteur de type de bien - activé seulement si localisation sélectionnée */}
              <PropertyTypeSelect 
                value={propertyType}
                onValueChange={handlePropertyTypeChange}
                disabled={!location}
                propertyTypes={propertyTypes}
                isLoading={isTypesLoading}
              />

              {/* Sélecteur d'opération - activé seulement si type de bien sélectionné */}
              <ActionSelect
                value={operation}
                onChange={handleOperationChange}
                operations={operations}
                disabled={!propertyType}
                isLoading={isOperationsLoading}
              />

              {/* Bouton de recherche - activé seulement si tous les champs sont remplis */}
              <Button 
                type="submit" 
                className="col-span-1 md:col-span-1" 
                disabled={!isSearchEnabled}
              >
                {isTypesLoading || isOperationsLoading ? 'Chargement...' : 'Rechercher'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
