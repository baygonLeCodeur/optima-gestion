// src/components/AgentLayoutClient.tsx

'use client';

import { ReactNode } from 'react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/header';
import Footer from '@/components/footer';

type AgentLayoutClientProps = {
  children: ReactNode;
};

export default function AgentLayoutClient({ children }: AgentLayoutClientProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-gray-50/50">
        {/* Header global pour toutes les pages agent */}
        <Header />
        
        <div className="flex flex-1">
          <AgentSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center h-14 px-4 border-b bg-white lg:h-16">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              {/* You can add a dynamic page title here if needed */}
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            {/* Footer déplacé ici pour être dans le bon conteneur flex */}
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}