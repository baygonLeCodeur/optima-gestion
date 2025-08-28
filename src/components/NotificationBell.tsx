// src/components/NotificationBell.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tables } from '@/types/supabase';

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Fonction pour récupérer le nombre initial de notifications non lues
    const supabase = createClient();

    const fetchInitialCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    fetchInitialCount();

    // S'abonner aux changements en temps réel sur la table des notifications
    const channel = supabase
      .channel(`realtime-notifications:${user.id}`)
      .on<Tables<'notifications'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (_payload) => {
          // Après chaque changement, on rafraichit le compteur
          fetchInitialCount();
        }
      )
      .subscribe();

    // Se désabonner du canal lors du nettoyage du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Button asChild variant="ghost" size="icon">
      <Link href="/dashboard" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
