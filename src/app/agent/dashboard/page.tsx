// src/app/agent/dashboard/page.tsx

// 1. On importe notre nouveau client Supabase pour le serveur.
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgentStatsCards } from '@/components/AgentStatsCards';
import { AgentLeadList } from '@/components/AgentLeadList';
import { AgentUpcomingVisitsWidget } from '@/components/AgentUpcomingVisitsWidget';
import { AgentPerformanceChart } from '@/components/AgentPerformanceChart';
import { TopPropertiesWidget } from '@/components/TopPropertiesWidget';
import { Separator } from '@/components/ui/separator';
import { Tables } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Les définitions de types et la fonction getAgentDashboardData restent identiques ---
// Elles sont déjà bien écrites et n'ont pas besoin de changer.
type VisitWithDetails = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};
type LeadWithDetails = Tables<'leads'>;
type TopProperty = Pick<Tables<'properties'>, 'id' | 'title' | 'image_paths' | 'view_count'>;

async function getAgentDashboardData(supabase: any, agentId: string) {
    const propertiesPromise = supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'available');
    const leadsPromise = supabase.from('leads').select('id', { count: 'exact' }).eq('assigned_agent_id', agentId).eq('status', 'new');
    const visitsPromise = supabase.from('visits').select('id', { count: 'exact' }).eq('agent_id', agentId).gte('scheduled_at', new Date().toISOString()).eq('status', 'confirmed');
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesLast30DaysPromise = supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());
    const salesLast6MonthsPromise = supabase.from('properties').select('price, updated_at').eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', sixMonthsAgo.toISOString());
    const topPropertiesPromise = supabase.from('properties').select('id, title, image_paths, view_count').eq('agent_id', agentId).order('view_count', { ascending: false, nullsFirst: false }).limit(3);

    const recentLeadsPromise = supabase.from('leads').select('*').eq('assigned_agent_id', agentId).order('created_at', { ascending: false }).limit(5);
    const upcomingVisitsPromise = supabase.from('visits').select('*, properties(title, address), clients:users!visits_client_id_fkey(full_name, image)').eq('agent_id', agentId).gte('scheduled_at', new Date().toISOString()).eq('status', 'confirmed').order('scheduled_at', { ascending: true }).limit(5);

    const [
        { count: totalProperties }, { count: totalLeads }, { count: upcomingVisitsCount },
        { count: salesLast30Days }, { data: salesLast6Months, error: salesError }, { data: topProperties, error: topPropertiesError },
        { data: recentLeads, error: leadsError }, { data: upcomingVisits, error: visitsError }
    ] = await Promise.all([
        propertiesPromise, leadsPromise, visitsPromise,
        salesLast30DaysPromise, salesLast6MonthsPromise, topPropertiesPromise,
        recentLeadsPromise, upcomingVisitsPromise
    ]);

    const monthlySales = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { name: d.toLocaleString('fr-FR', { month: 'short' }), total: 0 };
    }).reverse();

    if (salesLast6Months) {
        for (const sale of salesLast6Months) {
            const month = new Date(sale.updated_at!).toLocaleString('fr-FR', { month: 'short' });
            const monthData = monthlySales.find(m => m.name === month);
            if (monthData) {
                monthData.total += 1;
            }
        }
    }

    if (salesError) console.error("Error fetching sales:", salesError.message);
    if (topPropertiesError) console.error("Error fetching top properties:", topPropertiesError.message);
    if (leadsError) console.error("Error fetching leads:", leadsError.message);
    if (visitsError) console.error("Error fetching visits:", visitsError.message);

    const stats = {
        totalProperties: totalProperties ?? 0,
        totalLeads: totalLeads ?? 0,
        upcomingVisits: upcomingVisitsCount ?? 0,
        totalSales: salesLast30Days ?? 0
    };

    return { stats, monthlySales, topProperties: (topProperties || []) as TopProperty[], recentLeads: (recentLeads || []) as LeadWithDetails[], upcomingVisits: (upcomingVisits || []) as VisitWithDetails[] };
}


// --- Composant de Page (entièrement réécrit et simplifié) ---
export default async function AgentDashboardPage() {
    // 2. On crée le client et on récupère l'utilisateur en une seule fois.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. On vérifie si l'utilisateur est connecté et a le bon rôle.
    // C'est plus propre et plus sûr que de lire un cookie.
    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }
    
    // 4. On lance la récupération des données avec l'ID de l'utilisateur.
    const { stats, monthlySales, topProperties, recentLeads, upcomingVisits } = await getAgentDashboardData(supabase, user.id);

    // Le reste du JSX est identique.
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
            </div>
            
            <AgentStatsCards stats={stats} />
            
            <div className="grid gap-4 md:gap-6 mt-6 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <AgentPerformanceChart data={monthlySales} />
                </div>
                <div className="lg:col-span-3">
                    <TopPropertiesWidget properties={topProperties} />
                </div>
            </div>

            <Separator className="my-4 md:my-6" />

            <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <AgentLeadList leads={recentLeads} />
                </div>
                <div className="lg:col-span-3">
                     <AgentUpcomingVisitsWidget visits={upcomingVisits} />
                </div>
            </div>
        </div>
    );
}
