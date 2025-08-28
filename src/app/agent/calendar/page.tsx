'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCalendar } from '@/components/AgentCalendar';
import { AvailabilityManager } from '@/components/AvailabilityManager';
import { Tables } from '@/types/supabase';
import { updateAvailabilitiesAction } from './actions';

// --- TYPES ---
export type VisitWithDetails = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'id' | 'title' | 'address'>;
  users: Pick<Tables<'users'>, 'id' | 'full_name' | 'email' | 'phone_number'>;
};
type Availability = Tables<'agent_availabilities'>;

// --- PAGE COMPONENT ---
export default function AgentCalendarPage() {
    const supabase = createClientComponentClient();
    const [user, setUser] = useState<any>(null);
    const [visits, setVisits] = useState<VisitWithDetails[]>([]);
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
        };
        getUser();
    }, [supabase]);

    useEffect(() => {
        if (user) {
            const getAgentData = async () => {
                const { data: visits, error: visitsError } = await supabase.from('visits').select(`*, properties ( id, title, address ), users!visits_client_id_fkey ( id, full_name, email, phone_number )`).eq('agent_id', user.id);
                const { data: availabilities, error: availabilitiesError } = await supabase.from('agent_availabilities').select('*').eq('agent_id', user.id);
                
                if (visitsError) console.error("Erreur (visites):", visitsError.message);
                if (availabilitiesError) console.error("Erreur (disponibilités):", availabilitiesError.message);

                setVisits(visits as VisitWithDetails[] || []);
                setAvailabilities(availabilities as Availability[] || []);
            };
            getAgentData();
        }
    }, [user, supabase]);

    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Calendrier et Disponibilités</h2>
            <Tabs defaultValue="calendar" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="calendar">Calendrier des Visites</TabsTrigger>
                    <TabsTrigger value="availability">Gestion des Disponibilités</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar" className="h-[75vh]">
                    <AgentCalendar visits={visits} />
                </TabsContent>
                <TabsContent value="availability">
                    <AvailabilityManager availabilities={availabilities} updateAction={updateAvailabilitiesAction} />
                </TabsContent>
            </Tabs>
        </main>
    );
}
