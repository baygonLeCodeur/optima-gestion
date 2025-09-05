
'use client';

import * as React from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, setHours, setMinutes, setSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { VisitDetailsModal } from '@/components/VisitDetailsModal';
import { Tables } from '@/types/supabase';

// --- Types locaux pour correspondre aux données de la page Dashboard ---
type Visit = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};
type Availability = Tables<'agent_availabilities'>;

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

interface AgentCalendarProps {
  visits: Visit[];
  availabilities: Availability[];
}

// --- Interface étendue pour inclure le type d'événement ---
interface CalendarEvent extends BigCalendarEvent {
  resource: Visit | { type: 'availability' };
}

export function AgentCalendar({ visits, availabilities }: AgentCalendarProps) {
    const [selectedVisit, setSelectedVisit] = React.useState<Visit | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const events: CalendarEvent[] = React.useMemo(() => {
        // Création des événements pour les visites
        const visitEvents: CalendarEvent[] = (visits || []).map(visit => ({
            title: `${visit.properties?.title || 'Propriété inconnue'} - ${visit.clients?.full_name || 'Client inconnu'}`,
            start: new Date(visit.scheduled_at),
            end: addMinutes(new Date(visit.scheduled_at), visit.duration_minutes || 60),
            resource: visit,
        }));

        // Création des événements pour les disponibilités
        const availabilityEvents: CalendarEvent[] = (availabilities || []).flatMap(avail => {
            const [startHour, startMinute] = avail.start_time.split(':').map(Number);
            const [endHour, endMinute] = avail.end_time.split(':').map(Number);
            
            // On crée un événement pour chaque semaine du mois en cours et le mois suivant
            const eventsList: CalendarEvent[] = [];
            const today = new Date();
            for (let i = 0; i < 8; i++) { // 8 semaines pour couvrir le mois en cours et le suivant
                const weekStart = startOfWeek(addMinutes(today, i * 7 * 24 * 60), { locale: fr });
                const targetDate = new Date(weekStart);
                targetDate.setDate(targetDate.getDate() + avail.day_of_week);

                const start = setSeconds(setMinutes(setHours(targetDate, startHour), startMinute), 0);
                const end = setSeconds(setMinutes(setHours(targetDate, endHour), endMinute), 0);

                eventsList.push({
                    title: 'Disponible',
                    start,
                    end,
                    resource: { type: 'availability' },
                });
            }
            return eventsList;
        });

        return [...visitEvents, ...availabilityEvents];
    }, [visits, availabilities]);

    const eventStyleGetter = (event: CalendarEvent) => {
        const { resource } = event;
        
        if ('type' in resource && resource.type === 'availability') {
            return {
                style: {
                    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Vert très clair
                    borderColor: 'rgba(76, 175, 80, 0.5)',
                    color: '#333',
                    zIndex: 0, // Mettre en arrière-plan
                },
            };
        }

        const visit = resource as Visit;
        let backgroundColor = '#3174ad'; // Bleu par défaut (Confirmé)
        switch (visit.status) {
            case 'pending': backgroundColor = '#fbbc05'; break; // Jaune
            case 'confirmed': backgroundColor = '#34a853'; break; // Vert
            case 'canceled': backgroundColor = '#ea4335'; break; // Rouge
            case 'completed': backgroundColor = '#9e9e9e'; break; // Gris
        }
        return { style: { backgroundColor, zIndex: 1 } };
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if ('type' in event.resource && event.resource.type === 'availability') return;
        setSelectedVisit(event.resource as Visit);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }} // Hauteur fixe pour une meilleure mise en page
                culture="fr"
                messages={{
                    next: "Suivant",
                    previous: "Précédent",
                    today: "Aujourd'hui",
                    month: "Mois",
                    week: "Semaine",
                    day: "Jour",
                    agenda: "Agenda",
                    date: "Date",
                    time: "Heure",
                    event: "Événement",
                }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day']} // On limite les vues
                defaultView="week" // Vue par défaut
            />
            {selectedVisit && (
                 <VisitDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    visit={selectedVisit}
                />
            )}
        </>
    );
}
