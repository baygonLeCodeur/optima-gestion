// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase' // Assurez-vous que ce chemin est correct

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in your environment variables');
  }

  // Les variables d'environnement sont lues directement ici car ce code s'exécute dans le navigateur
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
