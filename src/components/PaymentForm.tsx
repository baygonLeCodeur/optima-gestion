// src/components/PaymentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// --- Validation Schema ---
const paymentFormSchema = z.object({
    amount: z.preprocess(
        (val) => Number(String(val)),
        z.number().positive("Le montant doit être supérieur à 0.").min(100, "Le montant minimum est de 100 F CFA.")
    ),
    description: z.string().min(5, "La description est trop courte.").max(100, "La description est trop longue."),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, "Le numéro de téléphone doit contenir 10 chiffres."),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// --- Component ---
export const PaymentForm = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            amount: 100,
            description: '',
            phoneNumber: '',
        },
    });

    const onSubmit = async (values: PaymentFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Une erreur est survenue.");
            }
            
            // If initiation is successful, CinetPay returns a payment link.
            // We redirect the user to this link to complete the payment.
            if (result.payment_link) {
                 toast({
                    title: 'Redirection vers la page de paiement...',
                    description: 'Vous allez être redirigé pour finaliser votre paiement.',
                });
                
                // Vérifier si nous sommes côté client avant d'accéder à window
                if (isClient && typeof window !== 'undefined') {
                    window.location.href = result.payment_link;
                }
            } else {
                 throw new Error("Le lien de paiement n'a pas été reçu.");
            }

        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.message,
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Montant (F CFA)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="50000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Loyer de Mai 2025" {...field} />
                            </FormControl>
                             <FormDescription>
                                A quoi correspond ce paiement ?
                             </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Numéro de téléphone</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="0102030405" {...field} />
                            </FormControl>
                            <FormDescription>
                                Le numéro qui sera utilisé pour le paiement Mobile Money (10 chiffres, sans indicatif).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initiation en cours...
                        </>
                    ) : (
                        'Payer maintenant'
                    )}
                </Button>
            </form>
        </Form>
    );
};
