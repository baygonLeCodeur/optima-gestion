// src/components/AgentPropertyListClient.tsx
'use client';

// On importe directement le composant, car il est déjà un "Client Component".
// L'import dynamique n'est pas nécessaire dans ce cas et peut causer des problèmes.
import AgentPropertyList from '@/components/AgentPropertyList';
import { AgentProperty } from '@/app/agent/biens/page';
import { Skeleton } from './ui/skeleton';

type Props = {
    properties: AgentProperty[];
}

// Ce composant client enveloppe la liste pour gérer les états de chargement
// ou d'autres logiques côté client si nécessaire à l'avenir.
export default function AgentPropertyListClient({ properties }: Props) {
    if (!properties) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }
    return <AgentPropertyList properties={properties} />;
}
