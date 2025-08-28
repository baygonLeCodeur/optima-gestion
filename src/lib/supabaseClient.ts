import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Assurez-vous que les variables d'environnement sont définies dans votre projet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in your environment variables');
}

// Créez et exportez le client Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
