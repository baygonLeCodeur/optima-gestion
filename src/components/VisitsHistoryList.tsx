// src/components/VisitsHistoryList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Calendar, Check, Clock, Home, Star } from 'lucide-react';
import Link from 'next/link';

// --- Type definitions ---
type Visit = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'id' | 'title' | 'address' | 'city'>;
};

// --- Component ---
export const VisitsHistoryList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchVisits = async () => {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('visits')
                    .select(`
                        *,
                        properties (
                            id,
                            title,
                            address,
                            city
                        )
                    `)
                    .eq('client_id', user.id)
                    .order('scheduled_at', { ascending: false });

                if (error) throw error;
                
                setVisits(data || []);
            } catch (error: any) {
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger votre historique de visites.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, [user, toast]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Confirmée</span>;
            case 'completed':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">Terminée</span>;
            case 'cancelled':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">Annulée</span>;
            case 'pending':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">En attente</span>;
            default:
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
        );
    }
    
    if (visits.length === 0) {
        return (
            <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>Aucune visite</AlertTitle>
                <AlertDescription>
                    Vous n'avez aucune visite planifiée ou passée.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {visits.map(visit => (
                <Card key={visit.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{visit.properties.title}</span>
                            {getStatusBadge(visit.status)}
                        </CardTitle>
                        <CardDescription>
                           <Home className="inline-block w-4 h-4 mr-1" /> {visit.properties.address}, {visit.properties.city}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center text-sm text-gray-600">
                         <Clock className="h-4 w-4 mr-2" />
                         Le {new Date(visit.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                       </div>
                    </CardContent>
                    {visit.status === 'completed' && (
                        <CardFooter>
                           <Button variant="outline" size="sm" disabled>
                                <Star className="mr-2 h-4 w-4" />
                                Laisser un avis (bientôt)
                           </Button>
                        </CardFooter>
                    )}
                </Card>
            ))}
        </div>
    );
};
