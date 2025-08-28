// src/components/ClientUpcomingVisitsWidget.tsx
'use client';

import { Tables } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

// Define the shape of a raw property and visit from the database
type RawProperty = Tables<'properties'>;
type Visit = Tables<'visits'> & {
  properties: RawProperty;
};

// Define the props for the widget
interface ClientUpcomingVisitsWidgetProps {
  visits: Visit[];
  isLoading: boolean;
  onSeeAll: () => void;
}

// Use a named export with the new specific name
export const ClientUpcomingVisitsWidget = ({ visits, isLoading, onSeeAll }: ClientUpcomingVisitsWidgetProps) => {

  // Filter for only upcoming visits with a 'confirmed' or 'pending' status
  const upcomingVisits = visits
    .filter(visit => {
        const visitDate = new Date(visit.scheduled_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only
        return visitDate >= today && (visit.status === 'confirmed' || visit.status === 'pending');
    })
    .slice(0, 5); // Take the first 5 upcoming visits

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochaines Visites</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <p>Chargement des visites...</p>
        ) : upcomingVisits.length > 0 ? (
          <ul className="space-y-4">
            {upcomingVisits.map((visit) => (
              <li key={visit.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{visit.properties.title}</p>
                  <p className="text-sm text-gray-500">Statut : <span className="font-medium text-gray-700">{visit.status}</span></p>
                   <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1.5" />
                      {new Date(visit.scheduled_at).toLocaleString('fr-FR', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      })}
                   </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">Aucune visite à venir.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={onSeeAll}>
            Voir toutes mes visites <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
      </CardFooter>
    </Card>
  );
};
