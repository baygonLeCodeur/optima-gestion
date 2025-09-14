// src/app/admin/settings/page.tsx
import DynamicSettingsPage from './DynamicSettingsPage';

// Ce composant serveur appelle simplement notre chargeur dynamique.
export default function AdminSettingsPage() {
  return <DynamicSettingsPage />;
}