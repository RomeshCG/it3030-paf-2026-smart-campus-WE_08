import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getAllBookings } from '../api/bookingApi';
import { getResources } from '../api/resourceApi';
import { LayoutDashboard, TrendingUp, Users, Clock, Coffee, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
const COUNTABLE_STATUSES = new Set(['PENDING', 'APPROVED']);

const formatDateLabel = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const AdminAnalyticsDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rangeDays, setRangeDays] = useState(7);
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [bookingsData, resourcesResponse] = await Promise.all([
                    getAllBookings(),
                    getResources({ page: 0, size: 500 }),
                ]);
                setBookings(bookingsData || []);
                setResources(resourcesResponse?.content || []);
            } catch (err) {
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const resourceMap = useMemo(() => {
        const map = new Map();
        resources.forEach((resource) => map.set(Number(resource.id), resource));
        return map;
    }, [resources]);

    const filteredBookings = useMemo(() => {
        const fromDate = new Date();
        fromDate.setHours(0, 0, 0, 0);
        fromDate.setDate(fromDate.getDate() - (rangeDays - 1));
        const fromDateStr = fromDate.toISOString().slice(0, 10);

        return bookings.filter((booking) => {
            const matchesRange = booking.date >= fromDateStr;
            if (!matchesRange) return false;
            if (typeFilter === 'ALL') return true;
            const resource = resourceMap.get(Number(booking.resourceId));
            return resource?.type === typeFilter;
        });
    }, [bookings, rangeDays, typeFilter, resourceMap]);

    const usageBookings = filteredBookings.filter((booking) => COUNTABLE_STATUSES.has(booking.status));
    const totalSeatsConsumed = usageBookings.reduce((sum, booking) => sum + Number(booking.attendees || 0), 0);

    const dailyTrend = useMemo(() => {
        const dateMap = new Map();
        filteredBookings.forEach((booking) => {
            const current = dateMap.get(booking.date) || { bookings: 0, seats: 0 };
            current.bookings += 1;
            if (COUNTABLE_STATUSES.has(booking.status)) {
                current.seats += Number(booking.attendees || 0);
            }
            dateMap.set(booking.date, current);
        });
        return [...dateMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, value]) => ({
                date: formatDateLabel(date),
                bookings: value.bookings,
                seats: value.seats,
            }));
    }, [filteredBookings]);

    const hourlyUsage = useMemo(() => {
        const hourMap = new Map();
        usageBookings.forEach((booking) => {
            const hour = Number(String(booking.startTime || '00:00').split(':')[0]);
            const current = hourMap.get(hour) || 0;
            hourMap.set(hour, current + Number(booking.attendees || 0));
        });
        return [...hourMap.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([hour, seats]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, seats }));
    }, [usageBookings]);

    const topResources = useMemo(() => {
        const resourceStats = new Map();
        usageBookings.forEach((booking) => {
            const key = Number(booking.resourceId);
            const stats = resourceStats.get(key) || { bookings: 0, seats: 0, name: booking.resourceName };
            stats.bookings += 1;
            stats.seats += Number(booking.attendees || 0);
            resourceStats.set(key, stats);
        });
        return [...resourceStats.values()]
            .sort((a, b) => b.seats - a.seats)
            .slice(0, 7)
            .map((entry) => ({ name: entry.name, bookings: entry.bookings, seats: entry.seats }));
    }, [usageBookings]);

    const statusData = useMemo(() => {
        const statusMap = new Map();
        filteredBookings.forEach((booking) => {
            statusMap.set(booking.status, (statusMap.get(booking.status) || 0) + 1);
        });
        return [...statusMap.entries()].map(([name, value]) => ({ name, value }));
    }, [filteredBookings]);

    const capacityAlerts = usageBookings.filter((booking) => {
        const resource = resourceMap.get(Number(booking.resourceId));
        const cap = Number(resource?.capacity || 0);
        return cap > 0 && Number(booking.attendees || 0) / cap >= 0.8;
    }).length;

    const resourceTypes = [...new Set(resources.map((resource) => resource.type).filter(Boolean))];

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;
    if (!bookings.length) return <div className="error-msg">No analytics data available.</div>;

    return (
        <div className="container animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <LayoutDashboard size={32} color="var(--accent-color)" />
                <h1 className="page-title" style={{ margin: 0 }}>Booking Analytics Dashboard</h1>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Date Range</label>
                    <select
                        className="form-control"
                        value={rangeDays}
                        onChange={(e) => setRangeDays(Number(e.target.value))}
                        style={{ minWidth: '180px' }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Resource Type</label>
                    <select
                        className="form-control"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="ALL">All Types</option>
                        {resourceTypes.map((type) => (
                            <option key={type} value={type}>{String(type).replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <FileText color="var(--accent-color)" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{filteredBookings.length}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Requests</div>
                    </div>
                </div>
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <TrendingUp color="var(--success)" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalSeatsConsumed}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Seats Consumed</div>
                    </div>
                </div>
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '12px', borderRadius: '12px' }}>
                        <Clock color="#f59e0b" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{hourlyUsage.length ? hourlyUsage.reduce((max, item) => Math.max(max, item.seats), 0) : 0}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Peak Hour Seats</div>
                    </div>
                </div>
                <div className="glass-panel stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.12)', padding: '12px', borderRadius: '12px' }}>
                        <AlertTriangle color="#f43f5e" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{capacityAlerts}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>High Usage Alerts</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {/* Daily trend */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Coffee size={20} color="var(--accent-color)" />
                        <h3 style={{ margin: 0 }}>Daily Capacity Consumption</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyTrend}>
                                <defs>
                                    <linearGradient id="dailySeats" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="seats" stroke="#6366f1" fillOpacity={1} fill="url(#dailySeats)" strokeWidth={3} name="Seats used" />
                                <Area type="monotone" dataKey="bookings" stroke="#10b981" fillOpacity={0} strokeWidth={2} name="Requests" />
                            </AreaChart>
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
                            <BarChart data={hourlyUsage}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="seats" name="Seats consumed" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Most booked resources */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Users size={20} color="var(--accent-color)" />
                        <h3 style={{ margin: 0 }}>Most Booked Resources</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topResources} layout="vertical" margin={{ left: 18, right: 14 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" width={150} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend />
                                <Bar dataKey="seats" name="Seats" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                <Bar dataKey="bookings" name="Requests" fill="#10b981" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status distribution */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <FileText size={20} color="var(--accent-color)" />
                        <h3 style={{ margin: 0 }}>Booking Status Distribution</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={88}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </div>
        </div>
    );
};
