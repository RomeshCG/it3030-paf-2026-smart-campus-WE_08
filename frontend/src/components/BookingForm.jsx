import React, { useState } from 'react';
import { BookingCalendar } from './BookingCalendar';
import { createBooking } from '../api/bookingApi';
import { Users, FileText, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const BookingForm = ({ resource, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [purpose, setPurpose] = useState('');
    const [attendees, setAttendees] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const bookingData = {
            resourceId: resource.id,
            date: selectedDate.toISOString().split('T')[0],
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

                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Users size={12} /> Attendees</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                min="1" 
                                value={attendees} 
                                onChange={(e) => setAttendees(parseInt(e.target.value))} 
                                required 
                            />
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
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                                {loading ? <div className="spinner-small"></div> : <><Check size={18}/> Send Request</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
