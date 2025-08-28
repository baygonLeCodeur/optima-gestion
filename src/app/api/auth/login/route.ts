// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
// On importe la fonction pour créer un client côté SERVEUR
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email et mot de passe requis' },
      { status: 400 }
    );
  }

  // On crée une instance du client Supabase pour cette requête serveur.
  // Il sait comment gérer les cookies grâce à la configuration que nous avons faite.
  const supabase = await createClient();

  // On connecte l'utilisateur. Supabase va automatiquement définir ses propres cookies
  // (contenant le JWT) dans la réponse.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: 'Identifiants invalides' },
      { status: 401 }
    );
  }

  // Il n'est plus nécessaire de définir les cookies manuellement.
  // Supabase s'en est déjà occupé via le middleware et le client serveur.
  // On retourne simplement une réponse de succès. Le middleware se chargera de la redirection.
  return NextResponse.json({
    message: 'Connexion réussie',
    user: data.user,
  });
}
