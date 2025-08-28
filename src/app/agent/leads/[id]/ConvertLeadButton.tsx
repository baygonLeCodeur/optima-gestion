// src/app/agent/leads/[id]/ConvertLeadButton.tsx
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Loader2 } from 'lucide-react';

interface ConvertLeadButtonProps {
    onConvert: () => Promise<{ success: boolean; error?: string }>;
}

export function ConvertLeadButton({ onConvert }: ConvertLeadButtonProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleConvert = () => {
        startTransition(async () => {
            const result = await onConvert();
            if (result.success) {
                toast({
                    title: 'Succès',
                    description: 'Le prospect a été marqué comme converti.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: result.error || "La conversion a échoué.",
                });
            }
        });
    };

    return (
        <Button onClick={handleConvert} disabled={isPending} variant="secondary">
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <UserCheck className="mr-2 h-4 w-4" />
            )}
            Convertir en Client
        </Button>
    );
}
