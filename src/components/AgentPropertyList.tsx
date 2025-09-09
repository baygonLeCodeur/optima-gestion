// src/components/AgentPropertyList.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Eye, Edit, Trash2, Loader2, ListFilter, ArrowDownUp, CheckCircle, Building } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { type AgentProperty } from '@/app/agent/biens/page';
// On importe les DEUX actions
import { deletePropertyAction, updatePropertyStatusAction } from '@/app/agent/biens/actions';

type AgentPropertyListProps = {
  properties: AgentProperty[];
};

const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

const getStatusBadge = (status: 'disponible' | 'loué' | 'vendu') => {
    switch (status) {
        case 'disponible':
            return <Badge variant="default" className="bg-green-500 text-white">Disponible</Badge>;
        case 'loué':
            return <Badge variant="secondary">Loué</Badge>;
        case 'vendu':
            return <Badge variant="destructive">Vendu</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

export default function AgentPropertyList({ properties }: AgentPropertyListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState<string | null>(null); // Pour suivre l'ID du bien en cours de MàJ
    const [propertyToDelete, setPropertyToDelete] = React.useState<AgentProperty | null>(null);

    const handleFilterOrSort = (key: 'status' | 'sortBy' | 'order', value: string | null) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (!value || value === 'all' || (key === 'sortBy' && value === 'created_at') || (key === 'order' && value === 'desc')) {
            current.delete(key);
        } else {
            current.set(key, value);
        }

        if (key === 'sortBy') {
            current.delete('order');
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };

    const handleUpdateStatus = async (property: AgentProperty, status: 'vendu' | 'loué') => {
        setIsUpdatingStatus(property.id);
        try {
            const result = await updatePropertyStatusAction(property.id, status);
            if (result.success) {
                toast({ title: 'Succès', description: `Le statut du bien "${property.title}" a été mis à jour.` });
                router.refresh(); // Rafraîchit la page pour voir le changement
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Une erreur est survenue.' });
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleDelete = async () => {
        if (!propertyToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deletePropertyAction(propertyToDelete.id);
            if (result.success) {
                toast({ title: 'Succès', description: `Le bien "${propertyToDelete.title}" a été supprimé.` });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Une erreur est survenue.' });
        } finally {
            setIsDeleting(false);
            setPropertyToDelete(null);
            router.refresh();
        }
    };

  return (
    <>
      <div className="flex justify-end space-x-2 mb-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filtrer par statut</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Statut du bien</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={searchParams.get('status') || 'all'}
                    onValueChange={(value) => handleFilterOrSort('status', value)}
                >
                    <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="disponible">Disponible</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="loué">Loué</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="vendu">Vendu</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><ArrowDownUp className="mr-2 h-4 w-4" />Trier par</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Critère de tri</DropdownMenuLabel>
                 <DropdownMenuRadioGroup
                    value={searchParams.get('sortBy') || 'created_at'}
                    onValueChange={(value) => handleFilterOrSort('sortBy', value)}
                >
                    <DropdownMenuRadioItem value="created_at">Date de création</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price">Prix</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="view_count">Vues</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={searchParams.get('order') || 'desc'}
                    onValueChange={(value) => handleFilterOrSort('order', value)}
                >
                    <DropdownMenuRadioItem value="desc">Décroissant</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="asc">Croissant</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {properties.length === 0 ? (
        <div className="text-center py-16 border rounded-md"><h3 className="text-xl font-semibold">Aucun bien ne correspond à vos filtres</h3><p className="text-muted-foreground mt-2">Essayez de modifier ou de réinitialiser vos filtres.</p></div>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Annonce</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Prix (FCFA)</TableHead>
              <TableHead className="text-right">Vues</TableHead>
              <TableHead className="text-right">Contacts</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                      <Image src={property.image_url || '/fond-appart.jpeg'} alt={property.title} width={100} height={60} className="rounded-md object-cover"/>
                      <span>{property.title}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(property.status)}</TableCell>
                <TableCell className="text-right">{formatNumber(property.price)}</TableCell>
                <TableCell className="text-right">{formatNumber(property.view_count || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(property.contacts)}</TableCell>
                <TableCell className="text-center">
                  {isUpdatingStatus === property.id ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Ouvrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link href={`/biens/${property.id}`}><Eye className="mr-2 h-4 w-4" />Voir</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href={`/agent/biens/edit/${property.id}`}><Edit className="mr-2 h-4 w-4" />Modifier</Link></DropdownMenuItem>
                      
                      {/* --- NOUVELLES OPTIONS CONDITIONNELLES --- */}
                      {property.status === 'disponible' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleUpdateStatus(property, 'vendu')}>
                            <CheckCircle className="mr-2 h-4 w-4" />Marquer comme vendu
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleUpdateStatus(property, 'loué')}>
                            <Building className="mr-2 h-4 w-4" />Marquer comme loué
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setPropertyToDelete(property); }}>
                        <Trash2 className="mr-2 h-4 w-4" />Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le bien "{propertyToDelete?.title}" sera supprimé.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
