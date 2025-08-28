
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type Tables } from '@/types/supabase';
import { Star } from 'lucide-react';

type Visit = Tables<'visits'>;

type VisitFeedbackFormProps = {
    visit: Visit;
    feedbackAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
    onClose: () => void;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer le Feedback
        </Button>
    );
}

function StarRating({ rating, setRating }: { rating: number, setRating: (r: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`cursor-pointer ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    );
}

export function VisitFeedbackForm({ visit, feedbackAction, onClose }: VisitFeedbackFormProps) {
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [rating, setRating] = React.useState(visit.feedback_rating || 0);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                formData.append('rating', String(rating));
                const result = await feedbackAction(formData);
                if (result.success) {
                    toast({ title: 'Succès', description: 'Le feedback a été enregistré.' });
                    onClose();
                } else {
                    toast({ variant: 'destructive', title: 'Erreur', description: result.error });
                }
            }}
            className="space-y-4 pt-4"
        >
            <div>
                <Label>Note d'intérêt du client</Label>
                <StarRating rating={rating} setRating={setRating} />
            </div>

            <div>
                <Label htmlFor="client_feedback">Commentaires du client</Label>
                <Textarea
                    id="client_feedback"
                    name="client_feedback"
                    defaultValue={visit.feedback_comment || ''}
                    placeholder="Qu'a dit le client sur le bien ? Ses impressions, ses objections..."
                />
            </div>
            <div>
                <Label htmlFor="agent_notes">Vos notes privées</Label>
                <Textarea
                    id="agent_notes"
                    name="agent_notes"
                    defaultValue={visit.agent_notes || ''}
                    placeholder="Vos propres observations, prochaines étapes, etc."
                />
            </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    );
}
