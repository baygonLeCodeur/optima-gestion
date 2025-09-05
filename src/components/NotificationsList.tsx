// src/components/NotificationsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Tables, Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsClient } from '@/hooks/use-is-client';

type Notification = Tables<'notifications'>;

export function NotificationsList() {
  const isClient = useIsClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    const supabase = createClient();
    try {
      setLoading(true);

      // add a simple timeout to avoid indefinite waiting
      const fetchPromise = supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data, error } = await Promise.race([
        fetchPromise,
        new Promise((_res, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
      ]) as unknown as { data: Tables<'notifications'>[] | null; error: any };

      if (error) throw error;
      setNotifications(data || []);
    } catch (e: any) {
      setError('Impossible de charger les notifications.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
  const supabase = createClient();
  const sb = supabase as unknown as SupabaseClient<Database>;
  const { error } = await sb
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      // Re-fetch notifications to update the UI
      fetchNotifications();
      toast({ title: 'Succès', description: 'Notification marquée comme lue.' });
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: "La notification n'a pas pu être mise à jour.",
        variant: 'destructive',
      });
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre de Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {isClient || notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-4 ${notif.is_read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <div className="flex-shrink-0">
                  <Bell className="h-5 w-5 mt-1" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold">{notif.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at!).toLocaleString()}</p>
                </div>
                {!notif.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notif.id)} title="Marquer comme lu">
                    <CheckCheck className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>Boîte de réception vide</AlertTitle>
            <AlertDescription>
              Vous n'avez aucune nouvelle notification pour le moment.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
