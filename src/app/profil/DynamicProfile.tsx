// src/app/profil/DynamicProfile.tsx
'use client'; // <-- La directive est ici ! C'est ce qui corrige l'erreur.

import dynamic from 'next/dynamic';

// On importe dynamiquement le composant client, SANS rendu côté serveur (SSR)
const ProfileClientPage = dynamic(
  () => import('./ProfileClientPage'), 
  { 
    ssr: false,
    // Vous pouvez mettre un composant de chargement plus élaboré ici
    loading: () => <p>Chargement de votre espace...</p> 
  }
);

export default function DynamicProfile() {
  return <ProfileClientPage />;
}