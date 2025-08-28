
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';

import { AgentLeadTable } from '@/components/AgentLeadTable'; // Sera créé à l'étape suivante

export type Lead = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  status: string;
  last_contact_at: string | null;
};

async function getAgentLeads(
    supabase: SupabaseClient, 
    agentId: string,
    filter: { status?: string }
): Promise<Lead[]> {
    let query = supabase
        .from('leads')
        .select('id, created_at, full_name, email, phone_number, status, last_contact_at')
        .eq('assigned_agent_id', agentId);

    if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Erreur lors de la récupération des leads de l'agent:", error);
        return [];
    }
    return data;
}

export default async function AgentLeadsPage({
    searchParams,
}: {
    searchParams?: { status?: string; };
}) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { get: (name) => cookieStore.get(name)?.value },
        }
    );

    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    const role = cookieStore.get('sb-user-role')?.value;

    if (!accessToken || role !== 'agent') {
        redirect('/login');
    }

    await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        redirect('/login');
    }
    
    const leads = await getAgentLeads(supabase, session.user.id, {
        status: searchParams?.status,
    });

    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Prospects (Leads)</h2>
            </div>
            
            <div className="container mx-auto py-10">
                <AgentLeadTable leads={leads} />
            </div>
        </main>
    );
}
