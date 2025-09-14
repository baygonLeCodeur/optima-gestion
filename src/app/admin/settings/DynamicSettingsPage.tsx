// src/app/admin/settings/DynamicSettingsPage.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Chargeur dynamique pour la page des paramètres
const SettingsClientPage = dynamic(
  () => import('./SettingsClientPage'), 
  { 
    ssr: false,
    loading: () => (
      <main className="flex-grow container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-1/2 mb-8" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </main>
    ),
  }
);

export default function DynamicSettingsPage() {
  return <SettingsClientPage />;
}