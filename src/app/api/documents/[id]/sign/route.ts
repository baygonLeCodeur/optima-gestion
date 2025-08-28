// src/app/api/documents/[id]/sign/route.ts
import { NextResponse } from 'next/server';

// --- Simulation de l'API PandaDoc pour l'intégration embarquée ---

// Cette fonction simule la récupération des détails nécessaires depuis votre base de données.
async function getDocumentDetailsForSigning(docId: string) {
    // Dans un cas réel, vous feriez une requête sécurisée à Supabase.
    // const { data: document, error } = await supabase
    //     .from('documents')
    //     .select(`
    //         file_path,
    //         client:users ( email, full_name )
    //     `)
    //     .eq('id', docId)
    //     .single();
    // if (error || !document) throw new Error("Document non trouvé ou erreur d'accès.");
    
    // Pour la simulation :
    return {
        id: docId,
        client_email: 'client@example.com', 
        client_name: 'John Doe',
        // URL vers le fichier stocké dans Supabase Storage
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 
    };
}


export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const docId = params.id;
  
  // TODO: Ajouter une vérification d'authentification pour s'assurer que l'utilisateur a le droit de signer.
  
  try {
    const document = await getDocumentDetailsForSigning(docId);
    
    // --- ÉTAPE 1: Créer le document sur PandaDoc (simulation) ---
    // const pandaDocResponse = await fetch('https://api.pandadoc.com/public/v1/documents', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.PANDADOC_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     name: `Contrat de location - ${document.id}`,
    //     recipients: [{ email: document.client_email, first_name: document.client_name.split(' ')[0], last_name: document.client_name.split(' ')[1], role: 'Signataire' }],
    //     url: document.file_url,
    //     tags: ['optima-gestion', 'contrat-location'],
    //   })
    // });
    // if (!pandaDocResponse.ok) throw new Error('Échec de la création du document PandaDoc');
    // const pandaDocData = await pandaDocResponse.json();
    // const pandaDocId = pandaDocData.id;
    
    const simulatedPandaDocId = `doc_${Math.random().toString(36).substr(2, 9)}`;


    // --- ÉTAPE 2: Créer une session de signature embarquée (simulation) ---
    // const sessionResponse = await fetch(`https://api.pandadoc.com/public/v1/documents/${pandaDocId}/session`, {
    //   method: 'POST',
    //   headers: {
    //      'Authorization': `Bearer ${process.env.PANDADOC_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     recipient: document.client_email,
    //     lifetime: 900 // La session est valide pendant 15 minutes
    //   })
    // });
    // if (!sessionResponse.ok) throw new Error('Échec de la création de la session de signature');
    // const sessionData = await sessionResponse.json();
    
    // La réponse réelle contient un ID de session. Nous le simulons ici.
    const simulatedSessionId = `session_${Math.random().toString(36).substr(2, 16)}`;

    // Vous devriez stocker le `pandaDocId` dans votre BDD pour le lier à votre document interne.
    // await supabase.from('documents').update({ pandadoc_id: pandaDocId }).eq('id', docId);

    // On retourne l'ID de session au client.
    return NextResponse.json({ sessionId: simulatedSessionId });

  } catch (error: any) {
    console.error('Erreur lors de la création de la session de signature PandaDoc:', error.message);
    return NextResponse.json({ error: "Échec de l'initialisation du processus de signature." }, { status: 500 });
  }
}
