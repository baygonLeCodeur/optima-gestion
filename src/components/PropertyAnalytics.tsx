// src/components/PropertyAnalytics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, MessageCircle, CalendarPlus } from 'lucide-react';

interface PropertyAnalyticsProps {
  stats: {
    views: number;
    favorites: number;
    visitRequests: number;
    contactRequests: number;
  };
}

const statsConfig = [
  {
    title: 'Vues de la page',
    key: 'views',
    icon: Eye,
    description: "Nombre total de fois que la page de l'annonce a été vue.",
    color: 'text-blue-500',
  },
  {
    title: 'Ajouts aux favoris',
    key: 'favorites',
    icon: Heart,
    description: "Nombre de clients ayant ajouté ce bien à leurs favoris.",
    color: 'text-red-500',
  },
  {
    title: 'Demandes de visite',
    key: 'visitRequests',
    icon: CalendarPlus,
    description: "Nombre de demandes de visite reçues pour ce bien.",
    color: 'text-green-500',
  },
  {
    title: 'Demandes de contact',
    key: 'contactRequests',
    icon: MessageCircle,
    description: "Nombre de fois que des clients ont demandé à vous contacter via cette annonce.",
    color: 'text-purple-500',
  },
];

export function PropertyAnalytics({ stats }: PropertyAnalyticsProps) {
  return (
    <div>
        <h3 className="text-xl font-bold tracking-tight mb-4">Statistiques de l'Annonce</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((item) => (
            <Card key={item.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className={`h-4 w-4 text-muted-foreground ${item.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats[item.key as keyof typeof stats]}</div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
