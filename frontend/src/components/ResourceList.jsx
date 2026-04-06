import React, { useState, useEffect, useCallback } from 'react';
import { ResourceTypes, ResourceStatuses } from '../types/resource';
import { getResources, deleteResource, getDashboardStats } from '../api/resourceApi';
import { ResourceForm } from './ResourceForm';
import { Plus, Edit2, Trash2, MapPin, Users, Activity, RefreshCw, Layers, Eye, Download, PieChart, CheckCircle, AlertCircle, Shield, FileDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, outOfService: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Role-based UI
  const [userRole, setUserRole] = useState('ADMIN');

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [size] = useState(6);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(undefined);
  
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResources({
        page,
        size,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        capacity: capacityFilter || undefined,
        name: searchFilter || undefined
      });
      setResources(data.content || []);
      setTotalPages(data.totalPages || 0);
      fetchStats();
    } catch (err) {
      console.error('Error fetching resources:', err);
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }, [page, size, typeFilter, statusFilter, capacityFilter, searchFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchResources]);

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete);
      toast.success('Resource deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource.');
    }
  };

  const confirmDelete = (id) => {
    setResourceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const exportToCSV = () => {
    if (resources.length === 0) {
      toast.error('No data to export.');
      return;
    }
    
    const headers = ['ID', 'Name', 'Type', 'Capacity', 'Location', 'Status', 'Availability', 'Description'];
    const csvContent = [
      headers.join(','),
      ...resources.map(r => [
        r.id,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.type,
        r.capacity,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        r.status,
        r.available ? 'Yes' : 'No',
        `"${(r.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart_campus_catalogue_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Catalogue exported successfully!', { icon: '📊' });
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingResource(undefined);
    setIsFormOpen(true);
  };

  const handleViewDetails = (id) => {
    if (id) navigate(`/resources/${id}`);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchResources();
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Facilities & Assets Catalogue</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge" style={{ background: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={14} /> Mode: {userRole}
          </span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => setUserRole(r => r === 'ADMIN' ? 'USER' : 'ADMIN')}
          >
            Switch Role
          </button>
        </div>
      </div>
      
      {/* Admin Dashboard Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <PieChart size={24} style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Resources</div>
        </div>
        <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <CheckCircle size={24} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.active}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active & Ready</div>
        </div>
        <div className="glass-panel stat-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <AlertCircle size={24} style={{ color: 'var(--danger)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.outOfService}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Out of Service</div>
        </div>
      </div>
      
      {/* Tools & Filters Section */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="filters-panel">
          <div style={{ flex: 2, minWidth: '300px', position: 'relative' }}>
            <label className="form-label"><Search size={14} style={{ display: 'inline', marginRight: '6px' }}/> Search Resources</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name..."
                style={{ paddingLeft: '2.5rem' }}
                value={searchFilter}
                onChange={(e) => { setSearchFilter(e.target.value); setPage(0); }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label"><Layers size={14} style={{ display: 'inline', marginRight: '6px' }}/> Type</label>
            <select className="form-control" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
              <option value="">All Types</option>
              {Object.values(ResourceTypes).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label"><Activity size={14} style={{ display: 'inline', marginRight: '6px' }}/> Status</label>
            <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All Statuses</option>
              {Object.values(ResourceStatuses).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <label className="form-label"><Users size={14} style={{ display: 'inline', marginRight: '6px' }}/> Min Capacity</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="e.g. 20"
              value={capacityFilter}
              onChange={(e) => { setCapacityFilter(parseInt(e.target.value) || ''); setPage(0); }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => {
              setTypeFilter(''); setStatusFilter(''); setCapacityFilter(''); setSearchFilter(''); setPage(0);
            }}>
              <RefreshCw size={16} /> Reset
            </button>
            <button className="btn btn-secondary" onClick={exportToCSV}>
              <FileDown size={18} /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={18} /> Add Resource
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem', width: '100%' }}>
          <div className="spinner"></div>
          <p className="animate-fade" style={{ color: 'var(--accent-color)', marginTop: '1rem' }}>Updating Catalogue...</p>
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="glass-panel animate-fade" style={{ textAlign: 'center', padding: '6rem 2rem', borderStyle: 'dashed', borderColor: 'var(--border-color)' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
            <Layers size={64} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <RefreshCw size={32} style={{ color: 'var(--accent-color)' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No matching resources</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
            We couldn't find any facilities matching your current filters. Try resetting your search or adding a new record.
          </p>
          <button className="btn btn-secondary" onClick={() => { setTypeFilter(''); setStatusFilter(''); setCapacityFilter(''); setPage(0); }}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="resource-grid">
        {resources.map((res) => (
          <div key={res.id} className="glass-panel resource-card">
            <div className="image-container">
              <span className={`badge type-badge badge-${res.type.toLowerCase()}`}>
                {res.type}
              </span>
              <span className={`badge status-badge`} style={{ 
                background: res.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)',
                color: 'white',
                fontWeight: 600
              }}>
                {res.status.replace('_', ' ')}
              </span>

              {res.imageUrl ? (
                <img src={res.imageUrl} alt={res.name} />
              ) : (
                <div className="placeholder-img">{res.name.charAt(0)}</div>
              )}
            </div>
            
            <h3 className="card-title">{res.name}</h3>
            
            <div className="card-details">
              <div className="detail-row">
                <MapPin size={16} style={{ color: 'var(--text-secondary)' }}/>
                <span>{res.location}</span>
              </div>
              <div className="detail-row">
                <Users size={16} style={{ color: 'var(--accent-color)' }}/>
                <span>Capacity: <strong>{res.capacity}</strong></span>
              </div>
              <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                {res.available ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                    <CheckCircle size={14} /> Currently Available
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                    <AlertCircle size={14} /> Not Available
                  </span>
                )}
              </div>
            </div>

            <div className="card-actions" style={{ display: 'grid', gridTemplateColumns: userRole === 'ADMIN' ? '1fr 1fr' : '1fr', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ gridColumn: userRole === 'ADMIN' ? 'span 2' : 'span 1', padding: '0.6rem' }}
                onClick={() => handleViewDetails(res.id)}
              >
                <Eye size={16} /> View Details
              </button>
              
              {userRole === 'ADMIN' && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem' }}
                    onClick={(e) => { e.stopPropagation(); handleEdit(res); }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '0.5rem' }}
                    onClick={(e) => { e.stopPropagation(); confirmDelete(res.id); }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </>
              )}

              {res.downloadUrl && (
                <button 
                  className="btn btn-secondary" 
                  style={{ gridColumn: userRole === 'ADMIN' ? 'span 2' : 'span 1', padding: '0.6rem', color: 'var(--success)' }}
                  onClick={(e) => { e.stopPropagation(); window.open(res.downloadUrl, '_blank'); }}
                >
                  <Download size={16} /> Fast Download
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination View */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary" 
            disabled={page === 0} 
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button 
            className="btn btn-secondary" 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <ResourceForm 
          resource={editingResource} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel confirm-modal">
            <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1.5rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Delete Resource?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Are you sure you want to permanently remove this resource? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleDelete}>Delete Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
