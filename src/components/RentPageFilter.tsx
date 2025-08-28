// src/components/RentPageFilter.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Filter, X } from 'lucide-react';

// Interfaces
interface FilterState {
  propertyType: string;
  city: string;
  address: string;
  price: string;
}

interface RentPageFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

interface PropertyType {
  id: string;
  name: string;
}

interface FilterOption {
  value: string;
  label: string;
}

export function RentPageFilter({ onFilterChange, onReset }: RentPageFilterProps) {
  // --- STATE MANAGEMENT ---

  // State for selected filter values
  const [filters, setFilters] = useState<FilterState>({
    propertyType: '',
    city: '',
    address: '',
    price: ''
  });
  // State for raw data fetched from Supabase
  const [propertyTypesData, setPropertyTypesData] = useState<any[] | null>(null);
  const [citiesData, setCitiesData] = useState<any[] | null>(null);
  const [addressesData, setAddressesData] = useState<any[] | null>(null);
  const [pricesData, setPricesData] = useState<any[] | null>(null);

  // State for loading indicators
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // --- DATA FETCHING ---

  const fetchPropertyTypes = async () => {
    setIsLoadingTypes(true);
    try {
  const supabase = createClient();
  const { data, error } = await supabase
        .from('properties')
        .select('property_types(id, name)')
        .eq('is_featured', true)
        .eq('is_for_sale', false) // MODIFIÉ
        .eq('is_for_rent', true)   // MODIFIÉ
        .eq('status', 'available')
        .not('property_types', 'is', null);

      if (error) throw error;
      setPropertyTypesData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de biens:', error);
      setPropertyTypesData([]);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const fetchCities = async (propertyTypeId: string) => {
    setIsLoadingCities(true);
    try {
  const supabase = createClient();
  const { data, error } = await supabase
        .from('properties')
        .select('city')
        .eq('property_type_id', propertyTypeId)
        .eq('is_featured', true)
        .eq('is_for_sale', false) // MODIFIÉ
        .eq('is_for_rent', true)   // MODIFIÉ
        .eq('status', 'available')
        .not('city', 'is', null);

      if (error) throw error;
      setCitiesData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
      setCitiesData([]);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const fetchAddresses = async (propertyTypeId: string, city: string) => {
    setIsLoadingAddresses(true);
    try {
  const supabase = createClient();
  const { data, error } = await supabase
        .from('properties')
        .select('address')
        .eq('property_type_id', propertyTypeId)
        .eq('city', city)
        .eq('is_featured', true)
        .eq('is_for_sale', false) // MODIFIÉ
        .eq('is_for_rent', true)   // MODIFIÉ
        .eq('status', 'available')
        .not('address', 'is', null);

      if (error) throw error;
      setAddressesData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
      setAddressesData([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchPrices = async (propertyTypeId: string, city: string, address: string) => {
    setIsLoadingPrices(true);
    try {
  const supabase = createClient();
  const { data, error } = await supabase
        .from('properties')
        .select('price, currency')
        .eq('property_type_id', propertyTypeId)
        .eq('city', city)
        .eq('address', address)
        .eq('is_featured', true)
        .eq('is_for_sale', false) // MODIFIÉ
        .eq('is_for_rent', true)   // MODIFIÉ
        .eq('status', 'available')
        .not('price', 'is', null);

      if (error) throw error;
      setPricesData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prix:', error);
      setPricesData([]);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // --- SIDE EFFECTS (useEffect) ---

  // Initial fetch for property types
  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  // Fetch cities when property type changes
  useEffect(() => {
    if (filters.propertyType) {
      fetchCities(filters.propertyType);
    }
  }, [filters.propertyType]);

  // Fetch addresses when city changes
  useEffect(() => {
    if (filters.propertyType && filters.city) {
      fetchAddresses(filters.propertyType, filters.city);
    }
  }, [filters.propertyType, filters.city]);

  // Fetch prices when address changes
  useEffect(() => {
    if (filters.propertyType && filters.city && filters.address) {
      fetchPrices(filters.propertyType, filters.city, filters.address);
    }
  }, [filters.propertyType, filters.city, filters.address]);

  // Notify parent component of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // --- MEMOIZED OPTIONS ---

  const propertyTypes: PropertyType[] = useMemo(() => {
    if (!propertyTypesData) return [];
    const uniqueTypes = new Map<string, PropertyType>();
    propertyTypesData.forEach(item => {
      if (item.property_types) {
        const type = item.property_types as PropertyType;
        uniqueTypes.set(type.id, type);
      }
    });
    return Array.from(uniqueTypes.values());
  }, [propertyTypesData]);

  const cities: FilterOption[] = useMemo(() => {
    if (!citiesData) return [];
    const uniqueCities = new Set<string>();
    citiesData.forEach(item => item.city && uniqueCities.add(item.city));
    return Array.from(uniqueCities).map(city => ({ value: city, label: city }));
  }, [citiesData]);

  const addresses: FilterOption[] = useMemo(() => {
    if (!addressesData) return [];
    const uniqueAddresses = new Set<string>();
    addressesData.forEach(item => item.address && uniqueAddresses.add(item.address));
    return Array.from(uniqueAddresses).map(address => ({ value: address, label: address }));
  }, [addressesData]);

  const prices: FilterOption[] = useMemo(() => {
    if (!pricesData) return [];
    const uniquePrices = new Set<string>();
    pricesData.forEach(item => {
      if (item.price) {
        const currency = item.currency || 'XOF';
        const formattedPrice = `${new Intl.NumberFormat('fr-FR').format(item.price)} ${currency}`;
        uniquePrices.add(`${item.price}|${formattedPrice}`);
      }
    });
    const priceOptions = Array.from(uniquePrices).map(priceData => {
      const [value, label] = priceData.split('|');
      return { value, label };
    });
    return priceOptions.sort((a, b) => parseInt(a.value) - parseInt(b.value));
  }, [pricesData]);

  // --- EVENT HANDLERS ---

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };

      if (filterType === 'propertyType') {
        newFilters.city = '';
        newFilters.address = '';
        newFilters.price = '';
        setCitiesData(null);
        setAddressesData(null);
        setPricesData(null);
      } else if (filterType === 'city') {
        newFilters.address = '';
        newFilters.price = '';
        setAddressesData(null);
        setPricesData(null);
      } else if (filterType === 'address') {
        newFilters.price = '';
        setPricesData(null);
      }
      return newFilters;
    });
  };

  const handleReset = () => {
    setFilters({ propertyType: '', city: '', address: '', price: '' });
    setPropertyTypesData(null);
    setCitiesData(null);
    setAddressesData(null);
    setPricesData(null);
    fetchPropertyTypes();
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // --- RENDER ---

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de bien */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type de bien</label>
          <Select
            value={filters.propertyType}
            onValueChange={(value) => handleFilterChange('propertyType', value)}
            disabled={isLoadingTypes}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingTypes ? "Chargement..." : "Sélectionnez un type"} />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ville</label>
          <Select
            value={filters.city}
            onValueChange={(value) => handleFilterChange('city', value)}
            disabled={!filters.propertyType || isLoadingCities}
          >
            <SelectTrigger>
              <SelectValue placeholder={!filters.propertyType ? "Sélectionnez d'abord un type" : isLoadingCities ? "Chargement..." : "Sélectionnez une ville"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Secteur/Adresse */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Secteur</label>
          <Select
            value={filters.address}
            onValueChange={(value) => handleFilterChange('address', value)}
            disabled={!filters.city || isLoadingAddresses}
          >
            <SelectTrigger>
              <SelectValue placeholder={!filters.city ? "Sélectionnez d'abord une ville" : isLoadingAddresses ? "Chargement..." : "Sélectionnez un secteur"} />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem key={address.value} value={address.value}>
                  {address.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prix */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prix</label>
          <Select
            value={filters.price}
            onValueChange={(value) => handleFilterChange('price', value)}
            disabled={!filters.address || isLoadingPrices}
          >
            <SelectTrigger>
              <SelectValue placeholder={!filters.address ? "Sélectionnez d'abord un secteur" : isLoadingPrices ? "Chargement..." : "Sélectionnez un prix"} />
            </SelectTrigger>
            <SelectContent>
              {prices.map((price) => (
                <SelectItem key={price.value} value={price.value}>
                  {price.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}