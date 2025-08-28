// src/components/Map.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Interfaces ---
// Définit la structure d'un Point d'Intérêt (POI) retourné par l'API Overpass
interface Poi {
  id: number;
  lat?: number; // Les 'nodes' ont lat/lon
  lon?: number;
  center?: { // Les 'ways' ont un centre
    lat: number;
    lon: number;
  };
  tags: {
    name: string;
    amenity: string;
  };
}

// --- Icônes personnalisées ---
// Création d'icônes de différentes couleurs pour une meilleure lisibilité de la carte
const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const propertyIcon = createIcon('green'); // Icône verte pour le bien immobilier
const schoolIcon = createIcon('blue'); // Icône bleue pour les écoles
const restaurantIcon = createIcon('orange'); // Icône orange pour les restaurants
const supermarketIcon = createIcon('violet'); // Icône violette pour les supermarchés
const defaultPoiIcon = createIcon('grey'); // Icône grise par défaut

// Fonction pour choisir l'icône en fonction du type de POI
const getIconForPoi = (amenity: string) => {
  switch (amenity) {
    case 'school':
      return schoolIcon;
    case 'restaurant':
      return restaurantIcon;
    case 'supermarket':
      return supermarketIcon;
    default:
      return defaultPoiIcon;
  }
};


interface MapProps {
  lat: number;
  lng: number;
  popupText?: string;
}

export function Map({ lat, lng, popupText }: MapProps) {
  const [pois, setPois] = useState<Poi[]>([]);

  useEffect(() => {
    // Fonction pour récupérer les POI depuis l'API Overpass
    const fetchPois = async () => {
      // Rayon de recherche de 1km autour du bien
      const radius = 1000; 
      // Requête pour trouver les écoles, restaurants et supermarchés
      const query = `[out:json];
        (
          node["amenity"~"school|restaurant|supermarket"](around:${radius},${lat},${lng});
          way["amenity"~"school|restaurant|supermarket"](around:${radius},${lat},${lng});
        );
        out center;`;

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        setPois(data.elements);
      } catch (error) {
        console.error("Erreur lors de la récupération des points d'intérêt:", error);
      }
    };

    fetchPois();
  }, [lat, lng]); // L'effet se déclenche si la latitude ou longitude change

  // Empêche le rendu côté serveur
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Marqueur pour le bien immobilier */}
      <Marker position={[lat, lng]} icon={propertyIcon}>
        {popupText && <Popup>{popupText}</Popup>}
      </Marker>

      {/* Marqueurs pour les points d'intérêt */}
      {pois.map(poi => {
        // Gère les 'nodes' (coordonnées directes) et les 'ways' (coordonnées centrales)
        const position: [number, number] | null = poi.lat && poi.lon 
          ? [poi.lat, poi.lon] 
          : (poi.center ? [poi.center.lat, poi.center.lon] : null);

        if (!position || !poi.tags.name) return null;

        return (
          <Marker
            key={poi.id}
            position={position}
            icon={getIconForPoi(poi.tags.amenity)}
          >
            <Popup>{poi.tags.name}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
