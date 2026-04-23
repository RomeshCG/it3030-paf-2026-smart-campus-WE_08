import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { BookOpen, Building2, Copy, LifeBuoy, MoreHorizontal, ShieldCheck, BarChart3 } from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { ADMIN_ROLES } from '@/constants/roles';
import { MyBookingsPage } from '@/pages/MyBookingsPage';
import { AdminBookingPage } from '@/pages/AdminBookingPage';
import { AdminResourceManagementPage } from '@/pages/AdminResourceManagementPage';

const ROLE_OPTIONS = ['USER', 'ADMIN', 'TECHNICIAN', 'SUPER_ADMIN'];

export default function DashboardPage() {
  const { user, logout, updateProfile, uploadProfileImage } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = user?.role ?? 'USER';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdminLike = ADMIN_ROLES.includes(role);

  const [activePage, setActivePage] = useState('dashboard');
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
  const [profileForm, setProfileForm] = useState({ name: '', email: '', profileImageUrl: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const profileImageInputRef = useRef(null);
  const [cropSourceImage, setCropSourceImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      const allowedForCoreRoles = isAdminLike
        ? ['dashboard', 'bookings', 'resource-management', 'manage-bookings', 'settings']
        : ['dashboard', 'bookings', 'settings'];
      if (!allowedForCoreRoles.includes(activePage)) {
        setActivePage('dashboard');
      }
      return;
    }
    if (!['dashboard', 'bookings', 'resource-management', 'manage-bookings', 'user-management', 'admin-management', 'super-admin-management', 'admin-invites', 'settings'].includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [activePage, isSuperAdmin, isAdminLike]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (!section) return;

    const allowed = isSuperAdmin
      ? ['dashboard', 'resource-management', 'user-management', 'admin-management', 'super-admin-management', 'admin-invites', 'settings']
      : isAdminLike
        ? ['dashboard', 'bookings', 'resource-management', 'manage-bookings', 'settings']
        : ['dashboard', 'bookings', 'settings'];

    if (allowed.includes(section)) {
      setActivePage(section);
    }
  }, [isSuperAdmin, isAdminLike, searchParams]);

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

  useEffect(() => {
    if (activePage !== 'settings') return;
    fetchProfile();
  }, [activePage]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await api.get('/api/auth/me');
      setProfileForm({
        name: response?.data?.name || '',
        email: response?.data?.email || '',
        profileImageUrl: response?.data?.profileImageUrl || '',
      });
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Failed to load your profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError('Name is required');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      await updateProfile(profileForm.name.trim(), profileForm.profileImageUrl.trim());
      toast.success('Profile updated successfully');
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const blobToFile = (blob, fileName) => new File([blob], fileName, { type: blob.type });

  const canvasToBlob = (canvas, quality) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to process image'))),
        'image/jpeg',
        quality
      );
    });

  const compressImageUnder1MB = async (file, maxBytes = 1024 * 1024) => {
    const imageBitmap = await createImageBitmap(file);
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.max(1, Math.floor(imageBitmap.width * scale));
    const height = Math.max(1, Math.floor(imageBitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize image processing');

    context.drawImage(imageBitmap, 0, 0, width, height);

    let quality = 0.9;
    let compressedBlob = await canvasToBlob(canvas, quality);
    while (compressedBlob.size > maxBytes && quality > 0.4) {
      quality -= 0.1;
      compressedBlob = await canvasToBlob(canvas, quality);
    }

    if (compressedBlob.size > maxBytes) {
      throw new Error('Unable to compress image under 1MB. Please use a smaller image.');
    }

    return blobToFile(compressedBlob, `${file.name.replace(/\.[^.]+$/, '') || 'profile'}-compressed.jpg`);
  };

  const handleProfileImagePick = () => {
    profileImageInputRef.current?.click();
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImageFile = async (imageSrc, cropAreaPixels) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = cropAreaPixels.width;
    canvas.height = cropAreaPixels.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize image cropper');

    context.drawImage(
      image,
      cropAreaPixels.x,
      cropAreaPixels.y,
      cropAreaPixels.width,
      cropAreaPixels.height,
      0,
      0,
      cropAreaPixels.width,
      cropAreaPixels.height
    );

    const croppedBlob = await canvasToBlob(canvas, 0.95);
    return blobToFile(croppedBlob, 'profile-cropped.jpg');
  };

  const handleProfileImageChange = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setProfileError('Please select a valid image file');
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(selected);
      setCropSourceImage(imageUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    } catch (err) {
      setProfileError(err?.message || 'Failed to load selected image');
    }
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const closeCropModal = () => {
    if (cropSourceImage) {
      URL.revokeObjectURL(cropSourceImage);
    }
    setCropSourceImage(null);
    setCropModalOpen(false);
  };

  const handleCroppedUpload = async () => {
    if (!cropSourceImage || !croppedAreaPixels) {
      setProfileError('Please adjust crop area before uploading');
      return;
    }

    setProfileUploading(true);
    setProfileError('');
    try {
      const croppedFile = await getCroppedImageFile(cropSourceImage, croppedAreaPixels);
      const compressed = await compressImageUnder1MB(croppedFile);
      const session = await uploadProfileImage(compressed);
      setProfileForm((prev) => ({
        ...prev,
        profileImageUrl: session?.profileImageUrl || prev.profileImageUrl,
      }));
      toast.success('Profile image uploaded');
      closeCropModal();
    } catch (err) {
      const fallback = err?.message || err?.response?.data?.message || 'Failed to upload profile image';
      setProfileError(fallback);
    } finally {
      setProfileUploading(false);
    }
  };

  const updateDashboardSectionParam = (nextPage) => {
    const currentSection = searchParams.get('section');
    const nextSection = nextPage === 'settings' ? 'settings' : null;
    if (currentSection === nextSection) return;

    const nextParams = new URLSearchParams(searchParams);
    if (nextSection) {
      nextParams.set('section', nextSection);
    } else {
      nextParams.delete('section');
    }
    setSearchParams(nextParams, { replace: true });
  };

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

  const handleNavigate = (key) => {
    if (key === 'dashboard') {
      updateDashboardSectionParam('dashboard');
      return setActivePage('dashboard');
    }
    if (key === 'catalogue') return navigate('/');
    if (key === 'my-bookings' || key === 'bookings') {
      updateDashboardSectionParam('bookings');
      return setActivePage('bookings');
    }
    if (key === 'resource-management') {
      updateDashboardSectionParam('resource-management');
      return setActivePage('resource-management');
    }
    if (key === 'tickets') return navigate(user?.role === 'USER' ? '/tickets/my' : '/tickets/manage');
    if (key === 'manage-bookings') {
      updateDashboardSectionParam('manage-bookings');
      return setActivePage('manage-bookings');
    }
    if (key === 'analytics') return navigate('/admin/analytics');
    updateDashboardSectionParam(key);
    setActivePage(key);
  };

  const openDashboardModule = (key) => {
    if (key === 'catalogue') {
      navigate('/');
      return;
    }
    if (key === 'my-bookings') {
      setActivePage('bookings');
      return;
    }
    if (key === 'tickets') {
      navigate(user?.role === 'USER' ? '/tickets/my' : '/tickets/manage');
      return;
    }
    if (key === 'admin-bookings') {
      setActivePage('manage-bookings');
      return;
    }
    if (key === 'resource-management') {
      setActivePage('resource-management');
      return;
    }
    if (key === 'analytics') {
      navigate('/admin/analytics');
    }
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
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onSettings={() => {
          updateDashboardSectionParam('settings');
          setActivePage('settings');
        }}
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
            {activePage === 'settings' && 'Profile Settings'}
            {activePage === 'dashboard' && 'Dashboard'}
            {activePage === 'bookings' && 'My Bookings'}
            {activePage === 'resource-management' && 'Assets & Facilities'}
            {activePage === 'manage-bookings' && 'Manage Bookings'}
            </h1>
          </div>
          <NotificationBell />
        </header>

        <div className="p-8">
          {activePage === 'settings' ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit profile</CardTitle>
                <CardDescription>Keep your personal details and profile photo up to date.</CardDescription>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <p className="text-sm text-slate-500">Loading profile…</p>
                ) : (
                  <form className="space-y-6" onSubmit={handleProfileSubmit}>
                    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center">
                      <Avatar size="lg" className="size-20">
                        <AvatarImage src={profileForm.profileImageUrl} alt={profileForm.name || 'User profile'} />
                        <AvatarFallback>{(profileForm.name || 'U').slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Profile preview</p>
                        <p className="text-sm text-muted-foreground">
                          Upload your photo. It is auto-compressed to stay below 1MB before upload.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" onClick={handleProfileImagePick} disabled={profileUploading || profileSaving}>
                            {profileUploading ? 'Uploading…' : 'Upload image'}
                          </Button>
                          {profileForm.profileImageUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setProfileForm((prev) => ({ ...prev, profileImageUrl: '' }))}
                              disabled={profileUploading || profileSaving}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={profileImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Full name</Label>
                        <Input
                          id="profile-name"
                          value={profileForm.name}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Your full name"
                          disabled={profileSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email address</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={profileForm.email}
                          readOnly
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Email is locked because it is a key account identifier.
                        </p>
                      </div>
                    </div>

                    {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={profileSaving}>
                        {profileSaving ? 'Saving…' : 'Save changes'}
                      </Button>
                      <Button type="button" variant="outline" onClick={fetchProfile} disabled={profileSaving}>
                        Reset
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
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
          ) : activePage === 'bookings' ? (
            <MyBookingsPage embedded />
          ) : activePage === 'resource-management' ? (
            <AdminResourceManagementPage embedded />
          ) : activePage === 'manage-bookings' ? (
            <AdminBookingPage embedded />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="cursor-pointer" onClick={() => openDashboardModule('catalogue')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="size-5" /> Catalogue</CardTitle>
                  <CardDescription>Browse facilities and assets.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer" onClick={() => openDashboardModule('my-bookings')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="size-5" /> My Bookings</CardTitle>
                  <CardDescription>Track and manage your bookings.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer" onClick={() => openDashboardModule('tickets')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5" /> Tickets</CardTitle>
                  <CardDescription>Create and follow maintenance tickets.</CardDescription>
                </CardHeader>
              </Card>
              {ADMIN_ROLES.includes(role) && (
                <Card className="cursor-pointer" onClick={() => openDashboardModule('resource-management')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="size-5" /> Assets & Facilities</CardTitle>
                    <CardDescription>View and manage all campus resources from dashboard.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              {ADMIN_ROLES.includes(role) && (
                <Card className="cursor-pointer" onClick={() => openDashboardModule('admin-bookings')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" /> Manage Bookings</CardTitle>
                    <CardDescription>Approve and reject booking requests.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              {ADMIN_ROLES.includes(role) && (
                <Card className="cursor-pointer" onClick={() => openDashboardModule('analytics')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" /> Analytics</CardTitle>
                    <CardDescription>View booking and usage insights.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}
        </div>
        {cropModalOpen && cropSourceImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-background shadow-2xl">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-semibold">Crop profile picture</h3>
                <p className="text-sm text-muted-foreground">Choose the area you want to upload.</p>
              </div>
              <div className="space-y-4 p-6">
                <div className="relative h-[360px] w-full overflow-hidden rounded-md bg-black">
                  <Cropper
                    image={cropSourceImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={handleCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crop-zoom">Zoom</Label>
                  <input
                    id="crop-zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={closeCropModal} disabled={profileUploading}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCroppedUpload} disabled={profileUploading}>
                  {profileUploading ? 'Uploading…' : 'Crop & upload'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
