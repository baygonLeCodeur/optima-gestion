"use client";

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Sécurité : s'assurer que propertyTypes est toujours un tableau
  const safePropertyTypes = propertyTypes || [];
  
  // Réinitialiser la valeur si les types de biens changent
  React.useEffect(() => {
    if (value && safePropertyTypes.length > 0) {
      // Vérifier si la valeur actuelle existe toujours dans les nouvelles options
      const exists = safePropertyTypes.some(type => type.id === value);
      if (!exists) {
        onValueChange(''); // Réinitialiser si la valeur n'existe plus
      }
    }
  }, [safePropertyTypes, value, onValueChange]);

  const getPlaceholder = () => {
    if (disabled) return 'Sélectionnez d\'abord une localisation';
    if (isLoading) return 'Chargement...';
    if (safePropertyTypes.length === 0) return 'Aucun type disponible';
    return 'Choisir un type de bien...';
  };

  return (
    <Select 
      onValueChange={onValueChange} 
      value={value || ''} 
      disabled={disabled || isLoading || safePropertyTypes.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>
      <SelectContent>
        {safePropertyTypes.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
