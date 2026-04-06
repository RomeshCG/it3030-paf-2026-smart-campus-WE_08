import React, { useState, useEffect } from 'react';
import { ResourceStatuses, ResourceTypes } from '../types/resource';
import { createResource, updateResource } from '../api/resourceApi';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResourceForm = ({ resource, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: ResourceTypes.LAB,
    capacity: 10,
    location: '',
    status: ResourceStatuses.ACTIVE,
    imageUrl: '',
    description: '',
    downloadUrl: '',
    available: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (resource) {
      setFormData(resource);
    }
  }, [resource]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.capacity || formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (resource?.id) {
        await updateResource(resource.id, formData);
        toast.success('Resource updated successfully!');
      } else {
        await createResource(formData);
        toast.success('Resource added successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error('Failed to save resource. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ background: 'var(--bg-secondary)', padding: '2rem' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {resource ? 'Edit Resource' : 'Add New Resource'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Computing Lab 01"
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                {Object.values(ResourceTypes).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                {Object.values(ResourceStatuses).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                name="capacity"
                className="form-control"
                value={formData.capacity}
                onChange={handleChange}
                min={1}
              />
              {errors.capacity && <div className="error-text">{errors.capacity}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Building A, Floor 2"
              />
              {errors.location && <div className="error-text">{errors.location}</div>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Resource Availability</label>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '0.75rem', 
                background: 'var(--bg-primary)', 
                borderRadius: '8px',
                cursor: 'pointer',
                border: `1px solid ${formData.available ? 'var(--success)' : 'var(--border-color)'}`
              }}
              onClick={() => setFormData(p => ({ ...p, available: !p.available }))}
            >
              <input 
                type="checkbox" 
                checked={formData.available} 
                onChange={() => {}} // Handled by div click
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500, color: formData.available ? 'var(--success)' : 'var(--text-secondary)' }}>
                {formData.available ? 'Available for Use / Booking' : 'Not Available (Private/Scheduled)'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            {formData.imageUrl && (
              <div className="image-preview" style={{ 
                height: '150px', 
                marginBottom: '1rem', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                background: '#1a1a24'
              }}>
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                  }}
                />
              </div>
            )}
            <input
              type="text"
              name="imageUrl"
              className="form-control"
              value={formData.imageUrl || ''}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description || ''}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter resource description..."
              rows={3}
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Download/Document URL (Optional)</label>
            <input
              type="text"
              name="downloadUrl"
              className="form-control"
              value={formData.downloadUrl || ''}
              onChange={handleChange}
              placeholder="https://example.com/resource.pdf"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
