import React, { useEffect, useState } from 'react';
import { getResourceById } from '../api/resourceApi';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Download, Activity, Calendar, ShieldCheck, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResourceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                const data = await getResourceById(parseInt(id));
                setResource(data);
            } catch (err) {
                toast.error('Failed to load resource details.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '10rem' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--accent-color)' }}>Loading resource details...</p>
            </div>
        );
    }

    if (!resource) return null;

    return (
        <div className="details-page animate-fade">
            <button className="btn btn-secondary" style={{ marginBottom: '2rem' }} onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Back to Catalogue
            </button>

            <div className="details-hero">
                {resource.imageUrl ? (
                    <img src={resource.imageUrl} alt={resource.name} />
                ) : (
                    <div className="placeholder-img" style={{ fontSize: '5rem' }}>{resource.name.charAt(0)}</div>
                )}
            </div>

            <div className="details-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className={`badge type-badge-static badge-${resource.type.toLowerCase()}`} style={{ marginRight: '1rem' }}>
                            {resource.type}
                        </span>
                        <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '3rem', fontWeight: 800 }}>{resource.name}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span className={`badge`} style={{ 
                            background: resource.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: resource.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)',
                            fontSize: '1rem', padding: '0.5rem 1rem', border: `1px solid ${resource.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'}`
                        }}>
                            {resource.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="details-info animate-slide">
                <div className="info-item">
                    <span className="info-label"><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }}/> Location</span>
                    <span className="info-value">{resource.location}</span>
                </div>
                <div className="info-item">
                    <span className="info-label"><Users size={14} style={{ display: 'inline', marginRight: '4px' }}/> Capacity</span>
                    <span className="info-value">{resource.capacity} Persons</span>
                </div>
                <div className="info-item">
                    <span className="info-label"><Activity size={14} style={{ display: 'inline', marginRight: '4px' }}/> Availability</span>
                    <span className="info-value" style={{ color: resource.available ? 'var(--success)' : 'var(--danger)' }}>
                        {resource.available ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                        {resource.available ? 'Ready for Booking' : 'Not Available'}
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-label"><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/> Registered</span>
                    <span className="info-value" style={{ fontSize: '1rem' }}>
                        {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                    </span>
                </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '3rem' }}>
                <div>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={20} style={{ color: 'var(--accent-color)' }}/> Resource Description
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.1rem' }}>
                        {resource.description || "No detailed description available for this resource."}
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} /> Quick Actions
                    </h4>
                    {resource.downloadUrl && (
                        <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => window.open(resource.downloadUrl, '_blank')}>
                            <Download size={18} /> Download Info
                        </button>
                    )}
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => toast('Booking feature coming soon!', { icon: '📅' })}>
                        Schedule Resource
                    </button>
                </div>
            </div>
        </div>
    );
};

const CheckCircle = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const AlertCircle = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
