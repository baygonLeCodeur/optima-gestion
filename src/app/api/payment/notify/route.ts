// app/api/payment/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import cinetPayService from '@/lib/cinetpay';
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase Admin pour les opérations serveur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();
    
    const transactionId = notification.cpm_trans_id;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transaction manquant' }, { status: 400 });
    }
    
    const verificationResult = await cinetPayService.verifyTransaction(transactionId);

    if (verificationResult.code === '00' && verificationResult.data?.status === 'ACCEPTED') {
      console.log(`Paiement confirmé pour la transaction ${transactionId}.`);
      
      // Le paiement est confirmé. Mettons à jour la base de données.
      const { data: deposit, error: fetchError } = await supabaseAdmin
        .from('funds_deposit')
        .select('agent_id, amount')
        .eq('transaction_id', transactionId)
        .single();

      if (fetchError || !deposit) {
        console.error('Erreur de recherche de la transaction ou transaction non trouvée:', fetchError);
        // On répond succès à CinetPay pour éviter les renvois, mais on log l'erreur.
        return NextResponse.json({ status: 'success' });
      }

      // 1. Mettre à jour le statut du dépôt
      const { error: updateDepositError } = await supabaseAdmin
        .from('funds_deposit')
        .update({ status: 'SUCCESSFUL' })
        .eq('transaction_id', transactionId);

      if (updateDepositError) {
        console.error('Erreur de mise à jour du statut du dépôt:', updateDepositError);
        return NextResponse.json({ status: 'success' }); // Log & Ack
      }

      // 2. Mettre à jour le portefeuille de l'agent (logique déplacée du trigger)
      // Le trigger `update_wallet_on_deposit` devrait gérer cela, mais on peut le faire ici par sécurité.
      // On s'assure que le trigger a bien fonctionné en vérifiant le solde.
      // Pour cet exemple, on fait confiance au trigger qui est déjà en place.

    } else {
      console.warn(`La vérification pour ${transactionId} a échoué ou le paiement n'est pas accepté. Statut: ${verificationResult.data?.status || 'INCONNU'}`);
      
      // Mettre à jour le statut en 'FAILED' dans la base de données
      const { error: updateError } = await supabaseAdmin
        .from('funds_deposit')
        .update({ status: 'FAILED' })
        .eq('transaction_id', transactionId);
        
      if (updateError) {
        console.error('Erreur de mise à jour du statut FAILED du dépôt:', updateError);
      }
    }
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[NOTIFY_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Échec du traitement de la notification' }, { status: 500 });
  }
}