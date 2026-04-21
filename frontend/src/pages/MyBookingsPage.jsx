import React, { useState, useEffect } from 'react';
import { getMyBookings, cancelBooking, getBookingHistory } from '../api/bookingApi';
import { BookingHistory } from '../components/BookingHistory';
import { Calendar, Clock, MapPin, XCircle, Info, RefreshCw, MessageSquare, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const MyBookingsPage = ({ embedded = false }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const role = user?.role ?? 'USER';

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fetchBookings = async () => {
        try {
            const data = await getMyBookings();
            setBookings(data);
        } catch (err) {
            toast.error('Failed to load your bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await cancelBooking(id);
            toast.success('Booking cancelled successfully');
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleViewHistory = async (id) => {
        try {
            const history = await getBookingHistory(id);
            setSelectedHistory(history);
            setShowHistoryModal(true);
        } catch (err) {
            toast.error('Failed to load booking history');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'APPROVED': return 'default';
            case 'PENDING': return 'secondary';
            case 'REJECTED': return 'destructive';
            case 'CANCELLED': return 'outline';
            default: return 'outline';
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
                            <Calendar className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold">My Bookings</h1>
                        </div>
                        <Button variant="outline" onClick={fetchBookings}>
                            <RefreshCw className="mr-2 size-4" /> Refresh
                        </Button>
                    </div>

                    {bookings.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No bookings found</CardTitle>
                                <CardDescription>You haven't made any resource requests yet.</CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {bookings.map(booking => (
                                <Card key={booking.id}>
                                    <CardHeader>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <CardTitle className="text-lg">{booking.resourceName}</CardTitle>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                            <div className="flex items-center gap-2"><Calendar className="size-4" /> {new Date(booking.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2"><Clock className="size-4" /> {booking.startTime} - {booking.endTime}</div>
                                            <div className="flex items-center gap-2"><MapPin className="size-4" /> {booking.resourceLocation}</div>
                                            <div className="flex items-center gap-2"><Info className="size-4" /> {booking.purpose}</div>
                                        </div>
                                        {booking.rejectionReason && (
                                            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="size-4" />
                                                    <strong>Rejection Reason:</strong> {booking.rejectionReason}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" onClick={() => handleViewHistory(booking.id)}>
                                                <Clock className="mr-2 size-4" /> View History
                                            </Button>
                                            {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                                                <Button variant="destructive" onClick={() => handleCancel(booking.id)}>
                                                    <XCircle className="mr-2 size-4" /> Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* History Modal */}
                    {showHistoryModal && (
                        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                            <Card className="modal-content w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Booking Audit History</CardTitle>
                                        <Button variant="ghost" onClick={() => setShowHistoryModal(false)}>Close</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <BookingHistory history={selectedHistory} />
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
                activeNav="bookings"
                onNavigate={handleSidebarNavigate}
                onLogout={handleLogout}
                onSettings={() => navigate('/dashboard?section=settings')}
            />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <h1 className="text-xl font-semibold">My Bookings</h1>
                    </div>
                    <Button variant="ghost" size="icon" className="relative text-slate-500">
                        <Bell className="size-5" />
                    </Button>
                </header>
                {content}
            </SidebarInset>
        </SidebarProvider>
    );
};
