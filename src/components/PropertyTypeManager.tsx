// src/components/PropertyTypeManager.tsx
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
  const { toast } = useToast();

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
    fetchPropertyTypes();
  }, []);

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
}
