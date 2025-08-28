// supabase/functions/send-visit-reminders/index.ts
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2';

// Variables d'environnement
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL")!;

// Initialiser les clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

interface VisitData {
  id: string;
  visit_time: string;
  property: { title: string; address: string; }[];
  agent: { id: string; full_name: string; email: string; }[];
  client: { id: string; full_name: string; email: string; }[];
}

serve(async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const tomorrowEnd = tomorrow.toISOString().slice(0, 10) + 'T23:59:59.999Z';
    
    const { data: visits, error: visitsError } = await supabaseAdmin
        .from('visits')
        .select(`
            id,
            visit_time,
            property:properties ( title, address ),
            agent:users!visits_agent_id_fkey ( id, full_name, email ),
            client:users!visits_client_id_fkey ( id, full_name, email )
        `)
        .gte('visit_time', tomorrowStart)
        .lte('visit_time', tomorrowEnd)
        .eq('status', 'Confirmed');

    if (visitsError) throw new Error(`Erreur de récupération des visites: ${visitsError.message}`);
    if (!visits || visits.length === 0) {
        return new Response("OK - Aucune visite à notifier", { status: 200 });
    }

    for (const visit of visits as VisitData[]) {
        const property = visit.property[0];
        const agent = visit.agent[0];
        const client = visit.client[0];

        if (!property || !agent || !client) {
            console.warn(`Données incomplètes pour la visite ${visit.id}, rappel ignoré.`);
            continue;
        }

        const visitTime = new Date(visit.visit_time).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
        const notificationMessage = `Rappel de visite pour le bien "${property.title}" le ${visitTime}.`;

        await Promise.all([
            supabaseAdmin.from('notifications').insert({ user_id: agent.id, message: notificationMessage, type: 'visit_reminder' }),
            supabaseAdmin.from('notifications').insert({ user_id: client.id, message: notificationMessage, type: 'visit_reminder' }),
            resend.emails.send({
                from: `OPTIMA GESTION <${FROM_EMAIL}>`,
                to: agent.email,
                subject: `Rappel de votre visite de demain`,
                html: `<p>Bonjour ${agent.full_name},</p><p>Ceci est un rappel pour votre visite du bien <strong>${property.title}</strong>, prévue le <strong>${visitTime}</strong> à l'adresse : ${property.address}.</p>`
            }),
            resend.emails.send({
                from: `OPTIMA GESTION <${FROM_EMAIL}>`,
                to: client.email,
                subject: `Rappel de votre visite de demain`,
                html: `<p>Bonjour ${client.full_name},</p><p>Ceci est un rappel pour votre visite du bien <strong>${property.title}</strong> avec votre agent, prévue le <strong>${visitTime}</strong> à l'adresse : ${property.address}.</p>`
            })
        ]);
        
        console.log(`Rappels envoyés pour la visite ${visit.id}`);
    }

    return new Response(JSON.stringify({ message: `${visits.length} visites notifiées.` }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    const err = error as Error;
    console.error("Erreur dans la fonction de rappel:", err);
    return new Response(JSON.stringify({ error: err.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
    });
  }
});