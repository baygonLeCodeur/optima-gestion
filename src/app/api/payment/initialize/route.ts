// app/api/payment/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import cinetPayService from '@/lib/cinetpay';
import { CinetPayInitRequest } from '@/types/payment';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
//import { getBaseUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // Vérification que l'utilisateur a un email
    if (!user.email) {
      return NextResponse.json({ error: 'Email utilisateur requis' }, { status: 400 });
    }
    
    // Validation basique des données entrantes
    if (!body.amount || body.amount <= 0) {
        return NextResponse.json({ error: 'Le montant doit être positif' }, { status: 400 });
    }

    // 🆕 ÉTAPE 1: Récupérer ou créer le wallet de l'agent
    let { data: agentWallet, error: walletError } = await supabase
      .from('agent_wallets')
      .select('id')
      .eq('agent_id', user.id)
      .single();

    // Si le wallet n'existe pas, le créer
    if (walletError && walletError.code === 'PGRST116') { // No rows found
      const { data: newWallet, error: createWalletError } = await supabase
        .from('agent_wallets')
        .insert({
          agent_id: user.id,
          balance: 0,
          currency: 'XOF'
        })
        .select('id')
        .single();

      if (createWalletError) {
        console.error('Erreur lors de la création du wallet:', createWalletError);
        return NextResponse.json({ error: 'Impossible de créer le portefeuille' }, { status: 500 });
      }

      agentWallet = newWallet;
    } else if (walletError) {
      console.error('Erreur lors de la récupération du wallet:', walletError);
      return NextResponse.json({ error: 'Erreur de portefeuille' }, { status: 500 });
    }
    
    const transaction_id = `txn_${user.id}_${Date.now()}`;
    //const baseUrl = getBaseUrl();

    const paymentData: Omit<CinetPayInitRequest, 'apikey' | 'site_id'> = {
      transaction_id: transaction_id,
      amount: body.amount,
      currency: 'XOF',
      description: `Dépôt de fonds pour ${user.email}`,
      customer_name: user.user_metadata.full_name || 'N/A',
      customer_surname: '',
      customer_email: user.email!,
      customer_phone_number: user.phone || '',
      customer_address: '',
      customer_city: '',
      customer_country: 'CI',
      customer_state: '',
      customer_zip_code: '',
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/agent/dashboard?transaction_id=${transaction_id}`,
      notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/notify`,
      channels: 'ALL',
    };

    // 🆕 ÉTAPE 2: Insérer avec le wallet_id
    const { error: insertError } = await supabase.from('funds_deposit').insert({
        transaction_id: transaction_id,
        agent_id: user.id,
        wallet_id: agentWallet!.id, // ✅ AJOUTÉ: L'ID du wallet
        amount: body.amount,
        currency: 'XOF',
        status: 'pending', // ⚠️ CORRIGÉ: 'pending' au lieu de 'PENDING' selon votre enum
        payment_method: 'CINETPAY'
    });

    if (insertError) {
        console.error('Erreur lors de l\'insertion du dépôt initial:', insertError);
        return NextResponse.json({ error: 'Impossible de démarrer la transaction' }, { status: 500 });
    }

    const result = await cinetPayService.initializePayment(paymentData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[PAYMENT_INIT_ERROR]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}