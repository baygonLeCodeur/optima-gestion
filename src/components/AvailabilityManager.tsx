
'use client';

import * as React from 'react';
import { useFormStatus, useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/types/supabase';

type Availability = Tables<'agent_availabilities'>;

type AvailabilityManagerProps = {
    availabilities: Availability[];
    updateAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string | null }>;
};

const daysOfWeek = [
    { id: 1, label: 'Lundi' }, { id: 2, label: 'Mardi' }, { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' }, { id: 5, label: 'Vendredi' }, { id: 6, label: 'Samedi' },
    { id: 0, label: 'Dimanche' }
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les disponibilités
        </Button>
    );
}

export function AvailabilityManager({ availabilities, updateAction }: AvailabilityManagerProps) {
    const { toast } = useToast();
    const [initialState, setInitialState] = React.useState({ success: false, error: null });

    const [state, formAction] = useFormState(updateAction, initialState);

    const [schedule, setSchedule] = React.useState(() => {
        const initialSchedule = new Map<number, { is_available: boolean; start_time: string; end_time: string }>();
        daysOfWeek.forEach(day => {
            const existing = availabilities.find(a => a.day_of_week === day.id);
            initialSchedule.set(day.id, {
                is_available: existing?.is_available ?? false,
                start_time: existing?.start_time || '09:00',
                end_time: existing?.end_time || '17:00'
            });
        });
        return initialSchedule;
    });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Succès', description: 'Vos disponibilités ont été mises à jour.' });
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Erreur', description: state.error });
        }
    }, [state, toast]);

    const handleSwitchChange = (dayId: number, checked: boolean) => {
        const newSchedule = new Map(schedule);
        newSchedule.get(dayId)!.is_available = checked;
        setSchedule(newSchedule);
    };

    const handleTimeChange = (dayId: number, type: 'start_time' | 'end_time', value: string) => {
        const newSchedule = new Map(schedule);
        newSchedule.get(dayId)![type] = value;
        setSchedule(newSchedule);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestion des Disponibilités</CardTitle>
                <CardDescription>
                    Définissez vos horaires de travail récurrents pour chaque jour de la semaine.
                    Les clients ne pourront prendre rendez-vous que dans ces créneaux.
                </CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                    {daysOfWeek.map(day => {
                        const s = schedule.get(day.id)!;
                        return (
                            <div key={day.id} className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-3">
                                <input type="hidden" name={`day_${day.id}_id`} value={day.id} />
                                <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                    <Switch
                                        id={`available_${day.id}`}
                                        name={`day_${day.id}_available`}
                                        checked={s.is_available}
                                        onCheckedChange={(checked) => handleSwitchChange(day.id, checked)}
                                    />
                                    <label htmlFor={`available_${day.id}`} className="text-lg font-medium w-24">{day.label}</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        name={`day_${day.id}_start`}
                                        value={s.start_time}
                                        onChange={(e) => handleTimeChange(day.id, 'start_time', e.target.value)}
                                        disabled={!s.is_available}
                                    />
                                    <span>-</span>
                                    <Input
                                        type="time"
                                        name={`day_${day.id}_end`}
                                        value={s.end_time}
                                        onChange={(e) => handleTimeChange(day.id, 'end_time', e.target.value)}
                                        disabled={!s.is_available}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}
