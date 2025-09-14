// src/app/admin/settings/SettingsClientPage.tsx
"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { PropertyTypeManager } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSettingsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Configuration du Système et Rapports</h1>
        <Tabs defaultValue="property-types">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="property-types">Types de Biens</TabsTrigger>
            <TabsTrigger value="payments" disabled>
              Paiements (Bientôt disponible)
            </TabsTrigger>
            <TabsTrigger value="documents" disabled>
              Documents (Bientôt disponible)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="property-types">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Types de Biens</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyTypeManager />
              </CardContent>
            </Card>
          </TabsContent>
          {/* Les autres contenus viendront ici */}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSettingsPage;
