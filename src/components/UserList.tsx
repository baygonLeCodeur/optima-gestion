/* src/components/UserList.tsx */
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/types/supabase';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

type User = Tables<'users'>;

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      toast({ title: 'Erreur', description: "Impossible de charger les utilisateurs.", variant: 'destructive' });
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    // La logique de mise à jour sera ajoutée ici
    console.log(`Changer l'utilisateur ${userId} au rôle ${newRole}`);
    toast({ title: 'Action non implémentée', description: "La modification du rôle n'est pas encore fonctionnelle." });
  };
  
  if (loading) {
    return <p>Chargement des utilisateurs...</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.full_name || 'N/A'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                </Badge>
            </TableCell>
            <TableCell>
                <Badge variant={user.is_active ? 'default' : 'outline'}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                </Badge>
            </TableCell>
            <TableCell>
              {user.role !== 'admin' && (
                <Button variant="outline" size="sm" onClick={() => handleRoleChange(user.id, user.role === 'agent' ? 'client' : 'agent')}>
                  Changer en {user.role === 'agent' ? 'Client' : 'Agent'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
