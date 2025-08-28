
'use client';

import * as React from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { type VisitWithDetails } from '@/app/agent/calendar/page';
import { VisitDetailsModal } from '@/components/VisitDetailsModal';

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

type AgentCalendarProps = {
  visits: VisitWithDetails[];
};

export function AgentCalendar({ visits }: AgentCalendarProps) {
    const [selectedVisit, setSelectedVisit] = React.useState<VisitWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const events: Event[] = visits.map(visit => ({
        title: `${visit.properties.title} - ${visit.users.full_name}`,
        start: new Date(visit.scheduled_at),
        end: new Date(new Date(visit.scheduled_at).getTime() + (visit.duration_minutes || 60) * 60000),
        resource: visit,
    }));

    const eventStyleGetter = (event: Event) => {
        const visit = event.resource as VisitWithDetails;
        let backgroundColor = '#3174ad'; // Default blue
        if (visit.status === 'Confirmée') backgroundColor = '#34a853'; // Green
        if (visit.status === 'Annulée') backgroundColor = '#ea4335'; // Red
        if (visit.status === 'En attente') backgroundColor = '#fbbc05'; // Yellow
        return { style: { backgroundColor } };
    };

    const handleSelectEvent = (event: Event) => {
        setSelectedVisit(event.resource as VisitWithDetails);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
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
