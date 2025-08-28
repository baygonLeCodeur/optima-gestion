// src/types/custom.ts
import { Tables } from '@/types/supabase';

// Property shape extended with common joined relations used across the app
export type PropertyWithType = Tables<'properties'> & {
  users?: Tables<'users'> | null;
  property_types?: Tables<'property_types'> | null;
  virtual_tours?: Tables<'virtual_tours'>[] | null;
};

// Join type used when selecting favorites joined with properties
export type FavoriteJoin = {
  user_id: string;
  property_id: string;
  properties: PropertyWithType | null;
};

// Row shape for saved searches (re-export of generated type for convenience)
export type SavedSearchRow = Tables<'saved_searches'>;

// Generic RPC / ad-hoc row returned by Postgres functions where the exact shape is dynamic.
// Prefer replacing this with a concrete shape when possible.
// Prefer specific generated types from `src/types/supabase.ts` when available.
export type RPCRow = Record<string, unknown>;
