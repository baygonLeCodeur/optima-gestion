import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Utiliser les variables d'environnement pour le client Supabase côté serveur
// car ce webhook est appelé par un service externe (Mockoon) et n'a pas de session utilisateur.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Schéma de validation pour le corps du webhook (simulant CinetPay)
const webhookPayloadSchema = z.object({
  transaction_id: z.string(),
  status: z.enum(['completed', 'failed']), // Simuler les statuts possibles
});

export async function POST(request: Request) {
  try {
    // 1. Valider le corps de la requête du webhook
    const body = await request.json();
    const validation = webhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Payload du webhook invalide', details: validation.error.format() }, { status: 400 });
    }
    
    const { transaction_id, status } = validation.data;

    // 2. Trouver le dépôt correspondant dans la base de données
    const { data: deposit, error: findError } = await supabaseAdmin
      .from('funds_deposit')
      .select('id, status')
      .eq('cinetpay_transaction_id', transaction_id)
      .single();

    if (findError || !deposit) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    // 3. Vérifier si le dépôt est déjà traité pour éviter les doublons
    if (deposit.status !== 'pending') {
      return NextResponse.json({ message: 'Webhook déjà traité.' });
    }

    // 4. Mettre à jour le statut du dépôt
    // Le trigger `on_deposit_complete_update_wallet` s'exécutera automatiquement
    // si le nouveau statut est 'completed'.
    const { error: updateError } = await supabaseAdmin
      .from('funds_deposit')
      .update({ 
        status: status,
        payment_date: new Date().toISOString(), // Enregistrer la date de paiement
        webhook_data: body // Sauvegarder le payload complet du webhook
      })
      .eq('id', deposit.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du dépôt:', updateError);
      return NextResponse.json({ error: 'Impossible de mettre à jour le statut du dépôt.' }, { status: 500 });
    }

    // 5. Répondre avec succès
    return NextResponse.json({ message: 'Webhook reçu et traité avec succès.' });

  } catch (error) {
    console.error('Erreur inattendue dans /api/payment/webhook:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
