import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Schema de validation pour les données de la requête
const depositRequestSchema = z.object({
  amount: z.number().positive('Le montant doit être positif.'),
  payment_method: z.string().min(1, 'La méthode de paiement est requise.'),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    // 1. Récupérer et valider les données de la requête
    const body = await request.json();
    const validation = depositRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Données invalides', details: validation.error.format() }, { status: 400 });
    }
    const { amount, payment_method } = validation.data;

    // 2. Vérifier l'authentification de l'utilisateur (agent)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    // 3. Récupérer ou créer le portefeuille de l'agent
    let { data: wallet, error: walletError } = await supabase
      .from('agent_wallets')
      .select('id')
      .eq('agent_id', user.id)
      .single();

    // Si le portefeuille n'existe pas, le créer
    if (walletError || !wallet) {
        const { data: newWallet, error: newWalletError } = await supabase
            .from('agent_wallets')
            .insert({ agent_id: user.id, balance: 0 })
            .select('id')
            .single();

        if (newWalletError) {
            console.error('Erreur lors de la création du portefeuille:', newWalletError);
            return NextResponse.json({ error: "Impossible de créer le portefeuille de l'agent." }, { status: 500 });
        }
        wallet = newWallet;
    }

    // 4. Créer l'enregistrement du dépôt en attente
    const { data: deposit, error: depositError } = await supabase
      .from('funds_deposit')
      .insert({
        agent_id: user.id,
        wallet_id: wallet.id,
        amount,
        payment_method,
        status: 'pending',
        // Simuler un ID de transaction unique pour le suivi
        cinetpay_transaction_id: `MOCK_${Date.now()}` 
      })
      .select()
      .single();

    if (depositError) {
      console.error('Erreur lors de la création du dépôt:', depositError);
      return NextResponse.json({ error: "Impossible d'enregistrer la tentative de dépôt." }, { status: 500 });
    }

    // 5. Retourner les informations du dépôt
    // Dans un cas réel, on retournerait une URL de paiement de CinetPay.
    // Ici, nous retournons les détails pour que le client puisse simuler l'étape suivante.
    return NextResponse.json({
      message: 'Dépôt initié avec succès.',
      deposit,
      // URL de paiement simulée que nous utiliserons avec Mockoon
      payment_url: `https://mock-cinetpay-url.com/pay?token=${deposit.cinetpay_transaction_id}`
    });

  } catch (error) {
    console.error('Erreur inattendue dans /api/payment/deposit:', error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
