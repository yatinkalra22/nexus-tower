'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Ship,
  Map as MapIcon,
  AlertTriangle,
  Leaf,
  Globe,
  Package,
  Terminal,
  FileText,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Command Center', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Shipments', url: '/dashboard/shipments', icon: Ship },
  { title: 'Map', url: '/dashboard/map', icon: MapIcon },
  { title: 'Risk', url: '/dashboard/risk', icon: AlertTriangle },
  { title: 'Sustainability', url: '/dashboard/sustainability', icon: Leaf },
  { title: 'Tariffs', url: '/dashboard/tariffs', icon: Globe },
  { title: 'Inventory', url: '/dashboard/inventory', icon: Package },
  { title: 'Agent', url: '/dashboard/agent', icon: Terminal },
  { title: 'Audit', url: '/dashboard/audit', icon: FileText },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Ship className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">NexusTower</span>
                <span className="text-xs text-muted-foreground">Logistics v1.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
