// src/app/agent/leads/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgentLeadTable } from '@/components/AgentLeadTable';
import { Tables } from '@/types/supabase';

export type Lead = Tables<'leads'>;

async function getAgentLeads(agentId: string): Promise<Lead[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_agent_id', agentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur lors de la récupération des leads:", error.message);
        return [];
    }
    return data as Lead[];
}

export default async function AgentLeadsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }

    const leads = await getAgentLeads(user.id);

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