"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Settings, BarChart3, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_metadata.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.user_metadata.role !== 'admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Chargement ou redirection en cours...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Administrateur</h1>
          <p className="text-gray-600">Vue d'ensemble et gestion de la plateforme OPTIMA GESTION.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section: Accès rapide */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Accès Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/users" passHref>
                <Button className="w-full justify-start text-left h-auto py-3" variant="outline">
                  <Users className="mr-3" />
                  <div>
                    <p className="font-semibold">Gestion des Utilisateurs</p>
                    <p className="text-sm text-gray-500">Gérer les agents et les clients.</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/settings" passHref>
                <Button className="w-full justify-start text-left h-auto py-3" variant="outline">
                  <Settings className="mr-3" />
                  <div>
                    <p className="font-semibold">Configuration Système</p>
                    <p className="text-sm text-gray-500">Ajuster les paramètres de la plateforme.</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Section: Métriques globales (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2" />
                Performances Globales
              </CardTitle>
              <CardDescription>Bientôt disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Des graphiques sur les ventes, les locations et les revenus seront affichés ici.
              </p>
            </CardContent>
          </Card>

          {/* Section: Activité récente (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Bientôt disponible</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-gray-500 text-sm">
                Un journal des dernières activités importantes sur la plateforme apparaîtra ici.
              </p>
            </CardContent>
          </Card>

          {/* Section: Alertes système (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <AlertTriangle className="mr-2" />
                Alertes Système
              </CardTitle>
               <CardDescription>Bientôt disponible</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-gray-500 text-sm">
                Les notifications critiques et les alertes de maintenance seront visibles ici.
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
}
