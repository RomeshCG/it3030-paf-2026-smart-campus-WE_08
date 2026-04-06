import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Copy, MoreHorizontal } from 'lucide-react';

const ROLE_OPTIONS = ['USER', 'ADMIN', 'TECHNICIAN', 'SUPER_ADMIN'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'USER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [activePage, setActivePage] = useState(isSuperAdmin ? 'user-management' : 'dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      setActivePage('dashboard');
      return;
    }
    if (!['user-management', 'admin-management', 'super-admin-management', 'admin-invites', 'settings'].includes(activePage)) {
      setActivePage('user-management');
    }
  }, [activePage, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (!['user-management', 'admin-management', 'super-admin-management'].includes(activePage)) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, activePage, search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!isSuperAdmin || activePage !== 'admin-invites') return;
    fetchInvites();
  }, [isSuperAdmin, activePage]);

  const fetchInvites = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const response = await api.get('/api/admin/invites');
      setInvites(response.data ?? []);
    } catch (err) {
      setInviteError(err?.response?.data?.message || 'Failed to load invites');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateInvite = async (event) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteSubmitting(true);
    setInviteError('');
    try {
      await api.post('/api/admin/invites', { email });
      setInviteEmail('');
      await fetchInvites();
    } catch (err) {
      setInviteError(err?.response?.data?.message || 'Failed to create invite');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyInviteLink = async (id, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteId(id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activePage === 'admin-management') params.role = 'ADMIN';
      if (activePage === 'super-admin-management') params.role = 'SUPER_ADMIN';
      if (activePage === 'user-management' && roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBanToggle = async (target) => {
    try {
      await api.patch(`/api/admin/users/${target.id}/ban`, { banned: target.enabled });
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (target, newRole) => {
    try {
      await api.patch(`/api/admin/users/${target.id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (target) => {
    if (!window.confirm(`Delete ${target.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${target.id}`);
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const roleCounts = useMemo(
    () =>
      ROLE_OPTIONS.reduce((acc, current) => {
        acc[current] = users.filter((item) => item.role === current).length;
        return acc;
      }, {}),
    [users]
  );

  return (
    <SidebarProvider>
      <AppSidebar
        role={role}
        activeNav={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        onSettings={() => setActivePage('settings')}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">
            {activePage === 'user-management' && 'User Management'}
            {activePage === 'admin-management' && 'Admin Management'}
            {activePage === 'super-admin-management' && 'Super Admin Management'}
            {activePage === 'admin-invites' && 'Admin Invites'}
            {activePage === 'settings' && 'System Settings'}
            {activePage === 'dashboard' && 'Dashboard'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="relative text-slate-500">
            <Bell className="size-5" />
          </Button>
        </header>

        <div className="p-8">
          {activePage === 'settings' ? (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Future configuration area for global system controls.</CardDescription>
              </CardHeader>
            </Card>
          ) : isSuperAdmin && activePage === 'admin-invites' ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invite a new admin</CardTitle>
                  <CardDescription>
                    Sends an email with the signup link (if Gmail SMTP is configured). You can also copy the link below after creating an invite.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <label htmlFor="invite-email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="invite-email"
                        type="email"
                        autoComplete="email"
                        placeholder="future.admin@university.edu"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviteSubmitting}
                      />
                    </div>
                    <Button type="submit" disabled={inviteSubmitting || !inviteEmail.trim()}>
                      {inviteSubmitting ? 'Sending…' : 'Create invite'}
                    </Button>
                  </form>
                  {inviteError && <p className="mt-3 text-sm text-destructive">{inviteError}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending and past invites</CardTitle>
                  <CardDescription>Status and invite links for onboarding.</CardDescription>
                </CardHeader>
                <CardContent>
                  {inviteLoading ? (
                    <p className="text-sm text-slate-500">Loading invites…</p>
                  ) : (
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Email</th>
                          <th className="py-2">Role</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Expires</th>
                          <th className="py-2">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">
                              No invites yet. Create one above.
                            </td>
                          </tr>
                        ) : (
                          invites.map((inv) => (
                            <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="py-2">{inv.email}</td>
                              <td className="py-2">
                                <Badge variant="outline">{inv.targetRole}</Badge>
                              </td>
                              <td className="py-2">
                                <Badge variant={inv.status === 'PENDING' ? 'secondary' : 'outline'}>{inv.status}</Badge>
                              </td>
                              <td className="py-2 text-xs text-slate-600">
                                {inv.expiresAt
                                  ? new Date(inv.expiresAt).toLocaleString(undefined, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })
                                  : '—'}
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <span className="max-w-[180px] truncate font-mono text-xs text-slate-600" title={inv.inviteUrl}>
                                    {inv.inviteUrl}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => copyInviteLink(inv.id, inv.inviteUrl)}
                                    title="Copy link"
                                  >
                                    <Copy className="size-4" />
                                  </Button>
                                  {copiedInviteId === inv.id && (
                                    <span className="text-xs text-emerald-600">Copied</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : isSuperAdmin && ['user-management', 'admin-management', 'super-admin-management'].includes(activePage) ? (
            <>
              {activePage === 'user-management' && (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  {ROLE_OPTIONS.map((currentRole) => (
                    <Card key={currentRole}>
                      <CardHeader className="pb-2">
                        <CardDescription>{currentRole} count</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-2xl">{roleCounts[currentRole] || 0}</CardTitle>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {activePage === 'user-management' ? 'All Registered Users' : activePage === 'admin-management' ? 'Admins' : 'Super Admins'}
                    </CardTitle>
                    <CardDescription>Manage account status, roles, and lifecycle.</CardDescription>
                  </div>
                  <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="md:w-72" />
                    {activePage === 'user-management' && (
                      <select className="rounded-md border border-input bg-background px-3 py-2" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                        <option value="ALL">All Roles</option>
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    <select className="rounded-md border border-input bg-background px-3 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="BANNED">Banned</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading users...</p>
                  ) : (
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Name</th>
                          <th className="py-2">Email</th>
                          <th className="py-2">Role</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2">{item.name}</td>
                            <td className="py-2">{item.email}</td>
                            <td className="py-2">
                              <Badge variant="outline">{item.role}</Badge>
                            </td>
                            <td className="py-2">
                              <Badge variant={item.enabled ? 'secondary' : 'destructive'}>
                                {item.enabled ? 'ACTIVE' : 'BANNED'}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleBanToggle(item)}>
                                    {item.enabled ? 'Ban User' : 'Unban User'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {ROLE_OPTIONS.map((option) => (
                                    <DropdownMenuItem key={`${item.id}-${option}`} onClick={() => handleRoleChange(item, option)}>
                                      Set role: {option}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.name}</CardTitle>
                <CardDescription>Standard dashboard placeholders for non-super-admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
