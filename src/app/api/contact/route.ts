// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
// On importe notre "Super Client" qui a les droits d'administrateur
import { supabaseAdmin } from '@/lib/supabase/admin';

// Initialiser Resend avec la clé API depuis les variables d'environnement
const resend = new Resend(process.env.RESEND_API_KEY);
// L'email de l'expéditeur doit être un domaine vérifié sur Resend
const fromEmail = process.env.RESEND_FROM_EMAIL;
// L'email qui reçoit la notification (l'email de l'agent ou d'un admin)
const toEmail = process.env.ADMIN_EMAIL; // Assurez-vous que cette variable est définie

export async function POST(req: Request) {
  // On utilise le client admin pour toutes les opérations de base de données
  const supabase = supabaseAdmin;

  try {
    const body = await req.json();
    // On récupère l'ID de l'agent depuis le corps de la requête
    const { name, email, message, agentId } = body;

    // --- 1. Validation des données ---
    if (!name || !email || !message || !agentId) {
      return NextResponse.json({ error: 'Tous les champs sont requis, y compris l\'ID de l\'agent.' }, { status: 400 });
    }

    // --- 2. Insertion dans la base de données Supabase ---
    // La politique RLS est outrepassée grâce au client admin.
    const { data: leadData, error: dbError } = await supabase
      .from('leads')
      .insert({
        full_name: name,
        email: email,
        interest: message,
        source: 'Website Contact Form',
        status: 'new',
        // On assigne directement le prospect à l'agent concerné
        assigned_agent_id: agentId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erreur Supabase lors de la création du lead:', dbError);
      return NextResponse.json({ error: "L'enregistrement de votre message a échoué." }, { status: 500 });
    }

    // --- 3. Envoi de l'e-mail de notification via Resend (OPTIONNEL) ---
    // Vérifier si les variables d'environnement email sont configurées
    if (fromEmail && toEmail && process.env.RESEND_API_KEY) {
      try {
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: toEmail, // On envoie l'email à l'adresse de l'administrateur/agence
          subject: `Nouveau message pour un agent : ${name}`,
          replyTo: email,
          html: `
            <h1>Nouveau message depuis le formulaire de contact d'un bien</h1>
            <p>Un visiteur a envoyé un message à un agent.</p>
            <hr>
            <p><strong>Nom du visiteur :</strong> ${name}</p>
            <p><strong>Email du visiteur :</strong> ${email}</p>
            <p><strong>Message :</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
            <hr>
            <p>Ce prospect a été automatiquement créé et assigné à l'agent concerné dans votre tableau de bord.</p>
            <p><strong>ID du prospect :</strong> ${leadData.id}</p>
            <p><strong>ID de l'agent assigné :</strong> ${agentId}</p>
          `,
        });

        if (emailError) {
          console.error('Erreur Resend (non bloquante):', emailError);
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi d\'email (non bloquante):', emailError);
      }
    } else {
      console.log('Configuration email incomplète - email non envoyé (mais lead sauvegardé)');
    }

    return NextResponse.json({ message: 'Votre message a été envoyé avec succès.' }, { status: 200 });

  } catch (error) {
    console.error('Erreur interne dans /api/contact:', error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}