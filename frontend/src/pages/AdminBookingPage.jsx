import React, { useState, useEffect } from 'react';
import { getAllBookings, approveBooking, rejectBooking } from '../api/bookingApi';
import { CheckCircle, XCircle, Clock, Users, Calendar as CalendarIcon, MessageSquare, Shield, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminBookingPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED, CANCELLED
    const [search, setSearch] = useState('');
    
    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (err) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveBooking(id);
            toast.success('Booking approved successfully');
            fetchBookings();
        } catch (err) {
            toast.error('Failed to approve booking');
        }
    };

    const openRejectModal = (id) => {
        setSelectedBookingId(id);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleReject = async () => {
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
            toast.error('Failed to reject booking');
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === 'ALL' || b.status === filter;
        const matchesSearch = b.resourceName.toLowerCase().includes(search.toLowerCase()) || 
                             b.userName.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'var(--success)';
            case 'REJECTED': return 'var(--danger)';
            case 'CANCELLED': return 'var(--text-secondary)';
            default: return 'var(--warning)';
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="container animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={32} color="var(--accent-color)" />
                    <h1 className="page-title" style={{ margin: 0 }}>Manage Bookings</h1>
                </div>
                <div className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)' }}>
                    Admin Control Panel
                </div>
            </div>

            {/* Filters and Search */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 2, minWidth: '250px' }}>
                    <label className="form-label"><Search size={14} style={{ marginRight: '6px' }}/> Search</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by user or resource..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label"><Filter size={14} style={{ marginRight: '6px' }}/> Status Filter</label>
                    <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilter('ALL'); }}>Reset</button>
            </div>

            {/* Bookings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredBookings.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                        <Clock size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No bookings found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>No booking requests match your current filters.</p>
                    </div>
                ) : (
                    filteredBookings.map(booking => (
                        <div key={booking.id} className="glass-panel animate-slide-up" style={{ padding: '1.5rem', borderLeft: `4px solid ${getStatusColor(booking.status)}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{booking.resourceName}</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CalendarIcon size={14} /> {booking.date}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} /> {booking.startTime} - {booking.endTime}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Users size={14} /> {booking.attendees} Attendees
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                            <Shield size={14} /> {booking.userName}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <strong>Purpose:</strong> {booking.purpose}
                                    </div>
                                    {booking.rejectionReason && (
                                        <div style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MessageSquare size={14} /> <strong>Reason:</strong> {booking.rejectionReason}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <span className="badge" style={{ 
                                        background: `${getStatusColor(booking.status)}22`, 
                                        color: getStatusColor(booking.status),
                                        borderColor: `${getStatusColor(booking.status)}44`,
                                        marginBottom: '0.5rem'
                                    }}>
                                        {booking.status}
                                    </span>
                                    
                                    {booking.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => handleApprove(booking.id)}>
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.5rem 1rem' }} onClick={() => openRejectModal(booking.id)}>
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '450px', width: '100%' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Reject Booking</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Please provide a reason for rejecting this booking request. This will be visible to the user.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Rejection Reason</label>
                            <textarea 
                                className="form-control" 
                                rows="3" 
                                placeholder="e.g. Schedule conflict, Maintenance scheduled..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsRejectModalOpen(false)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReject}>Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
