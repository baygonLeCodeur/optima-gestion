// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase' // Assurez-vous que ce chemin est correct

export function createClient() {
  // Les variables d'environnement sont lues directement ici car ce code s'exécute dans le navigateur
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
