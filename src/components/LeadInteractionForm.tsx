
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter la note
        </Button>
    );
}

type LeadInteractionFormProps = {
    addInteractionAction: (formData: FormData) => Promise<void>;
    updateStatusAction: (newStatus: string) => Promise<void>;
    currentStatus: string;
};

export function LeadInteractionForm({ addInteractionAction, updateStatusAction, currentStatus }: LeadInteractionFormProps) {
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [status, setStatus] = React.useState(currentStatus);

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        try {
            await updateStatusAction(newStatus);
            toast({ title: "Succès", description: "Le statut du lead a été mis à jour." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
            setStatus(currentStatus); // Revert on error
        }
    };

    return (
        <div className="space-y-4">
             <form
                ref={formRef}
                action={async (formData) => {
                    try {
                        await addInteractionAction(formData);
                        formRef.current?.reset();
                        toast({ title: 'Succès', description: 'Interaction ajoutée.' });
                    } catch (error: any) {
                        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
                    }
                }}
                className="space-y-4"
            >
                <Textarea
                    name="interaction"
                    placeholder="Ajoutez une note sur votre interaction avec le prospect (appel, email, etc.)..."
                    rows={4}
                    required
                />
                 <div className="flex justify-between items-center">
                    <SubmitButton />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Statut:</span>
                        <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Changer le statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nouveau">Nouveau</SelectItem>
                                <SelectItem value="en cours">En cours</SelectItem>
                                <SelectItem value="converti">Converti</SelectItem>
                                <SelectItem value="perdu">Perdu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </form>
        </div>
    );
}
