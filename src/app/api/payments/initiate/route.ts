// src/app/api/payments/initiate/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { config, validateConfig, validateUrls } from '@/lib/config';

export async function POST(req: Request) {
    // Validation préalable de la configuration
    try {
        validateConfig();
        validateUrls();
    } catch (configError) {
        console.error('Erreur de configuration:', configError);
        return NextResponse.json({ 
            message: `Erreur de configuration: ${configError.message}` 
        }, { status: 500 });
    }
    
    const cookieStore = {
        get(name: string) {
            // @ts-ignore - On force le compilateur à ignorer son analyse erronée.
            return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
            // @ts-ignore - On force le compilateur à ignorer son analyse erronée.
            cookies().set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
            // @ts-ignore - On force le compilateur à ignorer son analyse erronée.
            cookies().set({ name, value: '', ...options });
        },
    };

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: cookieStore,
        }
    );
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
           return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
        }

        const { amount, description, phoneNumber } = await req.json();

        // --- Validation renforcée des entrées ---
        if (!amount || !description || !phoneNumber) {
           return NextResponse.json({ message: 'Tous les champs sont requis.' }, { status: 400 });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ message: 'Le montant doit être un nombre positif.' }, { status: 400 });
        }
        const phoneRegex = /^[0-9]{8,14}$/; // Accepte les numéros de 8 à 14 chiffres
        if (!phoneRegex.test(phoneNumber)) {
            return NextResponse.json({ message: 'Format de numéro de téléphone invalide.' }, { status: 400 });
        }
       
        // Utilisation de crypto.randomUUID() pour un ID de transaction unique et sécurisé
        const transaction_id = `OPTIMA-${crypto.randomUUID()}`;
       
        const { data: paymentRecord, error: dbError } = await supabase
           .from('payments')
           .insert({
               client_id: user.id,
               amount,
               description,
               status: 'pending',
               transaction_id: transaction_id,
               currency: 'XOF'
           })
           .select('id')
           .single();

       if (dbError) {
           console.error("Erreur Supabase lors de l'insertion du paiement:", dbError);
           return NextResponse.json({ message: "Erreur lors de la création de l'enregistrement du paiement." }, { status: 500 });
       }
       
       // Utiliser la configuration centralisée avec URLs validées
       const { notifyUrl, returnUrl } = validateUrls();
       
       const cinetpayData = {
           apikey: config.cinetpay.apiKey,
           site_id: config.cinetpay.siteId,
           transaction_id,
           amount,
           currency: 'XOF',
           description,
           return_url: returnUrl,
           notify_url: notifyUrl,
           customer_name: user.user_metadata?.full_name || 'Client',
           customer_surname: '',
           customer_email: user.email,
           customer_phone_number: phoneNumber,
       };

       console.log('Envoi des données à CinetPay :', {
           ...cinetpayData,
           apikey: '[MASKED]' // Masquer la clé API dans les logs
       });

       const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json',
           },
           body: JSON.stringify(cinetpayData),
       });

       const responseData = await cinetpayResponse.json();

       if (responseData.code !== '201') {
            console.error('Erreur CinetPay :', responseData);
            // Mettre à jour l'enregistrement pour marquer l'échec de l'initiation
            await supabase.from('payments')
                .update({ status: 'failed', description: `Echec initiation CinetPay: ${responseData.description || responseData.message}` })
                .eq('id', paymentRecord.id);
            return NextResponse.json({ message: responseData.message || "Erreur lors de l'initiation du paiement avec CinetPay." }, { status: 500 });
       }
       
       // Retourner le lien de paiement au client pour la redirection
       return NextResponse.json({ payment_link: responseData.data.payment_url });

   } catch (error: any) {
       console.error("Erreur d'initiation de paiement:", error);
       return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
   }
}
