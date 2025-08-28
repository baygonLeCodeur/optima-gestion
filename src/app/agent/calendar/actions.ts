'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Tables } from '@/types/supabase';

async function getSupabaseAndSession() {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Non autorisé : session invalide.");
    return { supabase, session };
};

export async function updateVisitStatusAction(visitId: string, newStatus: 'Confirmée' | 'Annulée' | 'Reportée'): Promise<{ success: boolean; error?: string }> {
    const { supabase, session } = await getSupabaseAndSession();
    const { error } = await supabase.from('visits').update({ status: newStatus }).eq('id', visitId).eq('agent_id', session.user.id);
    if (error) { console.error("Erreur (maj visite):", error); return { success: false, error: "La mise à jour de la visite a échoué." }; }
    revalidatePath('/agent/calendar');
    return { success: true };
}

export async function updateAvailabilitiesAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string | null }> {
    const { supabase, session } = await getSupabaseAndSession();
    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const availabilitiesToUpsert = daysOfWeek.map(dayId => ({ agent_id: session.user.id, day_of_week: dayId, is_available: formData.get(`day_${dayId}_available`) === 'on', start_time: formData.get(`day_${dayId}_start`) as string, end_time: formData.get(`day_${dayId}_end`) as string }));
    const { error } = await supabase.from('agent_availabilities').upsert(availabilitiesToUpsert, { onConflict: 'agent_id, day_of_week' });
    if (error) { console.error("Erreur (maj disponibilités):", error); return { success: false, error: "La mise à jour des disponibilités a échoué." }; }
    revalidatePath('/agent/calendar');
    return { success: true, error: null };
}

export async function rescheduleVisitAction(visitId: string, newDate: string): Promise<{ success: boolean; error?: string }> {
    const { supabase, session } = await getSupabaseAndSession();
    if (!newDate) return { success: false, error: "La nouvelle date est invalide." };
    const { error } = await supabase.from('visits').update({ scheduled_at: newDate, status: 'En attente' }).eq('id', visitId).eq('agent_id', session.user.id);
    if (error) { console.error("Erreur (report visite):", error); return { success: false, error: "Le report de la visite a échoué." }; }
    revalidatePath('/agent/calendar');
    return { success: true };
}

export async function addVisitFeedbackAction(visitId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    const { supabase, session } = await getSupabaseAndSession();
    const feedbackData = { feedback_rating: Number(formData.get('rating')), feedback_comment: formData.get('client_feedback') as string, agent_notes: formData.get('agent_notes') as string };
    const { error } = await supabase.from('visits').update(feedbackData).eq('id', visitId).eq('agent_id', session.user.id);
    if (error) { console.error("Erreur (feedback visite):", error); return { success: false, error: "L'ajout du feedback a échoué." }; }
    revalidatePath('/agent/calendar');
    return { success: true };
}
