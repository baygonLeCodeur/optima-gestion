// src/components/AgentSidebar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  Home,
  Users,
  LogOut,
  Settings,
} from 'lucide-react';
import { logout } from '@/app/auth/actions';

const menuItems = [
  { href: '/agent/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/agent/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/agent/biens', label: 'Mes Biens', icon: Home },
  { href: '/agent/leads', label: 'Leads', icon: Users },
];

export function AgentSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground">
            <Settings />
          </div>
          <span className="font-semibold text-lg">Espace Agent</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <form action={logout}>
          <SidebarMenuButton tooltip="Se déconnecter" type="submit">
            <LogOut className="size-4" />
            <span>Se déconnecter</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
