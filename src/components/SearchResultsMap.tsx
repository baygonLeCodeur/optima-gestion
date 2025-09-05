// src/components/SearchResultsMap.tsx

"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PropertyCardType } from '@/types';
import Link from 'next/link';

// --- Icône personnalisée pour les biens ---
// Correction pour s'assurer que l'icône est correctement initialisée côté client
// et éviter les problèmes de chemin d'accès avec les outils de build.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
} );


// --- Props du composant ---
interface SearchResultsMapProps {
  properties: PropertyCardType[];
}

// --- Composant ---
export function SearchResultsMap({ properties }: SearchResultsMapProps) {
  // Filtre les propriétés qui n'ont pas de coordonnées valides
  const validProperties = properties.filter(p => p.latitude != null && p.longitude != null);

  // Si aucune propriété valide, ne rend pas la carte
  if (validProperties.length === 0) {
    return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-md" style={{ height: '600px' }}>
            <p className="text-gray-500">Aucune propriété avec des coordonnées à afficher sur la carte.</p>
        </div>
    );
  }

  // Calcule le centre de la carte en faisant la moyenne des coordonnées
  const centerLat = validProperties.reduce((sum, p) => sum + p.latitude!, 0) / validProperties.length;
  const centerLng = validProperties.reduce((sum, p) => sum + p.longitude!, 0) / validProperties.length;

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={12} scrollWheelZoom={false} style={{ height: '600px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Crée un marqueur pour chaque propriété valide */}
      {validProperties.map(property => (
        <Marker
          key={property.id}
          position={[property.latitude!, property.longitude!]}
        >
          <Popup>
            <div className="font-semibold">{property.type}</div>
            <div>{property.address}</div>
            <div className="font-bold mt-1">{property.price}</div>
            <Link href={`/biens/${property.id}`} className="text-blue-600 hover:underline mt-2 inline-block">
              Voir les détails
            </Link>
          </Popup>
        </Marker>
       ))}
    </MapContainer>
  );
}

// On exporte par défaut pour faciliter l'import dynamique
export default SearchResultsMap;
