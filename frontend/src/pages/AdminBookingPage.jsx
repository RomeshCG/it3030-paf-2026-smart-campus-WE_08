import React, { useState, useEffect } from 'react';
import { getAllBookings, approveBooking, rejectBooking, getTimeSlotAvailability } from '../api/bookingApi';
import { CheckCircle, XCircle, Clock, Users, Calendar as CalendarIcon, MessageSquare, Shield, Search, Filter } from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminBookingPage = ({ embedded = false }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const role = user?.role ?? 'USER';

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED, CANCELLED
    const [search, setSearch] = useState('');
    
    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [selectedBookingForOverride, setSelectedBookingForOverride] = useState(null);
    const [availabilityByBooking, setAvailabilityByBooking] = useState({});

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data);
            const pending = data.filter((booking) => booking.status === 'PENDING');
            const pairs = await Promise.all(
                pending.map(async (booking) => {
                    try {
                        const availability = await getTimeSlotAvailability({
                            resourceId: booking.resourceId,
                            date: booking.date,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            totalCapacity: 0,
                        });
                        return [booking.id, availability];
                    } catch (error) {
                        return [booking.id, null];
                    }
                })
            );
            setAvailabilityByBooking(Object.fromEntries(pairs));
        } catch (err) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, options = {}) => {
        const { forceOverride = false, overrideReason: reason = '' } = options;
        const availability = availabilityByBooking[id];
        const booking = bookings.find((item) => item.id === id);
        const wouldExceedCapacity = availability && booking && Number(booking.attendees || 0) > Number(availability.remaining || 0);
        if (wouldExceedCapacity && !forceOverride) {
            toast.error(`Cannot approve. Only ${availability.remaining} seat(s) remaining in this slot.`);
            return;
        }
        if (forceOverride && !reason.trim()) {
            toast.error('Please provide a reason for capacity override');
            return;
        }
        try {
            await approveBooking(id, {
                forceOverride,
                overrideReason: forceOverride ? reason.trim() : undefined,
            });
            toast.success(forceOverride ? 'Booking approved with manual override' : 'Booking approved successfully');
            setIsOverrideModalOpen(false);
            setSelectedBookingForOverride(null);
            setOverrideReason('');
            fetchBookings();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to approve booking');
        }
    };

    const openOverrideModal = (booking) => {
        setSelectedBookingForOverride(booking);
        setOverrideReason('');
        setIsOverrideModalOpen(true);
    };

    const openRejectModal = (id) => {
        setSelectedBookingId(id);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedBookingId) {
            toast.error('No booking selected for rejection');
            return;
        }
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        try {
            await rejectBooking(selectedBookingId, rejectionReason);
            toast.success('Booking rejected');
            setIsRejectModalOpen(false);
            fetchBookings();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reject booking');
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesFilter = filter === 'ALL' || b.status === filter;
        const query = search.toLowerCase();
        const resourceName = String(b?.resourceName ?? '').toLowerCase();
        const userName = String(b?.userName ?? '').toLowerCase();
        const matchesSearch = resourceName.includes(query) || userName.includes(query);
        return matchesFilter && matchesSearch;
    });

    const getStatusVariant = (status) => {
        switch (status) {
            case 'APPROVED': return 'default';
            case 'REJECTED': return 'destructive';
            case 'CANCELLED': return 'outline';
            default: return 'secondary';
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner"></div></div>;

    const handleSidebarNavigate = (key) => {
        if (key === 'dashboard') return navigate('/dashboard');
        if (key === 'catalogue') return navigate('/');
        if (key === 'my-bookings' || key === 'bookings') return navigate('/bookings/my');
        if (key === 'tickets') return navigate(role === 'USER' ? '/tickets/my' : '/tickets/manage');
        if (key === 'manage-bookings') return navigate('/admin/bookings');
        if (key === 'analytics') return navigate('/admin/analytics');
        if (['user-management', 'admin-management', 'super-admin-management', 'admin-invites', 'settings'].includes(key)) {
            navigate(`/dashboard?section=${key}`);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const content = (
        <div className={`container animate-fade space-y-6 ${embedded ? '' : 'p-8'}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Shield className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold">Manage Bookings</h1>
                        </div>
                        <Badge variant="secondary">Admin Control Panel</Badge>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="min-w-[220px] flex-1">
                                    <label className="mb-2 block text-sm font-medium"><Search className="mr-1 inline size-4" /> Search</label>
                                    <Input
                                        placeholder="Search by user or resource..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="min-w-[200px]">
                                    <label className="mb-2 block text-sm font-medium"><Filter className="mr-1 inline size-4" /> Status</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="PENDING">Pending Only</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                                <Button variant="outline" onClick={() => { setSearch(''); setFilter('ALL'); }}>Reset</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        {filteredBookings.length === 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>No bookings found</CardTitle>
                                    <CardDescription>No booking requests match your current filters.</CardDescription>
                                </CardHeader>
                            </Card>
                        ) : (
                            filteredBookings.map(booking => {
                                const availability = availabilityByBooking[booking.id];
                                const wouldExceedCapacity = Boolean(
                                    availability && booking.status === 'PENDING'
                                    && Number(booking.attendees || 0) > Number(availability.remaining || 0)
                                );
                                return (
                                <Card key={booking.id}>
                                    <CardContent className="pt-6">
                                        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold">{booking.resourceName}</h3>
                                                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                                    <div className="flex items-center gap-2"><CalendarIcon className="size-4" /> {booking.date}</div>
                                                    <div className="flex items-center gap-2"><Clock className="size-4" /> {booking.startTime} - {booking.endTime}</div>
                                                    <div className="flex items-center gap-2"><Users className="size-4" /> {booking.attendees} attendees</div>
                                                    <div className="flex items-center gap-2"><Shield className="size-4" /> {booking.userName}</div>
                                                </div>
                                                <p className="text-sm"><strong>Purpose:</strong> {booking.purpose}</p>
                                                {availability && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Slot Capacity: {availability.used}/{availability.total} used, {availability.remaining} remaining.
                                                    </p>
                                                )}
                                                {wouldExceedCapacity && (
                                                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
                                                        This approval would exceed slot capacity.
                                                    </div>
                                                )}
                                                {booking.rejectionReason && (
                                                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                                        <MessageSquare className="mr-2 inline size-4" />
                                                        <strong>Reason:</strong> {booking.rejectionReason}
                                                    </div>
                                                )}
                                                {booking.capacityOverridden && booking.overrideReason && (
                                                    <div className="rounded-md border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-700">
                                                        <strong>Manual override:</strong> {booking.overrideReason}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                                {booking.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => (wouldExceedCapacity ? openOverrideModal(booking) : handleApprove(booking.id))}
                                                        >
                                                            <CheckCircle className="mr-2 size-4" /> Approve
                                                        </Button>
                                                        <Button variant="destructive" onClick={() => openRejectModal(booking.id)}>
                                                            <XCircle className="mr-2 size-4" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                        )}
                    </div>

                    {/* Rejection Modal */}
                    {isRejectModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <CardTitle>Reject Booking</CardTitle>
                                    <CardDescription>Please provide a reason visible to the user.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. Schedule conflict, Maintenance scheduled..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" className="flex-1" onClick={handleReject}>Confirm Reject</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {isOverrideModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <CardTitle>Capacity Override Approval</CardTitle>
                                    <CardDescription>
                                        This booking exceeds remaining slot capacity. Add a reason to continue.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedBookingForOverride && (
                                        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
                                            Resource: {selectedBookingForOverride.resourceName} <br />
                                            Time: {selectedBookingForOverride.date} {selectedBookingForOverride.startTime} - {selectedBookingForOverride.endTime}
                                        </div>
                                    )}
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. Special event priority, emergency access..."
                                        value={overrideReason}
                                        onChange={(e) => setOverrideReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setIsOverrideModalOpen(false);
                                                setSelectedBookingForOverride(null);
                                                setOverrideReason('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={() => handleApprove(selectedBookingForOverride?.id, { forceOverride: true, overrideReason })}
                                        >
                                            Approve with Override
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
    );

    if (embedded) return content;

    return (
        <SidebarProvider>
            <AppSidebar
                role={role}
                activeNav="manage-bookings"
                onNavigate={handleSidebarNavigate}
                onLogout={handleLogout}
                onSettings={() => navigate('/dashboard?section=settings')}
            />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <h1 className="text-xl font-semibold">Manage Bookings</h1>
                    </div>
                    <NotificationBell />
                </header>
                {content}
            </SidebarInset>
        </SidebarProvider>
    );
};
