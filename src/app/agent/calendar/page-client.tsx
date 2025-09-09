// src/app/agent/calendar/page-client.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCalendar } from '@/components/AgentCalendar';
import { AvailabilityManager } from '@/components/AvailabilityManager';
import { updateAvailabilitiesAction } from './actions';
import { VisitWithDetails } from './page';
import { Tables } from '@/types/supabase';

type Availability = Tables<'agent_availabilities'>;

interface AgentCalendarPageClientProps {
    visits: VisitWithDetails[];
    availabilities: Availability[];
}

export default function AgentCalendarPageClient({ visits, availabilities }: AgentCalendarPageClientProps) {
    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Calendrier et Disponibilités</h2>
            <Tabs defaultValue="calendar" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="calendar">Calendrier des Visites</TabsTrigger>
                    <TabsTrigger value="availability">Gestion des Disponibilités</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar" className="h-[75vh]">
                    <AgentCalendar visits={visits} availabilities={availabilities} />
                </TabsContent>
                <TabsContent value="availability">
                    <AvailabilityManager availabilities={availabilities} updateAction={updateAvailabilitiesAction} />
                </TabsContent>
            </Tabs>
        </main>
    );
}
