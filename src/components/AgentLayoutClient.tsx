// src/components/AgentLayoutClient.tsx

'use client';

import { ReactNode } from 'react';
import { AgentSidebar } from '@/components/AgentSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

type AgentLayoutClientProps = {
  children: ReactNode;
};

export default function AgentLayoutClient({ children }: AgentLayoutClientProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50/50">
        <AgentSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center h-14 px-4 border-b bg-white lg:h-16">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            {/* You can add a dynamic header title here if needed */}
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}