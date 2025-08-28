// src/components/SearchFilters.tsx
'use client';

import * as React from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    Input, 
    Label, 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    Slider,
    Checkbox,
    Button
} from "@/components"; // Import depuis le fichier baril

/**
 * Définit la structure de l'objet contenant l'état de tous les filtres.
 */
export type FiltersState = {
  price: { min: number; max: number };
  rooms: string;
  bathrooms: string;
  parking: string;
  area: { min: string; max: string };
  features: {
    pool: boolean;
    garden: boolean;
  };
};

/**
 * Props pour le composant SearchFilters.
 */
interface SearchFiltersProps {
  filters: FiltersState;
  onFiltersChange: (newFilters: Partial<FiltersState>) => void;
  onResetFilters: () => void;
}

const SearchFilters = ({ filters, onFiltersChange, onResetFilters }: SearchFiltersProps) => {
  // Gestionnaires d'événements
  const handlePriceChange = (value: number[]) => {
    onFiltersChange({ price: { min: value[0], max: value[1] } });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFiltersChange({ area: { ...filters.area, [name]: value } });
  };
  
  const handleFeatureChange = (feature: keyof FiltersState['features']) => {
    onFiltersChange({
      features: { ...filters.features, [feature]: !filters.features[feature] },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtres Avancés</CardTitle>
        <Button variant="link" onClick={onResetFilters}>Réinitialiser</Button>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Filtre de Prix */}
        <div className="space-y-4">
          <Label>Fourchette de prix (FCFA)</Label>
          <Slider
            min={0}
            max={500000000}
            step={1000000}
            value={[filters.price.min, filters.price.max]}
            onValueChange={handlePriceChange}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{new Intl.NumberFormat('fr-FR').format(filters.price.min)}</span>
            <span>{new Intl.NumberFormat('fr-FR').format(filters.price.max)}</span>
          </div>
        </div>

        {/* Filtres Pièces, Salles de bain, Parking */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rooms">Pièces (minimum)</Label>
            <Select value={filters.rooms} onValueChange={(value) => onFiltersChange({ rooms: value })}>
              <SelectTrigger id="rooms"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Toutes</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Salles de bain (minimum)</Label>
            <Select value={filters.bathrooms} onValueChange={(value) => onFiltersChange({ bathrooms: value })}>
              <SelectTrigger id="bathrooms"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Toutes</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking">Parking (minimum)</Label>
            <Select value={filters.parking} onValueChange={(value) => onFiltersChange({ parking: value })}>
              <SelectTrigger id="parking"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Tous</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Filtre de Superficie */}
        <div className="space-y-2">
           <Label>Superficie (m²)</Label>
           <div className="flex items-center gap-2">
              <Input name="min" type="number" placeholder="Min" value={filters.area.min} onChange={handleAreaChange} />
              <span className="text-muted-foreground">-</span>
              <Input name="max" type="number" placeholder="Max" value={filters.area.max} onChange={handleAreaChange} />
           </div>
        </div>

        {/* Filtre de Caractéristiques */}
        <div className="space-y-2">
            <Label>Autres caractéristiques</Label>
            <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                    <Checkbox id="pool" checked={filters.features.pool} onCheckedChange={() => handleFeatureChange('pool')} />
                    <Label htmlFor="pool" className="font-normal">Piscine</Label>
                </div>
                <div className="flex items-center space-x-3">
                    <Checkbox id="garden" checked={filters.features.garden} onCheckedChange={() => handleFeatureChange('garden')} />
                    <Label htmlFor="garden" className="font-normal">Jardin</Label>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;