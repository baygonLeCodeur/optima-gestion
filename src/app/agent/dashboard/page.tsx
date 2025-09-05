// src/app/agent/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgentStatsCards } from '@/components/AgentStatsCards';
import { AgentLeadList } from '@/components/AgentLeadList';
import { AgentUpcomingVisitsWidget } from '@/components/AgentUpcomingVisitsWidget';
import { AgentPerformanceChart } from '@/components/AgentPerformanceChart';
import { TopPropertiesWidget } from '@/components/TopPropertiesWidget';
import { Separator } from '@/components/ui/separator';
import { AgentCalendar } from '@/components/AgentCalendar';
import { AgentVisitList } from '@/components/AgentVisitList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tables } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Définitions de types ---
type VisitWithDetails = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};
type LeadWithDetails = Tables<'leads'>;
type TopProperty = Pick<Tables<'properties'>, 'id' | 'title' | 'image_paths' | 'view_count'>;
type Availability = Tables<'agent_availabilities'>;

// --- Fonction de récupération des données (mise à jour) ---
async function getAgentDashboardData(supabase: SupabaseClient, agentId: string) {
    // Promesses existantes
    const propertiesPromise = supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'available');
    const leadsPromise = supabase.from('leads').select('id', { count: 'exact' }).eq('assigned_agent_id', agentId).eq('status', 'new');
    const salesLast30DaysPromise = supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());
    const topPropertiesPromise = supabase.from('properties').select('id, title, image_paths, view_count').eq('agent_id', agentId).order('view_count', { ascending: false, nullsFirst: false }).limit(3);
    const recentLeadsPromise = supabase.from('leads').select('*').eq('assigned_agent_id', agentId).order('created_at', { ascending: false }).limit(5);

    // NOUVELLES promesses pour le calendrier et les listes de visites
    const allVisitsPromise = supabase.from('visits').select('*, properties(title, address), clients:users!visits_client_id_fkey(full_name, image)').eq('agent_id', agentId).order('scheduled_at', { ascending: true });
    const availabilitiesPromise = supabase.from('agent_availabilities').select('*').eq('agent_id', agentId);

    // Données pour le graphique (inchangé)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const salesLast6MonthsPromise = supabase.from('properties').select('price, updated_at').eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', sixMonthsAgo.toISOString());

    const [
        { count: totalProperties }, { count: totalLeads }, { count: salesLast30Days },
        { data: topProperties, error: topPropertiesError }, { data: recentLeads, error: leadsError },
        { data: allVisits, error: visitsError }, { data: availabilities, error: availabilitiesError },
        { data: salesLast6Months, error: salesError }
    ] = await Promise.all([
        propertiesPromise, leadsPromise, salesLast30DaysPromise,
        topPropertiesPromise, recentLeadsPromise, allVisitsPromise,
        availabilitiesPromise, salesLast6MonthsPromise
    ]);

    // Traitement des visites (inchangé mais utilise `allVisits`)
    const upcomingVisits = (allVisits || []).filter(v => new Date(v.scheduled_at) >= new Date() && v.status === 'confirmed');
    const pendingVisits = (allVisits || []).filter(v => v.status === 'pending');

    // Traitement du graphique (inchangé)
    const monthlySales = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { name: d.toLocaleString('fr-FR', { month: 'short' }), total: 0 };
    }).reverse();
    if (salesLast6Months) {
        for (const sale of salesLast6Months) {
            const month = new Date(sale.updated_at!).toLocaleString('fr-FR', { month: 'short' });
            const monthData = monthlySales.find(m => m.name === month);
            if (monthData) monthData.total += 1;
        }
    }

    // Gestion des erreurs
    if (topPropertiesError) console.error("Error fetching top properties:", topPropertiesError.message);
    if (leadsError) console.error("Error fetching leads:", leadsError.message);
    if (visitsError) console.error("Error fetching visits:", visitsError.message);
    if (availabilitiesError) console.error("Error fetching availabilities:", availabilitiesError.message);
    if (salesError) console.error("Error fetching sales:", salesError.message);

    const stats = {
        totalProperties: totalProperties ?? 0,
        totalLeads: totalLeads ?? 0,
        upcomingVisits: upcomingVisits.length,
        totalSales: salesLast30Days ?? 0
    };

    return {
        stats,
        monthlySales,
        topProperties: (topProperties || []) as TopProperty[],
        recentLeads: (recentLeads || []) as LeadWithDetails[],
        allVisits: (allVisits || []) as VisitWithDetails[],
        availabilities: (availabilities || []) as Availability[],
        upcomingVisitsWidgetData: upcomingVisits.slice(0, 5) // On garde les 5 premières pour le widget
    };
}

// --- Composant de Page (mis à jour) ---
export default async function AgentDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }
    
    const { stats, monthlySales, topProperties, recentLeads, allVisits, availabilities, upcomingVisitsWidgetData } = await getAgentDashboardData(supabase, user.id);

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

            {/* NOUVELLE SECTION CALENDRIER ET VISITES */}
            <div className="space-y-4">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-semibold tracking-tight">Mon Calendrier et mes Visites</h3>
                    <p className="text-sm text-muted-foreground">
                        Gérez votre emploi du temps et vos rendez-vous.
                    </p>
                </div>
                <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <AgentCalendar visits={allVisits} availabilities={availabilities} />
                    </div>
                    <div className="lg:col-span-3">
                        <Tabs defaultValue="pending">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="pending">En attente</TabsTrigger>
                                <TabsTrigger value="upcoming">À venir</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pending">
                                <AgentVisitList title="Demandes en attente" visits={allVisits.filter(v => v.status === 'pending')} />
                            </TabsContent>
                            <TabsContent value="upcoming">
                                <AgentVisitList title="Prochaines visites confirmées" visits={allVisits.filter(v => new Date(v.scheduled_at) >= new Date() && v.status === 'confirmed')} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            <Separator className="my-4 md:my-6" />

            {/* SECTION ACTIVITÉ RÉCENTE (EXISTANTE MAIS MISE À JOUR) */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-semibold tracking-tight">Activité Récente</h3>
                    <p className="text-sm text-muted-foreground">
                        Vos derniers leads et visites programmées.
                    </p>
                </div>
                <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <AgentLeadList leads={recentLeads} />
                    </div>
                    <div className="lg:col-span-3">
                        {/* Le widget utilise maintenant les données pré-filtrées */}
                        <AgentUpcomingVisitsWidget visits={upcomingVisitsWidgetData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
