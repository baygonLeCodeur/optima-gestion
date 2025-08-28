// src/app/agent/biens/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AgentProperty } from './page';

// L'action de suppression ne change pas, elle est déjà parfaite.
export async function deletePropertyAction(propertyId: string): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentification invalide ou session expirée.' };
    }

    const { error } = await supabase.from('properties').delete().eq('id', propertyId).eq('agent_id', user.id);

    if (error) {
        console.error('Erreur de suppression du bien:', error);
        return { success: false, error: "Le bien n'a pas pu être supprimé." };
    }

    revalidatePath('/agent/biens');
    return { success: true };
}

// --- Fonction de chargement des propriétés (entièrement réécrite pour utiliser la RPC) ---
export async function loadAgentProperties(filter: { 
    status?: string; 
    sortBy?: string; 
    order?: string 
}): Promise<AgentProperty[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }
    
    // 1. On appelle notre nouvelle fonction RPC en lui passant l'ID de l'agent.
    // La syntaxe .rpc() est faite pour ça.
    const sb = supabase as unknown as SupabaseClient<Database>;
    let query = sb.rpc('get_agent_properties_with_contacts', { agent_uuid: user.id });

    // 2. On applique les filtres et tris sur le RÉSULTAT de la fonction RPC.
    if (filter.status && ['available', 'rented', 'sold'].includes(filter.status)) {
        query = query.eq('status', filter.status);
    }

    const validSortBy = ['created_at', 'price', 'view_count', 'contacts']; // On peut maintenant trier par contacts !
    const sortBy = validSortBy.includes(filter.sortBy || '') ? filter.sortBy : 'created_at';
    const order = filter.order === 'asc' ? true : false;
    
    query = query.order(sortBy!, { ascending: order });

    const { data, error } = await query;

    if (error) {
        console.error("Erreur lors de l'appel RPC pour les propriétés de l'agent:", error);
        return [];
    }

    const rows = (data as unknown as Database['public']['Functions']['get_agent_properties_with_contacts']['Returns']) || [];

    return rows.map((property) => {
        // Map RPC status to the strict union expected by AgentProperty
        const statusMap: Record<string, AgentProperty['status']> = {
            'available': 'disponible',
            'rented': 'loué',
            'sold': 'vendu',
        };
        const mappedStatus = statusMap[property.status] ?? 'disponible';

        let imageUrl = '/fond-appart.jpeg';
        if (Array.isArray(property.image_paths) && property.image_paths.length > 0) {
            const first = property.image_paths[0];
            if (typeof first === 'string') imageUrl = first;
        }

        return {
            id: property.id,
            title: property.title,
            status: mappedStatus,
            price: property.price,
            image_url: imageUrl,
            view_count: property.view_count ?? 0,
            contacts: Number(((property as unknown as Record<string, unknown>)['contacts_count'] as number | undefined) ?? ((property as unknown as Record<string, unknown>)['contacts'] as number | undefined) ?? 0),
            created_at: property.created_at,
        };
    });
}
