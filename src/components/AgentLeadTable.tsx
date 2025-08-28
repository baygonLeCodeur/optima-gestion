
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Eye, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Lead } from '@/app/agent/leads/page';

type AgentLeadTableProps = {
  leads: Lead[];
};

const getStatusBadge = (status: string) => {
  const lowerCaseStatus = status.toLowerCase();
  switch (lowerCaseStatus) {
    case 'nouveau':
      return <Badge variant="default" className="bg-blue-500 text-white">Nouveau</Badge>;
    case 'en cours':
      return <Badge variant="secondary" className="bg-yellow-500 text-white">En cours</Badge>;
    case 'converti':
      return <Badge variant="default" className="bg-green-500 text-white">Converti</Badge>
    case 'perdu':
        return <Badge variant="destructive">Perdu</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export function AgentLeadTable({ leads }: AgentLeadTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = (status: string | null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!status || status === 'all') {
      current.delete('status');
    } else {
      current.set('status', status);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filtrer par statut</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Statut du Lead</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={searchParams.get('status') || 'all'}
              onValueChange={handleFilter}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="nouveau">Nouveau</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="en cours">En cours</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="converti">Converti</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="perdu">Perdu</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Dernier Contact</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length > 0 ? leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.full_name || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone_number || 'N/A'}</TableCell>
                <TableCell>
                  {lead.last_contact_at ? format(new Date(lead.last_contact_at), 'PPP', { locale: fr }) : 'Aucun'}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/agent/leads/${lead.id}`}><Eye className="mr-2 h-4 w-4" />Voir les détails</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Aucun lead trouvé.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
