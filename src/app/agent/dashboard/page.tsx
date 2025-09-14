// src/app/agent/dashboard/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
import { DepositForm } from '@/components/DepositForm';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

type SupabaseServerClient = SupabaseClient;

// --- Définitions de types ---
type VisitWithDetails = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};
type LeadWithDetails = Tables<'leads'>;
type TopProperty = Pick<Tables<'properties'>, 'id' | 'title' | 'image_paths' | 'view_count'>;
type Availability = Tables<'agent_availabilities'>;
type SaleData = Pick<Tables<'properties'>, 'price' | 'updated_at'>;
type WalletData = Pick<Tables<'agent_wallets'>, 'balance'>;

// --- Fonction de récupération des données (version corrigée) ---
async function getAgentDashboardData(supabase: SupabaseServerClient, agentId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const results = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'available'),
        supabase.from('leads').select('id', { count: 'exact' }).eq('assigned_agent_id', agentId).eq('status', 'new'),
        supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()),
        supabase.from('properties').select('id, title, image_paths, view_count').eq('agent_id', agentId).order('view_count', { ascending: false, nullsFirst: false }).limit(3),
        supabase.from('leads').select('*').eq('assigned_agent_id', agentId).order('created_at', { ascending: false }).limit(5),
        supabase.from('visits').select('*, properties(title, address), clients:users!visits_client_id_fkey(full_name, image)').eq('agent_id', agentId).order('scheduled_at', { ascending: true }),
        supabase.from('agent_availabilities').select('*').eq('agent_id', agentId),
        supabase.from('properties').select('price, updated_at').eq('agent_id', agentId).eq('status', 'sold').gte('updated_at', sixMonthsAgo.toISOString()),
        supabase.from('agent_wallets').select('balance').eq('agent_id', agentId).single()
    ]);

    // Extraire les données et les erreurs, en appliquant les types corrects
    const [{ count: totalProperties, error: propertiesError }, { count: totalLeads, error: leadsCountError }, { count: salesLast30Days, error: salesCountError }, { data: topProperties, error: topPropertiesError }, { data: recentLeads, error: leadsError }, allVisitsResult, { data: availabilities, error: availabilitiesError }, salesLast6MonthsResult, walletResult] = results;

    // CORRECTION DÉFINITIVE : Appliquer les types explicites ici
    const allVisits = (allVisitsResult.data as VisitWithDetails[] | null) || [];
    const salesLast6Months = (salesLast6MonthsResult.data as SaleData[] | null) || [];
    const wallet = (walletResult.data as WalletData | null);

    // Gérer les erreurs
    const errors = [propertiesError, leadsCountError, salesCountError, topPropertiesError, leadsError, allVisitsResult.error, availabilitiesError, salesLast6MonthsResult.error, walletResult.error];
    for (const error of errors) {
        if (error && (error as PostgrestError).code !== 'PGRST116') { // PGRST116 = no rows found, not an error for .single()
            console.error("Erreur lors de la récupération des données du tableau de bord:", error.message);
        }
    }

    // Traiter les données (maintenant avec les bons types)
    const upcomingVisits = allVisits.filter(v => new Date(v.scheduled_at) >= new Date() && v.status === 'confirmed');
    const monthlySales = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { name: d.toLocaleString('fr-FR', { month: 'short' }), total: 0 };
    }).reverse();
    
    for (const sale of salesLast6Months) {
        if (sale.updated_at) {
            const month = new Date(sale.updated_at).toLocaleString('fr-FR', { month: 'short' });
            const monthData = monthlySales.find(m => m.name === month);
            if (monthData) monthData.total += 1;
        }
    }

    // Retourner les données formatées
    return {
        stats: {
            totalProperties: totalProperties ?? 0,
            totalLeads: totalLeads ?? 0,
            upcomingVisits: upcomingVisits.length,
            totalSales: salesLast30Days ?? 0
        },
        monthlySales,
        topProperties: (topProperties || []) as TopProperty[],
        recentLeads: (recentLeads || []) as LeadWithDetails[],
        allVisits: allVisits,
        availabilities: (availabilities || []) as Availability[],
        upcomingVisitsWidgetData: upcomingVisits.slice(0, 5),
        walletBalance: wallet?.balance ?? 0
    };
}

// --- Composant de Page ---
export default async function AgentDashboardPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'agent') {
        redirect('/login');
    }
    
    const { stats, monthlySales, topProperties, recentLeads, allVisits, availabilities, upcomingVisitsWidgetData, walletBalance } = await getAgentDashboardData( supabase, user.id);

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
                        <AgentUpcomingVisitsWidget visits={upcomingVisitsWidgetData} />
                    </div>
                </div>
            </div>

            <Separator className="my-4 md:my-6" />

            {/* NOUVELLE SECTION PORTEFEUILLE */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-semibold tracking-tight">Mon Portefeuille</h3>
                    <p className="text-sm text-muted-foreground">
                        Rechargez votre compte pour activer vos annonces.
                    </p>
                </div>
                <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <div className="p-6 border rounded-lg shadow-md h-full flex flex-col justify-center">
                            <h4 className="font-semibold text-muted-foreground">Solde actuel</h4>
                            <p className="text-4xl font-bold">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(walletBalance)}
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <DepositForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
