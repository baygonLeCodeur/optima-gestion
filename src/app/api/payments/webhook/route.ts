// src/app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialise un client Supabase pour le gestionnaire de route.
// Note : Nous utilisons le SERVICE_ROLE_KEY ici pour des mises à jour sécurisées de serveur à serveur.
// Cette clé contourne la sécurité au niveau des lignes (RLS) et doit rester secrète.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// C'est le Webhook CinetPay pour recevoir les mises à jour de statut de paiement.
export async function POST(req: Request) {
    let eventData;
    const rawBody = await req.text(); // Lire le corps brut pour la vérification de la signature

    try {
        eventData = JSON.parse(rawBody);
    } catch (error) {
        console.error('Erreur Webhook : JSON invalide', error);
        return NextResponse.json({ message: 'Charge utile JSON invalide' }, { status: 400 });
    }
    
    console.log('Webhook reçu :', JSON.stringify(eventData, null, 2));

    const CINETPAY_API_SECRET_KEY = process.env.CINETPAY_API_SECRET_KEY;
    const signature = req.headers.get('cpm-signature');

    // --- Contrôle de Sécurité : Vérifier la signature ---
    if (!CINETPAY_API_SECRET_KEY || !signature) {
       console.error("CRITIQUE : La clé secrète du webhook n'est pas configurée ou la signature est manquante.");
       return NextResponse.json({ message: 'Erreur de configuration.' }, { status: 500 });
    }

    const hash = crypto.createHmac('sha1', CINETPAY_API_SECRET_KEY).update(rawBody).digest('hex');
    
    if (hash !== signature) {
        console.error('Signature invalide.', { received: signature, computed: hash });
        return NextResponse.json({ message: 'Signature invalide.' }, { status: 401 });
    }
    
    console.log('Signature vérifiée avec succès.');

    try {
        const { cpm_trans_id, cpm_trans_status, cpm_amount, cpm_currency } = eventData;
        const transaction_id = cpm_trans_id;

        if (!transaction_id) {
            console.warn('Webhook reçu sans transaction_id', eventData);
            return NextResponse.json({ message: "L'ID de transaction est manquant." }, { status: 400 });
        }
        
        console.log(`Traitement du webhook pour transaction_id : ${transaction_id}`);

        // --- Vérification d'Idempotence ---
        const { data: existingPayment, error: fetchError } = await supabaseAdmin
            .from('payments')
            .select('id, status, client_id')
            .eq('transaction_id', transaction_id)
            .single();

        if (fetchError || !existingPayment) {
            console.error(`Webhook : Enregistrement de paiement non trouvé pour transaction_id : ${transaction_id}. Erreur : ${fetchError?.message}`);
            // Renvoyer 200 à CinetPay pour qu'il ne réessaie pas une transaction inexistante.
            return NextResponse.json({ message: 'Enregistrement de paiement non trouvé.' }, { status: 200 });
        }
        
        console.log(`Enregistrement de paiement existant trouvé. Statut actuel : ${existingPayment.status}`);

        // Si le paiement est déjà traité avec succès, ne pas le retraiter.
        if (existingPayment.status === 'succeeded') {
            console.log(`La transaction ${transaction_id} est déjà marquée comme 'succeeded'. Accusé de réception du webhook sans action.`);
            return NextResponse.json({ message: 'Webhook acquitté. Transaction déjà traitée.' });
        }

        let finalStatus: 'succeeded' | 'failed' | 'pending' = 'pending';
        if (cpm_trans_status === 'ACCEPTED') {
            finalStatus = 'succeeded';
        } else if (cpm_trans_status === 'REFUSED' || cpm_trans_status === 'CANCELED') {
            finalStatus = 'failed';
        } else {
            console.log(`Statut CinetPay non géré : ${cpm_trans_status}. Maintien du statut à 'pending'.`);
            return NextResponse.json({ message: 'Webhook acquitté. Statut non final.'});
        }
        
        console.log(`Mise à jour de la transaction ${transaction_id} au statut : ${finalStatus}`);

        // --- Mettre à jour l'enregistrement de paiement dans Supabase ---
        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({ status: finalStatus, updated_at: new Date().toISOString() })
            .eq('transaction_id', transaction_id);
            
        if (updateError) {
            console.error(`Webhook : Erreur de mise à jour Supabase pour la transaction ${transaction_id}`, updateError);
            // Renvoyer 500 pour que CinetPay puisse réessayer le webhook
            return NextResponse.json({ message: "Échec de la mise à jour de l'enregistrement de paiement." }, { status: 500 });
        }
        
        console.log(`Paiement ${transaction_id} mis à jour avec succès à ${finalStatus}`);
        
        // --- Actions Post-Paiement ---
        if (finalStatus === 'succeeded') {
            const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
                user_id: existingPayment.client_id,
                title: 'Paiement Réussi',
                message: `Votre paiement de ${cpm_amount} ${cpm_currency} a été approuvé.`,
                type: 'payment_success'
            });

            if (notificationError) {
                console.error(`Échec de la création de la notification pour l'utilisateur ${existingPayment.client_id} pour la transaction ${transaction_id}`, notificationError);
            } else {
                console.log(`Notification 'payment_success' créée avec succès pour l'utilisateur ${existingPayment.client_id}`);
            }
        }

        // --- Accuser réception à CinetPay ---
        return NextResponse.json({ message: 'Webhook traité avec succès' });

    } catch (error: any) {
        console.error('Erreur critique de traitement du webhook :', error);
        return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
    }
}
