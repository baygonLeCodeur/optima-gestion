// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      // Rediriger vers le dashboard approprié selon le rôle
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'agent':
          router.push('/agent/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // On vérifie juste si la réponse est OK (status 2xx)
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erreur de connexion');
      }

      const result = await response.json();

      toast({
        title: 'Succès',
        description: 'Connexion réussie ! Redirection en cours...',
      });

      // Créer un client Supabase et forcer une synchronisation de l'état
      const supabase = createClient();
      
      // Récupérer la session fraîche pour déclencher onAuthStateChange
      await supabase.auth.getSession();
      
      // Attendre un court moment pour que le hook useAuth se mette à jour
      setTimeout(() => {
        // Force une nouvelle récupération de session pour s'assurer que l'état est synchronisé
        supabase.auth.getSession().then(() => {
          router.refresh();
          
          // Redirection conditionnelle basée sur le rôle utilisateur
          const userRole = result.user?.user_metadata?.role || 'client';
          switch (userRole) {
            case 'admin':
              router.push('/admin/dashboard');
              break;
            case 'agent':
              router.push('/agent/dashboard');
              break;
            default:
              router.push('/dashboard');
          }
        });
      }, 500);
      
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
      setLoading(false);
    }
    // Ne pas définir loading à false ici, on le laisse jusqu'à la redirection
  };

  // Le reste du JSX est identique et parfait.
  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Adresse email"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mot de passe"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm">
              Vous n'avez pas de compte ?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
