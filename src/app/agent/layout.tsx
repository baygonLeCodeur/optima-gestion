// src/app/agent/layout.tsx
import { ReactNode } from 'react';
import AgentLayoutClient from '@/components/AgentLayoutClient';

type AgentLayoutProps = {
  children: ReactNode;
};

export default function AgentLayout({ children }: AgentLayoutProps) {
  // Ici vous pouvez ajouter de la logique Server Component si nécessaire
  // Par exemple : vérification d'authentification, chargement de données, etc.
  
  return (
    <AgentLayoutClient>
      {children}
    </AgentLayoutClient>
  );
}