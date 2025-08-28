// src/app/api/visits/route.ts
import { NextResponse } from 'next/server';
// On importe notre nouveau "Super Client"
import { supabaseAdmin } from '@/lib/supabase/admin';
// On importe aussi le client serveur standard pour vérifier si un utilisateur est connecté
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // On utilise le client admin qui a les droits pour outrepasser les RLS
  const supabase = supabaseAdmin;
  
  try {
    const body = await request.json();
  const { fullName, email, phone, message, propertyId, agentId, clientId } = body;

    if (!fullName || !email || !propertyId || !agentId) {
      return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 });
    }

    // --- LOGIQUE SIMPLIFIÉE : Créer ou mettre à jour un lead ---
    
    // 1. Chercher un prospect existant avec cet email
    let { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingLead) {
      // Mettre à jour le lead existant avec les nouvelles informations
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          full_name: fullName,
          phone_number: phone,
          interest: `Demande de visite pour le bien ID: ${propertyId}. Message: ${message || 'Aucun message'}`,
          assigned_agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du lead:', updateError);
        throw updateError;
      }
    } else {
      // Créer un nouveau lead
      const { error: newLeadError } = await supabase
        .from('leads')
        .insert({
          full_name: fullName,
          email: email,
          phone_number: phone,
          status: 'new',
          source: 'Visit Request Form',
          assigned_agent_id: agentId,
          interest: `Demande de visite pour le bien ID: ${propertyId}. Message: ${message || 'Aucun message'}`
        });
      
      if (newLeadError) {
        console.error('Erreur lors de la création du lead:', newLeadError);
        throw newLeadError;
      }
    }

    // 2. Retourner toujours un succès pour déclencher l'affichage du numéro
    // 3. Créer une entrée dans la table `visits` pour conserver une trace côté client
    try {
      const insertData: any = {
        property_id: propertyId,
        scheduled_at: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        visitor_count: 1,
        client_notes: message || null,
        agent_id: agentId || null
      };
      if (clientId) insertData.client_id = clientId;
      const { error: visitError } = await supabase.from('visits').insert(insertData);
      if (visitError) console.error('Erreur création visit:', visitError);
    } catch (e) {
      console.error('Erreur lors de l insertion dans visits:', e);
    }

    return NextResponse.json({ message: 'Votre demande de visite a été enregistrée avec succès.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/visits:', error);
    return NextResponse.json({ message: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 });
  }
}