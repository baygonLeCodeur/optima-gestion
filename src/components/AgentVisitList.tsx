// src/components/AgentVisitList.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';

type Visit = Tables<'visits'> & {
  properties: Pick<Tables<'properties'>, 'title'>;
  users: Pick<Tables<'users'>, 'full_name' | 'email'>;
};

interface AgentVisitListProps {
  visits: Visit[];
}

export default function AgentVisitList({ visits }: AgentVisitListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Propriété</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.map((visit) => (
          <TableRow key={visit.id}>
            <TableCell>{visit.properties.title}</TableCell>
            <TableCell>{visit.users.full_name || visit.users.email}</TableCell>
            <TableCell>{new Date(visit.scheduled_at).toLocaleString()}</TableCell>
            <TableCell>
              <Badge>{visit.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
