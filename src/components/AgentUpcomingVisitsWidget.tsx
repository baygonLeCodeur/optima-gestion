// src/components/AgentUpcomingVisitsWidget.tsx
'use client';

import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// Le type Visit inclut maintenant les relations étendues avec le bon nom de champ 'image'
type Visit = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};

// Le composant accepte maintenant directement la liste des visites
interface AgentUpcomingVisitsWidgetProps {
  visits: Visit[];
}

export function AgentUpcomingVisitsWidget({ visits }: AgentUpcomingVisitsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochaines Visites</CardTitle>
        <CardDescription>Vos 5 prochains rendez-vous confirmés.</CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length > 0 ? (
          <ul className="space-y-4">
            {visits.map((visit) => (
              <li key={visit.id} className="flex items-center space-x-4">
                <Avatar>
                    {/* Le widget affiche maintenant l'image de l'utilisateur */}
                    <AvatarImage src={visit.clients?.image ?? undefined} alt={visit.clients?.full_name ?? 'Avatar'} />
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold">{visit.clients?.full_name ?? 'Client non spécifié'}</p>
                  <p className="text-sm text-muted-foreground truncate">{visit.properties?.title ?? 'Propriété non spécifiée'}</p>
                </div>
                <div className="text-right">
                    {/* CORRECTION: Utilisation de 'scheduled_at' au lieu de 'visit_date' */}
                    <p className="text-sm font-medium">{new Date(visit.scheduled_at!).toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(visit.scheduled_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">Aucune visite à venir.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/agent/calendar" passHref>
          <Button variant="outline" size="sm">
            Voir le calendrier complet <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
