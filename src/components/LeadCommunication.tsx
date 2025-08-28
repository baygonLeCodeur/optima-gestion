// src/components/LeadCommunication.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EmailComposer } from '@/components/EmailComposer';
import { MessageCircle, Mail } from 'lucide-react';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';

type Lead = Tables<'leads'>;

interface LeadCommunicationProps {
  lead: Lead;
  onSendEmail: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onLogWhatsApp: () => Promise<{ success: boolean; error?: string }>;
}

export function LeadCommunication({ lead, onSendEmail, onLogWhatsApp }: LeadCommunicationProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleWhatsAppClick = () => {
    if (!lead.phone_number) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Ce lead n'a pas de numéro de téléphone." });
        return;
    }
    
    window.open(`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`, '_blank');
    
    startTransition(async () => {
        const result = await onLogWhatsApp();
        if (result.success) {
            toast({ title: 'Succès', description: 'La tentative de contact via WhatsApp a été enregistrée.' });
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        }
    });
  };

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
      </TabsList>
      <TabsContent value="email">
        <div className="p-4 border rounded-lg text-center space-y-4">
            <p className="text-sm text-muted-foreground">
                Cliquez pour rédiger un email à <strong>{lead.full_name}</strong>. L'envoi sera enregistré dans l'historique.
            </p>
            {/* Correction: Ajout des props manquantes `leadName` et `children` */}
            <EmailComposer
                leadName={lead.full_name || 'Prospect'}
                leadEmail={lead.email || ''}
                sendEmailAction={onSendEmail}
            >
                <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Rédiger un Email
                </Button>
            </EmailComposer>
        </div>
      </TabsContent>
      <TabsContent value="whatsapp">
          <div className="p-4 border rounded-lg text-center space-y-4">
            <p className="text-sm text-muted-foreground">
                Cliquez pour démarrer une conversation avec <strong>{lead.full_name}</strong> sur WhatsApp et enregistrer cette action dans l'historique.
            </p>
            <Button onClick={handleWhatsAppClick} disabled={isPending || !lead.phone_number}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Contacter via WhatsApp
            </Button>
          </div>
      </TabsContent>
    </Tabs>
  );
}
