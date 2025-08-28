// src/app/biens/[id]/page.tsx

// --- PARTIE SERVEUR ---
// Ces imports et fonctions ne seront JAMAIS envoyés au client.
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Le client pour les Composants Serveur
import { Tables, Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import PropertyDetailClientPage from './PropertyDetailClientPage'; // On importe le nouveau composant client

// Les types sont partagés
type Property = Tables<'properties'> & {
  users: Tables<'users'> | null;
  property_types: Tables<'property_types'> | null;
  virtual_tours: Tables<'virtual_tours'>[] | null;
};

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>; // Dans Next.js 15, params est une promesse
}

// Fonction de récupération des données, purement côté serveur
async function getPropertyDetails(id: string): Promise<Property | null> {
  const supabase = await createClient();
  
  // 1. Récupérer la propriété d'abord
  const sb: SupabaseClient<Database> = supabase as unknown as SupabaseClient<Database>;
  const { data: propertyData, error: propertyError } = await sb
    .from('properties')
    .select(`
      *, 
      property_types(id, name), 
      virtual_tours(*)
    `)
    .eq('id', id)
    .single();
  
  if (propertyError || !propertyData) {
    console.error('❌ Error fetching property:', propertyError);
    return null;
  }
  
  // 2. SOLUTION UNIVERSELLE: Récupérer l'agent avec plusieurs approches
  let agentData = null;
  const _pd = propertyData as Record<string, unknown>;
  if (_pd['agent_id']) {
    const agentId = String(_pd['agent_id']);
    // APPROCHE 1: Requête normale
  const { data: agent1, error: error1 } = await sb
      .from('users')
      .select('id, full_name, email, image, phone_number')
      .eq('id', agentId)
      .single();
      
    if (!error1 && agent1) {
      agentData = agent1;
    } else {
      // APPROCHE 2: Requête avec maybeSingle() au lieu de single()
      const { data: agent2, error: error2 } = await sb
        .from('users')
        .select('id, full_name, email, image, phone_number')
        .eq('id', agentId)
        .maybeSingle();
        
      if (!error2 && agent2) {
        agentData = agent2;
      } else {
        // APPROCHE 3: Requête sans single() - prendre le premier résultat
        const { data: agents, error: error3 } = await sb
          .from('users')
          .select('id, full_name, email, image, phone_number')
          .eq('id', agentId);
          
        if (!error3 && agents && agents.length > 0) {
          agentData = agents[0];
        } else {
          // APPROCHE 4: Requête avec filtres différents (au cas où il y aurait un problème de casse ou d'espaces)
          const { data: agents4, error: error4 } = await sb
            .from('users')
            .select('id, full_name, email, image, phone_number')
            .ilike('id', agentId);
            
          if (!error4 && agents4 && agents4.length > 0) {
            agentData = agents4[0];
          }
        }
      }
    }
  }
  
  // 3. Combiner les données
  const propertyWithAgent = {
    ...propertyData,
    users: agentData
  };
  
  return propertyWithAgent as unknown as Property;
}

// --- LE COMPOSANT SERVEUR PRINCIPAL ---
// Il est très simple : il récupère les données et les passe au composant client.
export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  // Dans Next.js 15, params est une promesse et doit être attendue
  const { id } = await params;
  const property = await getPropertyDetails(id);

  if (!property) {
    notFound();
  }

  // On passe les données récupérées côté serveur au composant client
  return <PropertyDetailClientPage property={property} />;
}