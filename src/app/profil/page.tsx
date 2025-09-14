// src/app/profil/page.tsx
import DynamicProfile from './DynamicProfile';

// Ce composant reste sur le serveur. Il ne contient aucune logique client.
export default function ProfilePage() {
  // On peut garder le layout global (Header/Footer) ici si on veut,
  // ou le laisser dans ProfileClientPage, les deux fonctionnent.
  // Pour la simplicité, on appelle juste notre composant dynamique.
  return <DynamicProfile />;
}