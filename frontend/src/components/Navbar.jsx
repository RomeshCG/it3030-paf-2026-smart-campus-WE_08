import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { Layout } from 'lucide-react';

export const Navbar = () => {
    const location = useLocation();

    return (
        <nav className="glass-panel" style={{ 
            marginBottom: '2rem', 
            padding: '0.8rem 2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '0 0 16px 16px',
            borderTop: 'none'
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-primary)' }}>
                <img
                    src="/smart%20campus%20logo.png"
                    alt="Smart Campus"
                    style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Smart Campus</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                        <Layout size={18} /> Dashboard
                    </NavLink>
                </div>
                
                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NotificationBell />
                    <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        JD
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, children, active }) => (
    <Link to={to} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        textDecoration: 'none', 
        color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
        fontSize: '0.95rem',
        fontWeight: active ? 600 : 500,
        transition: 'color 0.2s'
    }}>
        {children}
    </Link>
);
