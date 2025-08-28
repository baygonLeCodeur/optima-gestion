// src/lib/property-utils.ts
import { PropertyWithType } from '@/types/custom';
import { Tables } from '@/types/supabase';

type Prop = PropertyWithType | Tables<'properties'> | Record<string, unknown>;

export function getBedrooms(p: Prop): number {
  const r = p as unknown as Record<string, unknown>;
  const rooms = r['number_of_rooms'] as number | undefined;
  const bedrooms = r['number_of_bedrooms'] as number | undefined;
  return (rooms ?? bedrooms ?? 0) as number;
}

export function getBathrooms(p: Prop): number {
  const r = p as unknown as Record<string, unknown>;
  const baths = r['number_of_bathrooms'] as number | undefined;
  return (baths ?? 0) as number;
}

export function normalizeLatLng(p: Prop): { latitude?: number; longitude?: number } {
  const r = p as unknown as Record<string, unknown>;
  let lat: number | undefined;
  let lng: number | undefined;

  if (typeof r['latitude'] === 'number') lat = r['latitude'] as number;
  else if (typeof r['lat'] === 'number') lat = r['lat'] as number;

  if (typeof r['longitude'] === 'number') lng = r['longitude'] as number;
  else if (typeof r['lng'] === 'number') lng = r['lng'] as number;

  return { latitude: lat, longitude: lng };
}
