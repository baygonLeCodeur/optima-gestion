/* src/components/PropertyTypeManager.tsx */
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tables, Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type PropertyType = Tables<'property_types'>;

export const PropertyTypeManager = () => {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // <-- 1. Ajouter un état pour détecter le client
  const { toast } = useToast();

  // 2. Détecter quand on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchPropertyTypes = async () => {
    setLoading(true);
    const supabase = createClient();
    const sb = supabase as unknown as SupabaseClient<Database>;
    const { data, error } = await sb.from('property_types').select('*');
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setPropertyTypes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // 3. Ne charger les données que côté client
    if (isClient) {
      fetchPropertyTypes();
    }
  }, [isClient]);

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    const supabase = createClient();
    const sb = supabase as unknown as SupabaseClient<Database>;
    const { error } = await sb.from('property_types').insert({ name: newTypeName });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Type de bien ajouté.' });
      setNewTypeName('');
      fetchPropertyTypes();
    }
  };

  // 4. Afficher un placeholder pendant l'hydratation
  if (!isClient) {
    return (
      <div>
        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1"></div>
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
        <Input 
          type="text" 
          placeholder="Nouveau type de bien"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
        />
        <Button type="submit" onClick={handleAddType}>Ajouter</Button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propertyTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.description || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
