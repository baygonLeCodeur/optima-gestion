'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, User, Mail, Phone, Home, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisitFeedbackForm } from './VisitFeedbackForm';
import { type VisitWithDetails } from '@/app/agent/calendar/page';
import { updateVisitStatusAction, rescheduleVisitAction, addVisitFeedbackAction } from '@/app/agent/calendar/actions';

type VisitDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  visit: VisitWithDetails;
};

export function VisitDetailsModal({ isOpen, onClose, visit }: VisitDetailsModalProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [view, setView] = React.useState<'details' | 'reschedule'>('details');
    const [newDate, setNewDate] = React.useState<Date | undefined>();

    const isPastVisit = new Date(visit.scheduled_at) < new Date();

    const handleUpdateStatus = async (newStatus: 'Confirmée' | 'Annulée') => {
        setIsUpdating(true);
        const result = await updateVisitStatusAction(visit.id, newStatus);
        if (result.success) {
            toast({ title: 'Succès', description: `La visite a été marquée comme "${newStatus}".` });
            onClose();
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        }
        setIsUpdating(false);
    };

    const handleReschedule = async () => {
        if (!newDate) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une nouvelle date.' });
            return;
        }
        setIsUpdating(true);
        const result = await rescheduleVisitAction(visit.id, newDate.toISOString());
        if (result.success) {
            toast({ title: 'Succès', description: `La visite a été reportée.` });
            onClose();
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        }
        setIsUpdating(false);
    };
    
    // Reset view on close
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setView('details'), 200);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                {view === 'details' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Détails de la Visite</DialogTitle>
                            <DialogDescription>
                                {format(new Date(visit.scheduled_at), 'PPPP à HH:mm', { locale: fr })}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="info">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="info">Informations</TabsTrigger>
                                <TabsTrigger value="feedback" disabled={!isPastVisit}>Feedback</TabsTrigger>
                            </TabsList>
                            <TabsContent value="info">
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center"><Home className="mr-3 h-5 w-5 text-muted-foreground" /><p className="font-semibold">{visit.properties.title}</p></div>
                                    <div className="flex items-center"><User className="mr-3 h-5 w-5 text-muted-foreground" /><p>{visit.users.full_name}</p></div>
                                    <div className="flex items-center"><Mail className="mr-3 h-5 w-5 text-muted-foreground" /><p>{visit.users.email}</p></div>
                                    <div className="flex items-center"><Phone className="mr-3 h-5 w-5 text-muted-foreground" /><p>{visit.users.phone_number || 'N/A'}</p></div>
                                    <div className="flex items-center"><CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" /><p className="font-semibold">Statut: {visit.status}</p></div>
                                </div>
                            </TabsContent>
                            <TabsContent value="feedback">
                                <VisitFeedbackForm visit={visit} feedbackAction={addVisitFeedbackAction.bind(null, visit.id)} onClose={onClose} />
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                            {isUpdating ? <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</Button> : (
                                <>
                                    <Button variant="destructive" onClick={() => handleUpdateStatus('Annulée')}>Annuler</Button>
                                    <Button variant="outline" onClick={() => setView('reschedule')}>Reporter</Button>
                                    <Button onClick={() => handleUpdateStatus('Confirmée')}>Confirmer</Button>
                                </>
                            )}
                        </DialogFooter>
                    </>
                ) : ( // View === 'reschedule'
                    <>
                        <DialogHeader><DialogTitle>Reporter la Visite</DialogTitle></DialogHeader>
                        <div className="flex justify-center py-4">
                            <Calendar mode="single" selected={newDate} onSelect={setNewDate} className="rounded-md border" />
                        </div>
                        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                             <Button variant="ghost" onClick={() => setView('details')}>Retour</Button>
                             <Button onClick={handleReschedule} disabled={!newDate || isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Valider la nouvelle date
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
