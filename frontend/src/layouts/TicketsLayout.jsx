import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

export default function TicketsLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'USER';

  const handleNav = (key) => {
    if (key === 'dashboard') {
      navigate('/dashboard');
      return;
    }
    if (key === 'catalogue') {
      navigate('/');
      return;
    }
    if (key === 'bookings' || key === 'my-bookings') {
      navigate('/dashboard?section=bookings');
      return;
    }
    if (key === 'manage-bookings') {
      navigate('/dashboard?section=manage-bookings');
      return;
    }
    if (key === 'analytics') {
      navigate('/admin/analytics');
      return;
    }
    if (key === 'tickets') {
      navigate(role === 'USER' ? '/tickets/my' : '/tickets/manage');
      return;
    }
    if (['user-management', 'admin-management', 'super-admin-management', 'settings'].includes(key)) {
      navigate('/dashboard');
      return;
    }
    if (key === 'technician' || key === 'admin') {
      navigate('/dashboard');
      return;
    }
    // Unknown keys: ignore (sidebar should not emit these on tickets routes)
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <AppSidebar
        role={role}
        activeNav="tickets"
        onNavigate={handleNav}
        onLogout={handleLogout}
        onSettings={() => navigate('/dashboard')}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 md:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold md:text-xl">Tickets</h1>
          </div>
        </header>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
