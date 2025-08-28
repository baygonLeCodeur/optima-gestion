
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type AddTaskFormProps = {
  createTaskAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  children: React.ReactNode;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter la tâche
        </Button>
    );
}

export function AddTaskForm({ createTaskAction, children }: AddTaskFormProps) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);
    const [date, setDate] = React.useState<Date | undefined>();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
                    <DialogDescription>
                        Planifiez un rappel ou une action à effectuer pour ce prospect.
                    </DialogDescription>
                </DialogHeader>
                <form
                    ref={formRef}
                    action={async (formData) => {
                        if (!date) {
                            toast({
                                variant: "destructive",
                                title: 'Erreur',
                                description: "Veuillez sélectionner une date d'échéance."
                            });
                            return;
                        }
                        formData.append('due_date', date.toISOString());
                        
                        const result = await createTaskAction(formData);
                        if (result.success) {
                            toast({ title: 'Succès', description: 'La tâche a été ajoutée.' });
                            formRef.current?.reset();
                            setDate(undefined);
                            setOpen(false);
                        } else {
                            toast({ variant: 'destructive', title: 'Erreur', description: result.error });
                        }
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">Titre de la tâche</label>
                        <Input id="title" name="title" placeholder="Ex: Rappeler pour la visite..." required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
