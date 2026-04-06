import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getBookingAnalytics } from '../api/bookingApi';
import { LayoutDashboard, TrendingUp, Users, Clock, Coffee, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export const AdminAnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await getBookingAnalytics();
                setAnalytics(data);
            } catch (err) {
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;
    if (!analytics) return <div className="error-msg">No analytics data available.</div>;

    const resourceData = Object.entries(analytics.bookingsByResource).map(([name, value]) => ({ name, value }));
    const hourData = Object.entries(analytics.bookingsByHour).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return (
        <div className="container animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <LayoutDashboard size={32} color="var(--accent-color)" />
                <h1 className="page-title" style={{ margin: 0 }}>Booking Analytics Dashboard</h1>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <FileText color="var(--accent-color)" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{analytics.totalBookings}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Bookings</div>
                    </div>
                </div>
                {/* Derived Stats */}
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <TrendingUp color="var(--success)" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{resourceData.length}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Resources</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {/* Resource Distribution */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Coffee size={20} color="var(--accent-color)" />
                        <h3 style={{ margin: 0 }}>Resource Usage Distribution</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={resourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {resourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Hours */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Clock size={20} color="var(--accent-color)" />
                        <h3 style={{ margin: 0 }}>Peak Booking Hours</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
