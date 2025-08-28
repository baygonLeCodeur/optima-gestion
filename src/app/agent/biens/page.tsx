// src/app/agent/biens/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { loadAgentProperties } from './actions';
import AgentPropertyListClient from '@/components/AgentPropertyListClient';

// La définition du type reste la même, elle est parfaite.
export type AgentProperty = {
  id: string;
  title: string;
  status: 'disponible' | 'loué' | 'vendu';
  price: number;
  image_url: string;
  view_count: number | null; 
  contacts: number;
  created_at: string;
};

// --- Composant Page avec la correction finale ---
export default async function AgentPropertiesPage({
    searchParams,
}: {
    // Le type peut rester simple, car TypeScript infère la Promise.
    searchParams?: { 
        status?: string;
        sortBy?: string;
        order?: string;
    };
}) {
    // --- LA CORRECTION EST ICI ---
    // On "attend" que la promesse searchParams soit résolue avant de l'utiliser.
    // Cela résout l'erreur signalée par Next.js.
    const resolvedSearchParams = await searchParams;

    // On appelle ensuite la Server Action avec l'objet résolu.
    const properties = await loadAgentProperties({
        status: resolvedSearchParams?.status,
        sortBy: resolvedSearchParams?.sortBy,
        order: resolvedSearchParams?.order,
    });

    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gestion de vos Biens Immobiliers</h2>
                <Link href="/agent/biens/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un nouveau bien
                    </Button>
                </Link>
            </div>
            
            <div className="container mx-auto py-10">
                <AgentPropertyListClient properties={properties} />
            </div>
        </main>
    );
}
