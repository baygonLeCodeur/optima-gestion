
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Resend } from 'resend';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, UserCheck } from 'lucide-react';
import { LeadInteractionForm } from '@/components/LeadInteractionForm';
import { LeadHistory } from '@/components/LeadHistory';
import { LeadCommunication } from '@/components/LeadCommunication';
import { AddTaskForm } from '@/components/AddTaskForm';
import { AgentTasksList, type AgentTask } from '@/components/AgentTasksList';
import { Tables } from '@/types/supabase';
import { ConvertLeadButton } from './ConvertLeadButton'; // 1. Préparer l'import du nouveau composant

export type Lead = Tables<'leads'>;
export type Interaction = Tables<'communications'>;

// --- SERVER ACTIONS ---
async function getSupabaseAndSession() {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Non autorisé : session ou utilisateur manquant.");
    return { supabase, session };
};

// ... (actions existantes)

export async function addLeadInteractionAction(leadId: string, formData: FormData) { /* ... */ }
export async function updateLeadStatusAction(leadId: string, newStatus: string) { /* ... */ }
export async function sendEmailAction(leadId: string, agentName: string, formData: FormData): Promise<{ success: boolean, error?: string }> { /* ... */ return { success: true }; }
export async function logWhatsAppAction(leadId: string, leadName: string): Promise<{ success: boolean; error?: string }> { /* ... */ return { success: true }; }
export async function createTaskAction(leadId: string, formData: FormData): Promise<{ success: boolean; error?: string }> { /* ... */ return { success: true }; }
export async function updateTaskAction(taskId: string, isCompleted: boolean): Promise<{ success: boolean; error?: string }> { /* ... */ return { success: true }; }
export async function deleteTaskAction(taskId: string): Promise<{ success: boolean; error?: string }> { /* ... */ return { success: true }; }

// 2. Créer la nouvelle Server Action pour la conversion
export async function convertLeadToClientAction(leadId: string): Promise<{ success: boolean; error?: string; }> {
    'use server';
    const { supabase, session } = await getSupabaseAndSession();

    // Pour l'instant, nous mettons à jour le statut.
    // Plus tard, on pourrait aussi créer un compte utilisateur ici.
    const { error } = await supabase
        .from('leads')
        .update({
            status: 'Converted',
            conversion_date: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('assigned_agent_id', session.user.id);

    if (error) {
        console.error("Erreur de conversion du lead:", error);
        return { success: false, error: "La conversion du lead a échoué." };
    }

    revalidatePath(`/agent/leads/${leadId}`);
    revalidatePath('/agent/leads');
    return { success: true };
}


// --- DATA FETCHING ---
async function getLeadDetailsAndTasks(supabase: SupabaseClient, leadId: string, agentId: string) {
    const leadPromise = supabase.from('leads').select('*').eq('id', leadId).eq('assigned_agent_id', agentId).single();
    const interactionsPromise = supabase.from('communications').select('id, created_at, type, body, sender_id, subject').eq('lead_id', leadId).order('created_at', { ascending: false });
    const tasksPromise = supabase.from('agent_tasks').select('id, title, due_date, is_completed').eq('lead_id', leadId).order('due_date', { ascending: true });
    const [ {data: lead, error: leadError}, {data: interactions, error: interactionsError}, {data: tasks, error: tasksError} ] = await Promise.all([leadPromise, interactionsPromise, tasksPromise]);
    if (leadError || !lead) notFound();
    if (interactionsError) console.error("Erreur (interactions):", interactionsError.message);
    if (tasksError) console.error("Erreur (tâches):", tasksError.message);
    return { lead, interactions: (interactions as Interaction[]) || [], tasks: (tasks as AgentTask[]) || [] };
}

// --- PAGE COMPONENT ---
export default async function LeadDetailPage({ params }: { params: { id: string } }) {
    const { supabase, session } = await getSupabaseAndSession();
    const { lead, interactions, tasks } = await getLeadDetailsAndTasks(supabase, params.id, session.user.id);
    
    const createTask = createTaskAction.bind(null, lead.id);
    const addInteraction = addLeadInteractionAction.bind(null, lead.id);
    const updateStatus = updateLeadStatusAction.bind(null, lead.id);
    const sendEmail = sendEmailAction.bind(null, lead.id, session.user.user_metadata.full_name || 'Votre Agent');
    const logWhatsApp = logWhatsAppAction.bind(null, lead.id, lead.name || 'ce lead');
    const convertLead = convertLeadToClientAction.bind(null, lead.id); // 3. Pré-configurer l'action

    return (
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <Link href="/agent/leads" className="flex items-center text-sm text-muted-foreground hover:underline mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste des leads</Link>
            
            <div className="grid gap-6 md:grid-cols-3">
                
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">{lead.name || 'Prospect'}</h2>
                                <div className="flex items-center gap-2 pt-1"><Badge>{lead.status}</Badge><span className="text-sm text-muted-foreground">Source: {lead.source || 'N/A'}</span></div>
                            </div>
                            {/* 4. Intégrer le bouton (s'il n'est pas déjà converti) */}
                            {lead.status !== 'Converted' && (
                                <ConvertLeadButton onConvert={convertLead} />
                            )}
                        </CardHeader>
                        <CardContent>
                            <LeadInteractionForm addInteractionAction={addInteraction} updateStatusAction={updateStatus} currentStatus={lead.status} />
                        </CardContent>
                    </Card>

                    <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold pt-2">Tâches et Rappels</h3>
                        <AddTaskForm createTaskAction={createTask}><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button></AddTaskForm>
                    </div>
                    <AgentTasksList tasks={tasks} updateTaskAction={updateTaskAction} deleteTaskAction={deleteTaskAction} />
                    
                    <LeadHistory interactions={interactions} />
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Communication</CardTitle></CardHeader>
                        <CardContent>
                            <LeadCommunication lead={lead} onSendEmail={sendEmail} onLogWhatsApp={logWhatsApp} />
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader><CardTitle>Informations du Lead</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm"><strong>Email:</strong> {lead.email || 'N/A'}</div>
                            <div className="text-sm"><strong>Téléphone:</strong> {lead.phone_number || 'N/A'}</div>
                            <div className="text-sm"><strong>Intérêt:</strong> {lead.interest || 'N/A'}</div>
                            <div className="text-sm"><strong>Créé le:</strong> {lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR') : 'N/A'}</div>
                            {lead.conversion_date && (<div className="text-sm font-semibold text-green-600"><strong>Converti le:</strong> {new Date(lead.conversion_date).toLocaleDateString('fr-FR')}</div>)}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </main>
    );
}
