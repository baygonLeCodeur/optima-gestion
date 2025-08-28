
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

type EmailComposerProps = {
    leadName: string;
    leadEmail: string;
    sendEmailAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
    children: React.ReactNode;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer l'Email
        </Button>
    );
}

export function EmailComposer({ leadName, leadEmail, sendEmailAction, children }: EmailComposerProps) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Contacter {leadName}</DialogTitle>
                    <DialogDescription>
                        Cet email sera envoyé à {leadEmail}. Une copie sera sauvegardée dans l'historique du prospect.
                    </DialogDescription>
                </DialogHeader>
                <form
                    ref={formRef}
                    action={async (formData) => {
                        const result = await sendEmailAction(formData);
                        if (result.success) {
                            toast({ title: 'Succès', description: 'Votre email a été envoyé.' });
                            setOpen(false);
                            formRef.current?.reset();
                        } else {
                            toast({ variant: 'destructive', title: 'Erreur', description: result.error });
                        }
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="to" value={leadEmail} />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">Sujet</Label>
                            <Input id="subject" name="subject" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="body" className="text-right">Message</Label>
                            <Textarea id="body" name="body" className="col-span-3" rows={8} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
