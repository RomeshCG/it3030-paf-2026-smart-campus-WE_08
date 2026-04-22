"use client";

import { useState } from 'react';
import { SearchForm } from '@/components/search-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  MailPlus,
  LogOut,
  Settings,
  ShieldCheck,
  ShieldUser,
  Users,
  Wrench,
} from 'lucide-react';

const WORKSPACE_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'catalogue', label: 'Catalogue', icon: Building2 },
  { key: 'bookings', label: 'My Bookings', icon: BookOpen },
  { key: 'tickets', label: 'Tickets', icon: LifeBuoy },
];

const ADMIN_NAV = [
  { key: 'resource-management', label: 'Assets & Facilities', icon: Building2 },
  { key: 'manage-bookings', label: 'Manage Bookings', icon: ShieldCheck },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const SUPER_ADMIN_ACCESS_NAV = [
  { key: 'user-management', label: 'Users', icon: Users },
  { key: 'admin-management', label: 'Admins', icon: ShieldCheck },
  { key: 'super-admin-management', label: 'Super Admins', icon: ShieldUser },
  { key: 'admin-invites', label: 'Admin Invites', icon: MailPlus },
];

export function AppSidebar({
  role = 'USER',
  activeNav = 'dashboard',
  onNavigate,
  onLogout,
  onSettings,
  ...props
}) {
  const [isAccessOpen, setIsAccessOpen] = useState(true);
  const isAdminLike = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const serviceItems = role === 'TECHNICIAN'
    ? [{ key: 'technician', label: 'Technician', icon: Wrench }]
    : role === 'ADMIN'
      ? [{ key: 'admin', label: 'Admin', icon: ShieldCheck }]
      : [];

  const handleNav = (key) => {
    onNavigate?.(key);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default" type="button">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Smart Campus</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Control Center</span>
                <span className="truncate text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                  {role}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm
          placeholder={
            role === 'SUPER_ADMIN'
              ? 'Search users, admins…'
              : 'Search bookings, tickets…'
          }
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {WORKSPACE_NAV.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  isActive={activeNav === item.key}
                  tooltip={item.label}
                  onClick={() => handleNav(item.key)}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isAdminLike ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarMenu>
                {ADMIN_NAV.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeNav === item.key}
                      tooltip={item.label}
                      onClick={() => handleNav(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : null}

        {role === 'SUPER_ADMIN' ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Access Control</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Collapsible open={isAccessOpen} onOpenChange={setIsAccessOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Access Control">
                        <Users />
                        <span>User & Role Management</span>
                        {isAccessOpen ? <ChevronDown className="ml-auto size-4" /> : <ChevronRight className="ml-auto size-4" />}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {SUPER_ADMIN_ACCESS_NAV.map((item) => (
                          <SidebarMenuSubItem key={item.key}>
                            <SidebarMenuSubButton
                              isActive={activeNav === item.key}
                              onClick={() => handleNav(item.key)}
                            >
                              <item.icon />
                              <span>{item.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : null}

        {serviceItems.length > 0 ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Services</SidebarGroupLabel>
              <SidebarMenu>
                {serviceItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeNav === item.key}
                      tooltip={item.label}
                      onClick={() => handleNav(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => onSettings?.()}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="text-sidebar-foreground"
              onClick={() => onLogout?.()}
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
