// src/components/RecentActivityWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Home, Search, Calendar } from 'lucide-react';

type Activity = {
  id: string;
  type: 'notification' | 'new_favorite' | 'saved_search' | 'visit_update';
  text: string;
  timestamp: string;
  icon: React.ReactNode;
};

const RecentActivityWidget: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setActivities([]);
      return;
    }

    const supabase = createClient();

    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const [notificationsRes, favoritesRes, searchesRes, visitsRes] = await Promise.all([
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('user_favorites').select('*, properties(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
          supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
          supabase.from('visits').select('*, properties(title)').eq('client_id', user.id).order('updated_at', { ascending: false }).limit(2),
        ]);

        const notifications = notificationsRes.data ?? [];
        const favorites = favoritesRes.data ?? [];
        const searches = searchesRes.data ?? [];
        const visits = visitsRes.data ?? [];

        let fetchedActivities: Activity[] = [
          ...notifications.filter((n: any) => n.created_at).map((n: any) => ({ id: n.id, type: 'notification' as const, text: n.message, timestamp: n.created_at!, icon: <Bell className="w-5 h-5 text-yellow-500" /> })),
          ...favorites.filter((f: any) => f.created_at).map((f: any) => ({ id: f.id, type: 'new_favorite' as const, text: `Vous avez ajouté "${f.properties?.title}" à vos favoris.`, timestamp: f.created_at!, icon: <Home className="w-5 h-5 text-red-500" /> })),
          ...searches.filter((s: any) => s.created_at).map((s: any) => ({ id: s.id, type: 'saved_search' as const, text: `Nouvelle recherche sauvegardée : "${s.name}"`, timestamp: s.created_at!, icon: <Search className="w-5 h-5 text-blue-500" /> })),
          ...visits.filter((v: any) => v.updated_at).map((v: any) => ({ id: v.id, type: 'visit_update' as const, text: `Le statut de votre visite pour "${v.properties?.title}" est : ${v.status}`, timestamp: v.updated_at!, icon: <Calendar className="w-5 h-5 text-green-500" /> })),
        ];

        fetchedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(fetchedActivities.slice(0, 7));
      } catch (err) {
        console.error('RecentActivityWidget fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      console.warn('RecentActivityWidget: fetch taking too long, aborting and showing partial data');
      setIsLoading(false);
    }, 7000);

    fetchActivities().finally(() => clearTimeout(timeout));
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Chargement...</p>
        ) : activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={`${activity.type}-${activity.id}`} className="flex items-start space-x-4">
                <div className="flex-shrink-0">{activity.icon}</div>
                <div className="flex-grow">
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune activité récente.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityWidget;
