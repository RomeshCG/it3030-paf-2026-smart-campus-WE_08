import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { Layout, Calendar, BarChart3, Shield } from 'lucide-react';

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
                <div style={{ background: 'var(--accent-color)', padding: '6px', borderRadius: '8px' }}>
                    <Layout size={24} color="white" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>SmartCampus</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <NavLink to="/" active={location.pathname === '/'}>
                        <Layout size={18} /> Catalogue
                    </NavLink>
                    <NavLink to="/bookings/my" active={location.pathname === '/bookings/my'}>
                        <Calendar size={18} /> My Bookings
                    </NavLink>
                    <NavLink to="/admin/analytics" active={location.pathname === '/admin/analytics'}>
                        <BarChart3 size={18} /> Analytics
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
