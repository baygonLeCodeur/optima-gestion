// src/components/VisitRequestForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
// On importe l'icône de chargement
import { Loader2 } from 'lucide-react';

const visitRequestSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().optional(),
  message: z.string().optional(),
});

type VisitRequestFormValues = z.infer<typeof visitRequestSchema>;

interface VisitRequestFormProps {
  propertyId: string;
  agentId: string;
}

export function VisitRequestForm({ propertyId, agentId }: VisitRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<VisitRequestFormValues>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (values: VisitRequestFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, propertyId, agentId, clientId: user?.id }),
      });

      // On récupère la réponse JSON pour pouvoir afficher un message d'erreur plus précis
      const result = await response.json();

      if (!response.ok) {
        // On utilise le message d'erreur de l'API s'il existe
        throw new Error(result.message || 'Failed to submit visit request');
      }

      toast({
        title: 'Demande de visite envoyée',
        description: 'Nous vous contacterons bientôt pour confirmer.',
      });
      form.reset();

      // --- AMÉLIORATION APPLIQUÉE ICI ---
      // 1. On stocke une information dans le localStorage pour indiquer le succès
      localStorage.setItem(`form_success_${propertyId}`, 'true');
      // 2. On déclenche un événement personnalisé pour que les autres composants réagissent instantanément
      window.dispatchEvent(new CustomEvent('formSuccess', { detail: { propertyId } }));
      // --- FIN DE L'AMÉLIORATION ---

    } catch (error: any) {
      toast({
        title: 'Erreur',
        // On affiche le message de l'erreur interceptée
        description: error.message || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom complet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Votre email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone (facultatif)</FormLabel>
              <FormControl>
                <Input placeholder="Votre numéro de téléphone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (facultatif)</FormLabel>
              <FormControl>
                <Textarea placeholder="Vos disponibilités, questions..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {/* --- AMÉLIORATION APPLIQUÉE ICI --- */}
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </Button>
      </form>
    </Form>
  );
}