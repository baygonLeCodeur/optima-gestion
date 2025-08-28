// src/components/PropertyListItem.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { CheckSquare, Square } from 'lucide-react';
import { PropertyCardType } from '@/types';

interface PropertyListItemProps {
  property: PropertyCardType;
  onToggleCompare?: (property: PropertyCardType) => void;
  isSelected?: boolean;
}

export default function PropertyListItem({ property, onToggleCompare, isSelected }: PropertyListItemProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex">
        <Link href={`/biens/${property.id}`} className="block w-1/3 relative">
          <Image src={property.image_url} alt={property.dataAiHint} layout="fill" objectFit="cover" />
        </Link>
        <div className="p-4 w-2/3 flex flex-col">
          <div className="flex justify-between items-start">
            <Link href={`/biens/${property.id}`} className="hover:text-primary">
              <h3 className="font-bold text-lg">{property.type}</h3>
            </Link>
            {/* Correction: Utiliser property.status directement qui est déjà formaté par mapPropertyData */}
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${property.status === 'À Vendre' ? 'bg-green-200 text-green-800' : property.status === 'À Louer' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>{property.status}</span>
          </div>
          {/* Correction: Utiliser property.address directement qui est déjà formaté par mapPropertyData */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{property.address}</p>
          <p className="text-xl font-bold text-green-600 mt-2">{property.price}</p>
          <div className="flex-grow"></div>
          <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
            <div className="flex gap-4">
              <span>{property.rooms} pièces</span>
              <span>{property.bathrooms} sdb.</span>
              <span>{property.area} m²</span>
            </div>
            {onToggleCompare && (
              <Button variant="outline" size="sm" onClick={() => onToggleCompare(property)}>
                {isSelected ? <CheckSquare className="mr-2 h-4 w-4" /> : <Square className="mr-2 h-4 w-4" />}
                Comparer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
