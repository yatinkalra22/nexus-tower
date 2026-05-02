'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Key,
  Radar,
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

const navSections = [
  {
    label: 'Operations',
    items: [
      { title: 'Command Center', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Shipments', url: '/dashboard/shipments', icon: Ship },
      { title: 'Live Map', url: '/dashboard/map', icon: MapIcon },
      { title: 'Inventory', url: '/dashboard/inventory', icon: Package },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { title: 'Risk Monitor', url: '/dashboard/risk', icon: AlertTriangle },
      { title: 'Sustainability', url: '/dashboard/sustainability', icon: Leaf },
      { title: 'Tariffs', url: '/dashboard/tariffs', icon: Globe },
      { title: 'Agent', url: '/dashboard/agent', icon: Terminal },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Audit Log', url: '/dashboard/audit', icon: FileText },
      { title: 'MCP Access', url: '/dashboard/settings/mcp', icon: Key },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Radar className="size-4 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold tracking-tight">NexusTower</span>
                <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">Control</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/60">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
