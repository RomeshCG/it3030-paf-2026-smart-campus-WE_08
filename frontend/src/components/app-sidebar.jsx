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
  BookOpen,
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

const CORE_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'bookings', label: 'Bookings', icon: BookOpen },
  { key: 'tickets', label: 'Tickets', icon: LifeBuoy },
];

const SUPER_ADMIN_NAV = [
  { key: 'tickets', label: 'Tickets', icon: LifeBuoy },
  {
    key: 'user-management',
    label: 'User Management',
    icon: Users,
  },
  {
    key: 'admin-management',
    label: 'Admin Management',
    icon: ShieldCheck,
  },
  {
    key: 'admin-invites',
    label: 'Admin Invites',
    icon: MailPlus,
  },
  {
    key: 'super-admin-management',
    label: 'Super Admin Management',
    icon: ShieldUser,
  },
];

export function AppSidebar({
  role = 'USER',
  activeNav = 'dashboard',
  onNavigate,
  onLogout,
  onSettings,
  ...props
}) {
  const navItems = role === 'SUPER_ADMIN' ? SUPER_ADMIN_NAV : CORE_NAV;
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(true);
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
          {role === 'SUPER_ADMIN' ? (
            <>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Collapsible open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="User Management">
                        <Users />
                        <span>User Management</span>
                        {isUserManagementOpen ? <ChevronDown className="ml-auto size-4" /> : <ChevronRight className="ml-auto size-4" />}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {navItems.map((item) => (
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
            </>
          ) : (
            <>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => (
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
            </>
          )}
        </SidebarGroup>

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
