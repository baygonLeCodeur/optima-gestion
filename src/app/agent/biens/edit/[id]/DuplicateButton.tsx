// src/app/agent/biens/edit/[id]/DuplicateButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DuplicateButtonProps {
  onDuplicate: () => Promise<void>;
}

export function DuplicateButton({ onDuplicate }: DuplicateButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await onDuplicate();
        toast({
          title: 'Succès',
          description: "Le bien a été dupliqué. Vous êtes sur la page de la nouvelle annonce.",
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message || "La duplication a échoué.",
        });
      }
    });
  };

  return (
    <Button onClick={handleDuplicate} disabled={isPending} variant="outline">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      Dupliquer
    </Button>
  );
}
