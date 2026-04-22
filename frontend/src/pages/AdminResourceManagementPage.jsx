import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createResource, getResources, updateResource, deleteResource, uploadResourceImage } from '@/api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, X } from 'lucide-react';
import { ResourceStatuses, ResourceTypes, formatResourceTypeLabel, getResourceCapacity } from '@/types/resource';

const EMPTY_FORM = {
  name: '',
  type: ResourceTypes.LAB,
  capacity: 1,
  location: '',
  status: ResourceStatuses.ACTIVE,
  imageUrl: '',
  description: '',
  downloadUrl: '',
  available: true,
};

export function AdminResourceManagementPage({ embedded = false }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingResource, setEditingResource] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const fetchResources = async (name = '') => {
    setLoading(true);
    try {
      const response = await getResources({
        page: 0,
        size: 500,
        name: name.trim() || undefined,
      });
      setResources(response?.content ?? []);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchResources(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const openEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name || '',
      type: resource.type || ResourceTypes.LAB,
      capacity: getResourceCapacity(resource) || 1,
      location: resource.location || '',
      status: resource.status || ResourceStatuses.ACTIVE,
      imageUrl: resource.imageUrl || '',
      description: resource.description || '',
      downloadUrl: resource.downloadUrl || '',
      available: Boolean(resource.available),
    });
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditingResource(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingResource(null);
    setFormData(EMPTY_FORM);
  };

  const saveResource = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error('Name and location are required');
      return;
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error('Maximum capacity must be at least 1');
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        location: formData.location.trim(),
      };
      if (editingResource?.id) {
        await updateResource(editingResource.id, payload);
        toast.success('Resource updated successfully');
      } else {
        await createResource(payload);
        toast.success('Resource created successfully');
      }
      closeForm();
      fetchResources(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save resource');
    } finally {
      setFormSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageUploading(true);
    try {
      const response = await uploadResourceImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: response?.imageUrl || prev.imageUrl }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const toggleOffline = async (resource) => {
    const nextOffline = resource.status === 'ACTIVE';
    try {
      await updateResource(resource.id, {
        ...resource,
        status: nextOffline ? 'OUT_OF_SERVICE' : 'ACTIVE',
        available: !nextOffline,
      });
      toast.success(nextOffline ? 'Resource set to offline' : 'Resource set to active');
      fetchResources(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update resource status');
    }
  };

  const handleDelete = async (resource) => {
    const shouldDelete = window.confirm(`Delete "${resource.name}"? This cannot be undone.`);
    if (!shouldDelete) return;
    try {
      await deleteResource(resource.id);
      toast.success('Resource deleted successfully');
      fetchResources(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete resource');
    }
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(resources.map((resource) => resource.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleSelectOne = (resourceId, checked) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, resourceId];
      return prev.filter((id) => id !== resourceId);
    });
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.error('Select at least one row first');
      return;
    }

    const selectedResources = resources.filter((resource) => selectedIds.includes(resource.id));
    if (!selectedResources.length) return;

    try {
      if (action === 'DELETE') {
        const confirmed = window.confirm(`Delete ${selectedResources.length} selected resource(s)? This cannot be undone.`);
        if (!confirmed) return;
        await Promise.all(selectedResources.map((resource) => deleteResource(resource.id)));
        toast.success(`${selectedResources.length} resource(s) deleted`);
      }

      if (action === 'SET_OFFLINE') {
        await Promise.all(
          selectedResources.map((resource) =>
            updateResource(resource.id, {
              ...resource,
              status: 'OUT_OF_SERVICE',
              available: false,
            })
          )
        );
        toast.success(`${selectedResources.length} resource(s) set offline`);
      }

      if (action === 'SET_ACTIVE') {
        await Promise.all(
          selectedResources.map((resource) =>
            updateResource(resource.id, {
              ...resource,
              status: 'ACTIVE',
              available: true,
            })
          )
        );
        toast.success(`${selectedResources.length} resource(s) set active`);
      }

      setBulkAction('');
      fetchResources(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk action failed');
    }
  };

  const allSelected = resources.length > 0 && selectedIds.length === resources.length;
  const hasSelected = selectedIds.length > 0;

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Assets & Facilities</CardTitle>
          <div className="flex w-full flex-wrap gap-2 md:w-auto">
            <Input
              placeholder="Search by name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:w-72"
            />
            <Button variant="outline" onClick={() => setSearch('')}>Reset</Button>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={bulkAction}
              onChange={(event) => {
                const action = event.target.value;
                setBulkAction(action);
                if (action) handleBulkAction(action);
              }}
              disabled={!hasSelected}
            >
              <option value="">Bulk actions</option>
              <option value="SET_OFFLINE">Set Offline</option>
              <option value="SET_ACTIVE">Set Active</option>
              <option value="DELETE">Delete Selected</option>
            </select>
            <Button onClick={openCreate}>
              <Plus className="mr-1 size-4" /> Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading resources...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => toggleSelectAll(event.target.checked)}
                        aria-label="Select all resources"
                      />
                    </th>
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2">Location</th>
                    <th className="py-2 pr-2">Capacity</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Availability</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No resources found.
                      </td>
                    </tr>
                  ) : (
                    resources.map((resource) => (
                      <tr key={resource.id} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(resource.id)}
                            onChange={(event) => toggleSelectOne(resource.id, event.target.checked)}
                            aria-label={`Select ${resource.name}`}
                          />
                        </td>
                        <td className="py-2 pr-2 font-medium">{resource.name}</td>
                        <td className="py-2 pr-2">{formatResourceTypeLabel(resource.type)}</td>
                        <td className="py-2 pr-2">{resource.location}</td>
                        <td className="py-2 pr-2">{getResourceCapacity(resource)}</td>
                        <td className="py-2 pr-2">
                          <Badge variant={resource.status === 'ACTIVE' ? 'secondary' : 'destructive'}>
                            {resource.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant={resource.available ? 'outline' : 'destructive'}>
                            {resource.available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" aria-label="Open actions">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(resource)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleOffline(resource)}>
                                {resource.status === 'ACTIVE' ? 'Set Offline' : 'Set Active'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(resource)}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
              <CardTitle>{editingResource ? 'Edit Resource' : 'Add New Asset'}</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={closeForm}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={saveResource}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="e.g. Computing Lab 01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resource Type</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.type}
                      onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      {Object.values(ResourceTypes).map((type) => (
                        <option key={type} value={type}>{formatResourceTypeLabel(type)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.status}
                      onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      {Object.values(ResourceStatuses).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Capacity</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.capacity}
                      onChange={(event) => setFormData((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                      placeholder="e.g. Building A, Floor 2"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Image URL</label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(event) => setFormData((prev) => ({ ...prev, imageUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" disabled={imageUploading}>
                        <label className="cursor-pointer">
                          {imageUploading ? 'Uploading...' : 'Upload Image'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </Button>
                      {formData.imageUrl && (
                        <span className="text-xs text-emerald-600">Cloudinary image ready</span>
                      )}
                    </div>
                    {formData.imageUrl && (
                      <div className="mt-2 overflow-hidden rounded-md border border-border">
                        <img src={formData.imageUrl} alt="Resource preview" className="h-40 w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.description}
                      onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Resource description..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Download URL</label>
                    <Input
                      value={formData.downloadUrl}
                      onChange={(event) => setFormData((prev) => ({ ...prev, downloadUrl: event.target.value }))}
                      placeholder="https://example.com/resource.pdf"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm md:col-span-2">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(event) => setFormData((prev) => ({ ...prev, available: event.target.checked }))}
                    />
                    Available for booking/use
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm} disabled={formSaving}>Cancel</Button>
                  <Button type="submit" disabled={formSaving}>
                    {formSaving ? 'Saving...' : editingResource ? 'Save Changes' : 'Create Asset'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  if (embedded) return content;
  return <div className="p-8">{content}</div>;
}
