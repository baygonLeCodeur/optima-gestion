// src/components/PaymentsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CreditCard, Receipt } from 'lucide-react';

// --- Type definitions ---
type Payment = Tables<'payments'>;

// --- Component ---
export const PaymentsList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPayments = async () => {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                setPayments(data || []);
            } catch (error: any) {
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger votre historique de paiements.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user, toast]);

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'succeeded':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Réussi</span>;
            case 'pending':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">En attente</span>;
            case 'failed':
                 return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">Échoué</span>;
            default:
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-500 bg-gray-100">{status || 'N/A'}</span>;
        }
    };
    
    const formatCurrency = (amount: number | null, currency: string | null) => {
        if (amount === null || currency === null) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (payments.length === 0) {
        return (
            <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertTitle>Aucun paiement</AlertTitle>
                <AlertDescription>
                    Vous n'avez effectué aucun paiement pour le moment.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.map(payment => (
                    <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date || payment.created_at!).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="sm" disabled>
                                <Receipt className="mr-2 h-4 w-4" />
                                Voir le reçu
                           </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
