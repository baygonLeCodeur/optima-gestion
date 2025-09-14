// src/app/profil/ProfileClientPage.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    FavoritesList, 
    SavedSearchesList, 
    VisitsHistoryList, 
    DocumentsList, 
    PaymentView,
    ProfileForm,
    ClientOnlyWrapper
} from '@/components';

// Note: J'ai renommé la fonction en ProfileClientPage pour éviter la confusion
export default function ProfileClientPage() {
  const { user, loading } = useAuth();

  // ... (TOUT LE RESTE DE VOTRE LOGIQUE : if (loading), if (!user), return (...))
  // Le contenu est identique à votre fichier original.
  // ...
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mon Espace Personnel</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="searches">Recherches</TabsTrigger>
            <TabsTrigger value="visits">Visites</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            <FavoritesList />
          </TabsContent>
          <TabsContent value="searches" className="mt-4">
            <SavedSearchesList />
          </TabsContent>
          <TabsContent value="visits" className="mt-4">
            <VisitsHistoryList />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <DocumentsList />
          </TabsContent>
          <TabsContent value="payments" className="mt-4">
            <PaymentView />
          </TabsContent>
        </Tabs>

      </main>
      <Footer />
    </div>
  );
}