// src/components/SavedSearchesList.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Search, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type SavedSearch = Tables<'saved_searches'>;

export const SavedSearchesList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSavedSearches = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedSearches(data || []);
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger vos recherches sauvegardées.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchSavedSearches();
    }, [fetchSavedSearches]);

    const handleAlertToggle = async (searchId: string, currentStatus: boolean | null) => {
        // ... (existing implementation)
    };
    
    const handleDeleteSearch = async (searchId: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('saved_searches')
                .delete()
                .eq('id', searchId);

            if (error) throw error;

            toast({ title: 'Succès', description: 'La recherche a été supprimée.' });
            fetchSavedSearches(); // Refresh the list
        } catch (error: any) {
             toast({ title: 'Erreur', description: 'Impossible de supprimer la recherche.', variant: 'destructive' });
        }
    };

    const handleViewResults = (search: SavedSearch) => {
        const criteria = search.search_criteria;
        let paramsString = '';
        try {
            if (typeof criteria === 'string') {
                paramsString = criteria;
        } else if (criteria && typeof criteria === 'object') {
            const entries = Object.entries(criteria as Record<string, unknown>).map(([k, v]) => [k, String(v)]) as [string, string][];
            paramsString = new URLSearchParams(entries).toString();
            }
        } catch (e) {
            console.warn('Unable to serialize search criteria', e);
        }
        router.push(`/recherche?${paramsString}`);
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
        );
    }
    
    if (savedSearches.length === 0) {
        return (
            <Alert>
                <Search className="h-4 w-4" />
                <AlertTitle>Aucune recherche sauvegardée</AlertTitle>
                <AlertDescription>
                    Vous n'avez pas encore sauvegardé de recherche.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {savedSearches.map(search => (
                <Card key={search.id}>
                    <CardHeader>
                        <CardTitle>{search.name}</CardTitle>
                        <CardDescription>
                            Sauvegardée le {new Date(search.created_at!).toLocaleDateString('fr-FR')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id={`alert-${search.id}`} 
                                checked={!!search.email_alerts} 
                                onCheckedChange={() => handleAlertToggle(search.id, search.email_alerts)} 
                            />
                            <Label htmlFor={`alert-${search.id}`}>Alertes Email</Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={() => handleViewResults(search)}>
                            Voir les résultats
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="icon">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible et supprimera définitivement cette recherche.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSearch(search.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};
