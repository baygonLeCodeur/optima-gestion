 // src/app/api/visits/route.ts
 import { NextResponse } from 'next/server';
 import { supabaseAdmin } from '@/lib/supabase/admin';
 import { createClient } from '@/lib/supabase/server';
 
 export async function POST(request: Request) {
   const supabase = supabaseAdmin;
   const body = await request.json();
 
      // --- CAS 1: L'utilisateur est connecté (formulaire de prise de RDV) ---
      if (body.client_id && body.scheduled_at) {
        const { property_id, agent_id, client_id, scheduled_at, client_notes } = body;
    
        // Vérification de sécurité minimale
        if (!property_id || !agent_id || !client_id || !scheduled_at) {
          return NextResponse.json({ error: 'Données manquantes pour créer la visite.' }, { status: 400 });
        }
    
        // On vérifie que l'utilisateur qui fait la requête est bien celui concerné
        const supabaseServer = await createClient(); // <-- CORRECTION ICI
        const { data: { user } } = await supabaseServer.auth.getUser();
        if (!user || user.id !== client_id) {
            return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 });
        }
    
        try {
          const { data, error } = await supabase
            .from('visits')
            .insert({
              property_id,
              agent_id,
              client_id,
              scheduled_at,
              client_notes,
              status: 'pending',
            })
            .select()
            .single();
    
          if (error) {
            console.error('Erreur Supabase (création visite):', error);
            throw error;
          }
    
          return NextResponse.json({ message: 'Visite enregistrée avec succès.', data }, { status: 201 });
    
        } catch (error: any) {
          return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
        }
      }
    
      // --- CAS 2: L'utilisateur n'est pas connecté (formulaire de contact/lead) ---
      const { name, email, phone, message, agentId, propertyId } = body;
    
      if (!name || !email || !agentId) {
        return NextResponse.json({ error: 'Champs requis manquants pour créer un prospect.' }, { status: 400 });
      }
    
      try {
        // On cherche si un lead avec cet email existe déjà
        const { data: existingLead, error: findError } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email)
          .maybeSingle();
    
        if (findError) throw findError;
    
        const leadData = {
          full_name: name,
          email: email,
          phone_number: phone, // Ajout du numéro de téléphone
          assigned_agent_id: agentId,
          interest: `Intérêt pour le bien ID: ${propertyId || 'non spécifié'}. Message: ${message || 'Aucun message.'}`,
          source: 'Agent Contact Form',
          status: 'new',
        };
    
        if (existingLead) {
          // Mettre à jour le lead existant
          const { error: updateError } = await supabase
            .from('leads')
            .update(leadData)
            .eq('id', existingLead.id);
          if (updateError) throw updateError;
        } else {
          // Créer un nouveau lead
          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadData);
          if (insertError) throw insertError;
        }
    
        return NextResponse.json({ message: 'Prospect enregistré avec succès.' }, { status: 200 });
    
      } catch (error: any) {
        console.error('Erreur Supabase (création lead):', error);
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
      }
    }