// src/components/AgentLeadList.tsx
'use client';

import { Tables } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

type Lead = Tables<'leads'>;

interface AgentLeadListProps {
    leads: Lead[];
}

export const AgentLeadList = ({ leads }: AgentLeadListProps) => {

    const getStatusVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'new': return 'default';
            case 'contacted': return 'secondary';
            case 'closed': return 'destructive';
            default: return 'outline';
        }
    }

    if (leads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leads Récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Aucun nouveau lead pour le moment.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Leads Récents</CardTitle>
                    <CardDescription>Les derniers prospects qui ont montré de l'intérêt.</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                    Voir tous les leads <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <TableRow key={lead.id}>
                                {/* CORRECTION: Utilisation de full_name et phone_number */}
                                <TableCell className="font-medium">{lead.full_name ?? 'N/A'}</TableCell>
                                <TableCell>{lead.phone_number ?? 'N/A'}</TableCell>
                                {/* CORRECTION: Gestion du cas où created_at est null */}
                                <TableCell>{lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR') : 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(lead.status)}>
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
