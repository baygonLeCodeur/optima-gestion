// src/components/AgentVisitList.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tables } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { updateVisitStatusAction } from '@/app/agent/calendar/actions';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// --- Type local pour correspondre aux données du tableau de bord ---
type Visit = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title' | 'address'> | null;
  clients: Pick<Tables<'users'>, 'full_name' | 'image'> | null;
};

interface AgentVisitListProps {
  title: string;
  visits: Visit[];
}

export function AgentVisitList({ title, visits }: AgentVisitListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (visitId: string, newStatus: 'confirmed' | 'canceled') => {
    startTransition(async () => {
      const result = await updateVisitStatusAction(visitId, newStatus);
      if (result.success) {
        toast({
          title: 'Statut mis à jour',
          description: `La visite a bien été marquée comme ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'}.`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || "La mise à jour a échoué.",
          variant: 'destructive',
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">En attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmée</Badge>;
      case 'completed':
        return <Badge variant="secondary">Terminée</Badge>;
      case 'canceled':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visits.length > 0 ? (
          visits.map((visit) => (
            <div key={visit.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={visit.clients?.image || undefined} alt={visit.clients?.full_name || 'Client'} />
                  <AvatarFallback>{visit.clients?.full_name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{visit.clients?.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{visit.properties?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(visit.scheduled_at), 'PPP p', { locale: fr })}
                  </p>
                </div>
              </div>
              
              {visit.status === 'pending' ? (
                <div className="flex items-center space-x-2">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Button size="sm" onClick={() => handleStatusUpdate(visit.id, 'confirmed')}>
                        Confirmer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(visit.id, 'canceled')}>
                        Annuler
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                getStatusBadge(visit.status)
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune visite à afficher.
          </p>
        )}
      </CardContent>
    </Card>
  );
}