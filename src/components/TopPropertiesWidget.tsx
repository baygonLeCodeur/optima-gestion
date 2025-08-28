// src/components/TopPropertiesWidget.tsx
'use client';

import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';

type TopProperty = Pick<Tables<'properties'>, 'id' | 'title' | 'image_paths' | 'view_count'>;

interface TopPropertiesWidgetProps {
    properties: TopProperty[];
}

export const TopPropertiesWidget = ({ properties }: TopPropertiesWidgetProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Vos Biens les Plus Populaires</CardTitle>
                <CardDescription>Les 3 annonces les plus vues par les clients.</CardDescription>
            </CardHeader>
            <CardContent>
                {properties.length > 0 ? (
                    <ul className="space-y-4">
                        {properties.map(property => (
                            <li key={property.id} className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10 rounded-md">
                                    <AvatarImage 
                                        src={property.image_paths?.[0] ?? undefined} 
                                        alt={property.title} 
                                        className="rounded-md"
                                    />
                                    <AvatarFallback className="rounded-md">
                                        <Home />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <Link href={`/biens/${property.id}`} className="font-semibold hover:underline">
                                        {property.title}
                                    </Link>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Eye className="mr-1.5 h-4 w-4" />
                                        {property.view_count ?? 0} vues
                                    </div>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href={`/agent/biens/edit/${property.id}`}>Gérer</Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-4">
                        Aucune donnée de vue disponible pour le moment.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
