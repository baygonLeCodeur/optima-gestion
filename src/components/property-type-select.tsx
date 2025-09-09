"use client";

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Liste de référence des types de biens "supportés" issue de pageWeb2.html
const supportedPropertyTypeNames = [
  'Appartement 2 pièces',
  'Appartement 3 pièces',
  'Appartement 4 pièces',
  'Appartement 5 pièces et plus',
  'Maison',
  'Villa',
  'Studio',
  'Résidence',
  'Duplex',
  'Triplex',
  'Villa basse',
  'Villa Duplex',
  'Maison de ville',
  'Chambre',
  'Local commercial',
  'Penthouse',
  'Bureau',
  'Magasin',
  'Boutique',
  'Fonds de commerce',
  'Entrepôt',
  'Terrain nu',
  'Terrain agricole',
  // On ajoute aussi les noms génériques de la DB pour qu'ils soient actifs
  'Appartement',
  'Terrain'
];

// Helper pour normaliser les noms pour la comparaison
const normalize = (name: string) => name.toLowerCase().trim();

const isTypeSupported = (name: string) => {
    const normalizedName = normalize(name);
    // Cas spécial pour les appartements génériques
    if (normalizedName.startsWith('appartement') && supportedPropertyTypeNames.some(s => normalize(s).startsWith('appartement'))) {
        return true;
    }
    return supportedPropertyTypeNames.some(supported => normalize(supported) === normalizedName);
};


interface PropertyType {
  id: string;
  name: string;
}

interface PropertyTypeSelectProps {
  onValueChange: (value: string) => void;
  value?: string;
  disabled?: boolean;
  propertyTypes: PropertyType[];
  isLoading?: boolean;
}

export function PropertyTypeSelect({
  onValueChange,
  value,
  disabled = false,
  propertyTypes,
  isLoading = false
}: PropertyTypeSelectProps) {

  const safePropertyTypes = propertyTypes || [];

  const processedPropertyTypes = React.useMemo(() => {
    return safePropertyTypes.map(type => ({
      ...type,
      isSupported: isTypeSupported(type.name)
    }));
  }, [safePropertyTypes]);

  React.useEffect(() => {
    if (value && processedPropertyTypes.length > 0) {
      const currentSelection = processedPropertyTypes.find(type => type.id === value);
      if (currentSelection && !currentSelection.isSupported) {
        // Si la valeur sélectionnée n'est pas supportée, on ne la réinitialise pas forcément
        // pour permettre l'affichage des biens existants, mais on empêche la sélection.
      }
    }
  }, [processedPropertyTypes, value]);

  const getPlaceholder = () => {
    if (disabled) return 'Sélectionnez d\'abord une localisation';
    if (isLoading) return 'Chargement...';
    if (safePropertyTypes.length === 0) return 'Aucun type disponible';
    return 'Choisir un type de bien...';
  };

  return (
    <Select 
      onValueChange={(newValue) => {
        const selectedType = processedPropertyTypes.find(t => t.id === newValue);
        // On autorise le changement de valeur uniquement si le type est supporté
        if (selectedType && selectedType.isSupported) {
          onValueChange(newValue);
        }
      }} 
      value={value || ''} 
      disabled={disabled || isLoading || safePropertyTypes.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>
      <SelectContent>
        {processedPropertyTypes.map((type) => (
          <SelectItem key={type.id} value={type.id} disabled={!type.isSupported}>
            {type.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
