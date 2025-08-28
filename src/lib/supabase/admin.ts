// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Ce client est un "super utilisateur". À n'utiliser que dans les routes API
// et les Server Actions où des privilèges élevés sont nécessaires.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      // Important: empêche ce client d'utiliser les cookies de l'utilisateur
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
