// src/components/ComparisonDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PropertyCardType } from '@/types'; // Import depuis le fichier centralisé
import { Button } from './ui/button';

interface ComparisonDialogProps {
  properties: PropertyCardType[];
}

export function ComparisonDialog({ properties }: ComparisonDialogProps) {
  if (properties.length === 0) return null;

  const features: { label: string; value: (p: PropertyCardType) => React.ReactNode }[] = [
    { label: 'Prix', value: (p: PropertyCardType) => p.price },
    { label: 'Adresse', value: (p: PropertyCardType) => p.address },
    // Some data shapes use 'rooms' or 'bedrooms' historically — normalize safely here.
    { label: 'Chambres', value: (p: PropertyCardType) => String((p as unknown as Record<string, unknown>).bedrooms ?? (p as unknown as Record<string, unknown>).rooms ?? 0) },
    { label: 'Salles de bain', value: (p: PropertyCardType) => String((p as unknown as Record<string, unknown>).bathrooms ?? 0) },
    { label: 'Superficie (m²)', value: (p: PropertyCardType) => String(p.area) },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Comparer ({properties.length})</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparaison des biens</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Caractéristique</TableHead>
                {properties.map(p => (
                  <TableHead key={p.id}>{p.type}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map(feature => (
                <TableRow key={feature.label}>
                  <TableCell className="font-semibold">{feature.label}</TableCell>
                  {properties.map(p => (
                    <TableCell key={p.id}>{feature.value(p)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
