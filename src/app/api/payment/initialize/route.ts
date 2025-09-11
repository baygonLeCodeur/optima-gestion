// app/api/payment/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import cinetPayService from '@/lib/cinetpay'; // CHANGEMENT: Import de l'instance singleton
import { CinetPayInitRequest } from '@/types/payment';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    
    // AJOUT: Validation basique des données entrantes
    if (!body.amount || body.amount <= 0) {
        return NextResponse.json({ error: 'Le montant doit être positif' }, { status: 400 });
    }
    
    const transaction_id = `txn_${user.id}_${Date.now()}`;

    const paymentData: Omit<CinetPayInitRequest, 'apikey' | 'site_id'> = {
      transaction_id: transaction_id,
      amount: body.amount,
      currency: 'XOF',
      description: `Dépôt de fonds pour ${user.email}`,
      customer_name: user.user_metadata.full_name || 'N/A',
      customer_surname: '',
      customer_email: user.email,
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

    // Insérer une entrée initiale dans funds_deposit
    const { error: insertError } = await supabase.from('funds_deposit').insert({
        transaction_id: transaction_id,
        agent_id: user.id,
        amount: body.amount,
        status: 'PENDING',
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