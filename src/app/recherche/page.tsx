// src/app/recherche/page.tsx
import DynamicSearchPage from './DynamicSearchPage';

// Ce composant serveur ne fait qu'une chose : 
// appeler le composant "pont" qui gère la logique client.
export default function SearchPage() {
  return <DynamicSearchPage />;
}