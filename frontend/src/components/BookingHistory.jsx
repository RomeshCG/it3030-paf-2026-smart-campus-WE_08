import React from 'react';
import { Clock, User, CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

export const BookingHistory = ({ history = [] }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={16} color="var(--success)" />;
            case 'REJECTED': return <XCircle size={16} color="var(--danger)" />;
            case 'CANCELLED': return <AlertCircle size={16} color="var(--warning)" />;
            default: return <Clock size={16} color="var(--accent-color)" />;
        }
    };

    return (
        <div className="audit-timeline" style={{ padding: '1rem 0' }}>
            {history.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No history available</p>
            ) : (
                history.map((item, index) => (
                    <div key={item.id} style={{ 
                        display: 'flex', 
                        gap: '1.5rem', 
                        marginBottom: index === history.length - 1 ? 0 : '1.5rem',
                        position: 'relative'
                    }}>
                        {/* Timeline Connector */}
                        {index !== history.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                left: '10px',
                                top: '24px',
                                bottom: '-24px',
                                width: '1px',
                                background: 'var(--border-color)',
                                zIndex: 0
                            }}></div>
                        )}

                        {/* Icon */}
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            boxShadow: '0 0 0 4px var(--bg-primary)'
                        }}>
                            {getStatusIcon(item.status)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.action}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(item.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12} /> {item.performedBy}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
