// src/components/action-select.tsx
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionSelectProps {
  value: string;
  onChange: (value: string) => void;
  operations: string[];
  disabled?: boolean;
  isLoading?: boolean;
}

const ActionSelect: React.FC<ActionSelectProps> = ({ 
  value, 
  onChange, 
  operations, 
  disabled = false, 
  isLoading = false 
}) => {
  
  // Réinitialiser la valeur si les opérations changent
  React.useEffect(() => {
    if (value && operations.length > 0) {
      // Vérifier si la valeur actuelle existe toujours dans les nouvelles options
      const exists = operations.includes(value);
      if (!exists) {
        onChange(''); // Réinitialiser si la valeur n'existe plus
      }
    }
  }, [operations, value, onChange]);

  const getPlaceholder = () => {
    if (disabled) return 'Sélectionnez d\'abord un type de bien';
    if (isLoading) return 'Chargement...';
    if (operations.length === 0) return 'Aucune opération disponible';
    return 'Choisir une opération...';
  };

  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled || isLoading || operations.length === 0}
    >
      <SelectTrigger className="col-span-1 md:col-span-1 text-black">
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>
      <SelectContent>
        {operations.map((operation) => (
          <SelectItem key={operation} value={operation}>
            {operation}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ActionSelect;
