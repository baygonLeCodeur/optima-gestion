// src/components/ComparisonBar.tsx
'use client';

import { PropertyCardType } from '@/types';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';
import { ComparisonDialog } from './ComparisonDialog';

interface ComparisonBarProps {
  selectedProperties: PropertyCardType[];
  onClear: () => void;
}

export function ComparisonBar({ selectedProperties, onClear }: ComparisonBarProps) {
  if (selectedProperties.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg p-4 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Comparer les biens</h3>
          <div className="flex gap-2">
            {selectedProperties.map(p => (
              <div key={p.id} className="relative h-12 w-16 rounded-md overflow-hidden">
                <Image src={p.image_url} alt={p.type} layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComparisonDialog properties={selectedProperties} />
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
