// src/components/AgentStatsCards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Calendar, BarChart } from "lucide-react";

type AgentStats = {
    totalProperties: number;
    totalLeads: number;
    upcomingVisits: number;
    totalSales: number;
};

interface AgentStatsCardsProps {
    stats: AgentStats;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export const AgentStatsCards = ({ stats }: AgentStatsCardsProps) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Biens Actifs" value={stats.totalProperties} icon={Home} />
            <StatCard title="Nouveaux Leads" value={stats.totalLeads} icon={Users} />
            <StatCard title="Visites à Venir" value={stats.upcomingVisits} icon={Calendar} />
            <StatCard title="Ventes Réalisées (30j)" value={stats.totalSales} icon={BarChart} />
        </div>
    );
};
