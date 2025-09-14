// src/app/profil/page.tsx
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Skeleton } from "@/components/ui/skeleton"; // Optionnel : pour un meilleur chargement

// Importer dynamiquement notre composant de profil SANS rendu côté serveur (SSR)
const ProfileClientPage = dynamic(
  () => import('./ProfileClientPage'), 
  { 
    ssr: false,
    // Optionnel : Affichez un squelette de chargement pendant que le composant se charge
    loading: () => (
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          <Skeleton className="h-8 w-64" />
        </h1>
        <div className="w-full">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    ),
  }
);

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ProfileClientPage />
      </main>
      <Footer />
    </div>
  );
}