// src/components/PandaDocSigningModal.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

// Déclare l'objet global pandadoc pour TypeScript
declare global {
  interface Window {
    pandadoc: any;
  }
}

interface PandaDocSigningModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSigned: () => void; // Callback pour rafraîchir le composant parent
}

export const PandaDocSigningModal = ({
  documentId,
  isOpen,
  onClose,
  onSigned,
}: PandaDocSigningModalProps) => {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pandaDocContainerRef = useRef<HTMLDivElement>(null);

  // Étape 1: Récupérer l'ID de session quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && documentId) {
      setSessionId(null);
      setError(null);
      setLoading(true);
      
      const fetchSession = async () => {
        try {
          const response = await fetch(`/api/documents/${documentId}/sign`, {
            method: 'POST',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Impossible de démarrer la session de signature.');
          }

          const data = await response.json();
          if (data.sessionId) {
            setSessionId(data.sessionId);
          } else {
            throw new Error('ID de session manquant dans la réponse du serveur.');
          }
        } catch (err: any) {
          setError(err.message);
          toast({
            title: 'Erreur de communication',
            description: err.message,
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };

      fetchSession();
    }
  }, [isOpen, documentId, toast]);


  // Étape 2: Initialiser l'iframe PandaDoc une fois l'ID de session obtenu
  useEffect(() => {
    if (sessionId && pandaDocContainerRef.current && typeof window !== 'undefined' && window.pandadoc) {
        // S'assurer que le conteneur est vide avant de l'initialiser
        pandaDocContainerRef.current.innerHTML = '';

        window.pandadoc.init({
            id: sessionId,
            container: pandaDocContainerRef.current,
            width: '100%',
            height: '600px',
            events: {
                onLoaded: () => console.log('Document PandaDoc chargé pour signature.'),
                onSigned: (data: any) => {
                    toast({
                        title: 'Succès !',
                        description: 'Le document a été signé avec succès.',
                        className: 'bg-green-500 text-white',
                    });
                    onSigned(); // Déclenche le rafraîchissement
                    onClose();  // Ferme le modal
                },
                onDeclined: () => {
                    toast({
                        title: 'Processus annulé',
                        description: 'Le processus de signature a été refusé.',
                        variant: 'destructive',
                    });
                    onClose();
                },
                onError: (error: any) => {
                    console.error("Erreur dans l'iframe PandaDoc:", error);
                    setError('Une erreur est survenue dans le module de signature.');
                     toast({
                        title: 'Erreur de signature',
                        description: 'Une erreur interne est survenue. Veuillez réessayer.',
                        variant: 'destructive',
                    });
                }
            }
        });
    }

  }, [sessionId, onSigned, onClose, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[720px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Signature du Document</DialogTitle>
          <DialogDescription>
            Veuillez vérifier le document ci-dessous et suivre les instructions pour le signer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow mt-4">
            {loading && (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-[550px] w-full" />
                </div>
            )}
            {error && <div className="text-red-600 bg-red-100 p-4 rounded-md font-semibold">{error}</div>}
            
            {/* Le conteneur pour l'iframe de PandaDoc */}
            {!loading && !error && (
                <div ref={pandaDocContainerRef} id="pandadoc-container" className="h-full w-full"></div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
