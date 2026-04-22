import React, { useEffect, useMemo, useState } from 'react';
import { BookingCalendar } from './BookingCalendar';
import { createBooking, getTimeSlotAvailability } from '../api/bookingApi';
import { Users, FileText, Clock, Check, AlertTriangle } from 'lucide-react';
import { getResourceCapacity } from '../types/resource';
import toast from 'react-hot-toast';

export const BookingForm = ({ resource, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [purpose, setPurpose] = useState('');
    const [attendees, setAttendees] = useState(1);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    const selectedDateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
    const resourceCapacity = useMemo(() => getResourceCapacity(resource), [resource]);
    const isTimeRangeInvalid = useMemo(() => startTime >= endTime, [startTime, endTime]);
    const requestedExceedsCapacity = attendees > resourceCapacity;
    const requestedExceedsRemaining = availability && attendees > availability.remaining;
    const hasStrictAvailability = availability?.source !== 'mine';
    const predictedRemaining = availability
        ? Math.max((availability.remaining ?? resourceCapacity) - attendees, 0)
        : Math.max(resourceCapacity - attendees, 0);
    const lowCapacityThreshold = Math.max(Math.floor(resourceCapacity * 0.2), 1);
    const isLowCapacity = availability && (availability.remaining <= lowCapacityThreshold);
    const shouldBlockSubmit = loading
        || availabilityLoading
        || isTimeRangeInvalid
        || requestedExceedsCapacity;

    useEffect(() => {
        let isMounted = true;
        const fetchAvailability = async () => {
            if (!resource?.id || isTimeRangeInvalid) {
                setAvailability(null);
                return;
            }
            setAvailabilityLoading(true);
            try {
                const data = await getTimeSlotAvailability({
                    resourceId: resource.id,
                    date: selectedDateStr,
                    startTime,
                    endTime,
                    totalCapacity: resourceCapacity,
                });
                if (isMounted) {
                    setAvailability(data);
                }
            } catch (error) {
                if (isMounted) {
                    setAvailability(null);
                }
            } finally {
                if (isMounted) {
                    setAvailabilityLoading(false);
                }
            }
        };
        fetchAvailability();
        return () => {
            isMounted = false;
        };
    }, [resource?.id, selectedDateStr, startTime, endTime, resourceCapacity, isTimeRangeInvalid]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isTimeRangeInvalid) {
            toast.error('End time must be later than start time.');
            return;
        }
        if (requestedExceedsCapacity) {
            toast.error(`Attendees cannot exceed maximum capacity (${resourceCapacity}).`);
            return;
        }
        if (hasStrictAvailability && requestedExceedsRemaining) {
            toast.error(`Only ${availability.remaining} seat(s) remaining for this slot.`);
            return;
        }

        setLoading(true);

        const bookingData = {
            resourceId: resource.id,
            date: selectedDateStr,
            startTime,
            endTime,
            purpose,
            attendees
        };

        try {
            await createBooking(bookingData);
            toast.success('Booking request submitted successfully!');
            onSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to submit booking';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel booking-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Schedule {resource.name}</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <div className="booking-form-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Left: Calendar */}
                    <div>
                        <label className="form-label">1. Select Date</label>
                        <BookingCalendar 
                            selectedDate={selectedDate} 
                            onDateChange={setSelectedDate} 
                        />
                    </div>

                    {/* Right: Form Details */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <label className="form-label">2. Booking Details</label>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Clock size={12} /> Start Time</label>
                                <input 
                                    type="time" 
                                    className="form-control" 
                                    value={startTime} 
                                    onChange={(e) => setStartTime(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Clock size={12} /> End Time</label>
                                <input 
                                    type="time" 
                                    className="form-control" 
                                    value={endTime} 
                                    onChange={(e) => setEndTime(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        {isTimeRangeInvalid && (
                            <div className="error-text">End time must be later than start time.</div>
                        )}

                        <div
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.85rem',
                                background: 'var(--bg-primary)',
                            }}
                        >
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                Time-Slot Capacity ({selectedDateStr} | {startTime} - {endTime})
                            </div>
                            {availabilityLoading ? (
                                <div style={{ fontSize: '0.9rem' }}>Checking availability...</div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
                                        <div><strong>{resourceCapacity}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</div></div>
                                        <div><strong>{availability?.used ?? 0}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Booked</div></div>
                                        <div><strong>{availability?.remaining ?? resourceCapacity}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining</div></div>
                                    </div>
                                    <div style={{ marginTop: '0.7rem', fontSize: '0.82rem' }}>
                                        This request consumes <strong>{attendees}</strong> seat(s). Remaining after request:{' '}
                                        <strong>{predictedRemaining}</strong>.
                                    </div>
                                    {isLowCapacity && (
                                        <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--warning)' }}>
                                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                                            Low slot availability. Only {availability.remaining} seat(s) left.
                                        </div>
                                    )}
                                    {availability?.source === 'mine' && (
                                        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--warning)' }}>
                                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                                            Availability estimate is based on your bookings only.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Users size={12} /> Attendees</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                min="1" 
                                value={attendees} 
                                onChange={(e) => setAttendees(Math.max(1, Number.parseInt(e.target.value || '1', 10) || 1))} 
                                required 
                            />
                            {requestedExceedsCapacity && (
                                <div className="error-text">Attendees exceed maximum capacity ({resourceCapacity}).</div>
                            )}
                            {hasStrictAvailability && requestedExceedsRemaining && (
                                <div className="error-text">
                                    Requested attendees exceed remaining seats ({availability.remaining}) for this slot.
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><FileText size={12} /> Purpose</label>
                            <textarea 
                                className="form-control" 
                                rows="3" 
                                placeholder="Meeting, Workshop, Study Session..."
                                value={purpose} 
                                onChange={(e) => setPurpose(e.target.value)} 
                                required
                            ></textarea>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={shouldBlockSubmit} style={{ flex: 2 }}>
                                {loading ? <div className="spinner-small"></div> : <><Check size={18}/> Send Request</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
