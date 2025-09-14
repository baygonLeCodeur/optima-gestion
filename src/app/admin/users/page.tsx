// src/app/admin/users/page.tsx
"use client";

import React from 'react';
import dynamic from 'next/dynamic'; // 1. Importer dynamic
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Optionnel mais recommandé

// 2. Importer UserList de manière dynamique SANS rendu côté serveur (SSR)
const UserList = dynamic(
  () => import('@/components/UserList').then((mod) => mod.UserList), 
  { 
    ssr: false,
    // 3. Afficher un squelette de chargement pendant l'importation
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }
);

const AdminUsersPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Gestion des Utilisateurs et Agents</h1>
        <Card>
          <CardHeader>
            <CardTitle>Liste des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 4. Le composant UserList est maintenant utilisé ici sans risque */}
            <UserList />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;