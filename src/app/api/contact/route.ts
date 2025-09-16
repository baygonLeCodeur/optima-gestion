// src/app/api/contact/route.ts //
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
  // Vérification des variables d'environnement critiques au début
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Variables d\'environnement Supabase manquantes');
    return NextResponse.json({ 
      error: 'Configuration serveur incomplète' 
    }, { status: 500 });
  }

  // On utilise le client admin pour toutes les opérations de base de données
  const supabase = supabaseAdmin;

  try {
    // Validation du Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ 
        error: 'Content-Type doit être application/json' 
      }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return NextResponse.json({ 
        error: 'Format JSON invalide' 
      }, { status: 400 });
    }

    // On récupère l'ID de l'agent depuis le corps de la requête
    const { name, email, message, agentId } = body;

    // --- 1. Validation des données renforcée ---
    const validationErrors: string[] = [];
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      validationErrors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!email || typeof email !== 'string') {
      validationErrors.push('L\'email est requis');
    } else {
      // Validation basique de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push('Format d\'email invalide');
      }
    }
    
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      validationErrors.push('Le message doit contenir au moins 10 caractères');
    }
    
    if (!agentId || typeof agentId !== 'string') {
      validationErrors.push('L\'ID de l\'agent est requis');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validationErrors 
      }, { status: 400 });
    }

    // --- 2. Vérification que l'agent existe ---
    const { data: agentData, error: agentError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', agentId)
      .eq('role', 'agent')
      .single();

    if (agentError || !agentData) {
      console.error('Agent non trouvé:', agentError);
      return NextResponse.json({ 
        error: 'Agent non trouvé' 
      }, { status: 404 });
    }

    // --- 3. Insertion dans la base de données Supabase ---
    // La politique RLS est outrepassée grâce au client admin.
    const { data: leadData, error: dbError } = await supabase
      .from('leads')
      .insert({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        interest: message.trim(),
        source: 'Website Contact Form',
        status: 'new',
        // On assigne directement le prospect à l'agent concerné
        assigned_agent_id: agentId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erreur Supabase lors de la création du lead:', dbError);
      
      // Gestion spécifique des erreurs courantes
      if (dbError.code === '23505') { // Violation de contrainte unique
        return NextResponse.json({ 
          error: 'Un contact avec cet email existe déjà' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: "L'enregistrement de votre message a échoué." 
      }, { status: 500 });
    }

    // --- 4. Envoi de l'e-mail de notification via Resend (OPTIONNEL) ---
    let emailSent = false;
    
    // Vérifier si les variables d'environnement email sont configurées
    if (fromEmail && toEmail && process.env.RESEND_API_KEY) {
      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: [toEmail], // Utiliser un tableau pour plus de robustesse
          subject: `Nouveau message pour ${agentData.full_name || 'un agent'} : ${name}`,
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
            <p><strong>Agent assigné :</strong> ${agentData.full_name || 'N/A'} (${agentData.email})</p>
            <p><strong>ID du prospect :</strong> ${leadData.id}</p>
            <p><strong>ID de l'agent assigné :</strong> ${agentId}</p>
            <hr>
            <p>Ce prospect a été automatiquement créé et assigné à l'agent concerné dans votre tableau de bord.</p>
          `,
        });

        if (emailError) {
          console.error('Erreur Resend (non bloquante):', emailError);
        } else {
          emailSent = true;
          console.log('Email envoyé avec succès:', emailData?.id);
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi d\'email (non bloquante):', emailError);
      }
    } else {
      console.log('Configuration email incomplète - email non envoyé (mais lead sauvegardé)');
    }

    return NextResponse.json({ 
      message: 'Votre message a été envoyé avec succès.',
      leadId: leadData.id,
      emailSent: emailSent
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur interne dans /api/contact:', error);
    
    // Log plus détaillé pour le débogage
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Une erreur interne est survenue.' 
    }, { status: 500 });
  }
}