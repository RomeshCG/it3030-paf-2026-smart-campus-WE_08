import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, MailOpen } from 'lucide-react';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notificationApi';
import toast from 'react-hot-toast';

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                getMyNotifications(),
                getUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            fetchNotifications();
        } catch (err) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            fetchNotifications();
            toast.success('All marked as read');
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-primary)', 
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px'
                }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: '2px solid var(--bg-primary)'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '320px',
                    maxHeight: '450px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '10px',
                    padding: '0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    animation: 'fade-in 0.2s ease-out'
                }}>
                    <div style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.05)'
                    }}>
                        <h4 style={{ margin: 0 }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--accent-color)', 
                                    fontSize: '12px', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <MailOpen size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '8px 0' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    style={{ 
                                        padding: '12px 16px', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                                        display: 'flex',
                                        gap: '12px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <p style={{ 
                                            margin: '0 0 4px 0', 
                                            fontSize: '13px', 
                                            lineHeight: '1.4',
                                            color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)'
                                        }}>
                                            {notif.message}
                                        </p>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {new Date(notif.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    {!notif.isRead && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            style={{ 
                                                background: 'rgba(255,255,255,0.1)', 
                                                border: 'none', 
                                                borderRadius: '50%', 
                                                width: '24px', 
                                                height: '24px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'var(--success)'
                                            }}
                                            title="Mark as read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
