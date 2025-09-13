// src/components/VisitRequestForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// --- Schéma de validation simplifié ---
const visitRequestSchema = z.object({
  message: z.string().optional(),
  scheduled_at: z.date({ required_error: 'Veuillez sélectionner un créneau.' }),
});

type VisitRequestFormValues = z.infer<typeof visitRequestSchema>;

// --- Type pour les créneaux reçus de l'API ---
type Slot = {
  start: string;
  end: string;
};

interface VisitRequestFormProps {
  propertyId: string;
  agentId: string;
}

export function VisitRequestForm({ propertyId, agentId }: VisitRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<VisitRequestFormValues>({
    resolver: zodResolver(visitRequestSchema),
    defaultValues: {
      message: '',
    },
  });

  // --- Récupération des créneaux disponibles (inchangé) ---
  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (!agentId) return;
      setIsLoadingSlots(true);
      try {
        const response = await fetch(`/api/availabilities?agentId=${agentId}`);
        if (!response.ok) throw new Error('Could not fetch availabilities');
        const data = await response.json();
        setAvailableSlots(data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: "Impossible de charger les disponibilités de l'agent.",
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchAvailabilities();
  }, [agentId, toast]);

  // --- Logique de soumission simplifiée ---
  const onSubmit = async (values: VisitRequestFormValues) => {
    setIsLoading(true);
    try {
      // On s'assure que l'utilisateur est bien connecté avant d'envoyer
      if (!user) {
        throw new Error("Vous devez être connecté pour prendre rendez-vous.");
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          agent_id: agentId,
          client_id: user.id, // On utilise l'ID de l'utilisateur authentifié
          scheduled_at: values.scheduled_at.toISOString(),
          status: 'pending',
          client_notes: values.message,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit visit request');

      toast({
        title: 'Demande de visite envoyée',
        description: `Votre demande pour le ${format(values.scheduled_at, 'PPP à HH:mm', { locale: fr })} a bien été enregistrée.`,
      });
      form.reset();
      setSelectedDate(undefined);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('formSuccess', { detail: { propertyId } }));
      }

    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filtres pour le calendrier (inchangé) ---
  const availableDays = Array.from(new Set(availableSlots.map(slot => startOfDay(parseISO(slot.start)).getTime())))
    .map(time => new Date(time));

  const slotsForSelectedDay = selectedDate
    ? availableSlots.filter(slot => isSameDay(parseISO(slot.start), selectedDate))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Planifier une visite</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* --- Section Calendrier et Créneaux --- */}
            <div className="relative">
              {/* Calendrier */}
              {isLoadingSlots ? (
                <div className="flex items-center justify-center rounded-md border min-h-[288px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={fr}
                  disabled={(date) => !availableDays.some(enabledDate => isSameDay(date, enabledDate))}
                  initialFocus
                  className="rounded-md border"
                />
              )}

              {/* Overlay pour les créneaux */}
              {selectedDate && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-background/70 p-4 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold">Choisissez un créneau</h3>
                  <FormField
                    control={form.control}
                    name="scheduled_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                            {slotsForSelectedDay.length > 0 ? (
                              slotsForSelectedDay.map(slot => (
                                <Button
                                  key={slot.start}
                                  variant={field.value && field.value.toISOString() === slot.start ? 'default' : 'outline'}
                                  onClick={() => field.onChange(parseISO(slot.start))}
                                  type="button"
                                >
                                  {format(parseISO(slot.start), 'HH:mm')}
                                </Button>
                              ))
                            ) : (
                              <p className="col-span-3 text-center text-sm text-muted-foreground">
                                Aucun créneau disponible.
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button variant="link" size="sm" onClick={() => setSelectedDate(undefined)} className="mt-2">
                    Changer de date
                  </Button>
                </div>
              )}
            </div>

            {/* --- Section Message --- */}
            <div className="space-y-2">
                <hr/>
                <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                        <FormLabel>3. Message pour l'agent (facultatif)</FormLabel>
                        <FormControl><Textarea placeholder="Ajoutez des précisions si nécessaire..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>

            <Button type="submit" disabled={isLoading || isLoadingSlots} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Envoi en cours...' : 'Confirmer la demande de visite'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
