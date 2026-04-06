import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css';

export const BookingCalendar = ({ bookings = [], onDateChange, selectedDate }) => {
    // Helper to check if a date has bookings
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasBooking = bookings.some(b => {
                const bDate = new Date(b.date);
                return bDate.getDate() === date.getDate() &&
                       bDate.getMonth() === date.getMonth() &&
                       bDate.getFullYear() === date.getFullYear() &&
                       (b.status === 'APPROVED' || b.status === 'PENDING');
            });

            return hasBooking ? <div className="dot"></div> : null;
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const isBooked = bookings.some(b => {
                const bDate = new Date(b.date);
                return bDate.getDate() === date.getDate() &&
                       bDate.getMonth() === date.getMonth() &&
                       bDate.getFullYear() === date.getFullYear() &&
                       b.status === 'APPROVED';
            });
            return isBooked ? 'booked-date' : null;
        }
    };

    return (
        <div className="calendar-container glass-panel">
            <Calendar 
                onChange={onDateChange} 
                value={selectedDate}
                tileContent={tileContent}
                tileClassName={tileClassName}
                minDate={new Date()}
            />
            <div className="calendar-legend" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className="dot" style={{ position: 'static' }}></div> Pending/Requested
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '2px' }}></div> Confirmed
                </div>
            </div>
        </div>
    );
};
