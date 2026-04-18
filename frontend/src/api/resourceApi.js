import api from '../lib/api';

const API_URL = '/api/resources';

export const getResources = async (params) => {
  const { data } = await api.get(API_URL, { params });
  return data;
};

export const getResourceById = async (id) => {
  const { data } = await api.get(`${API_URL}/${id}`);
  return data;
};

export const createResource = async (resource) => {
  const { data } = await api.post(API_URL, resource);
  return data;
};

export const updateResource = async (id, resource) => {
  const { data } = await api.put(`${API_URL}/${id}`, resource);
  return data;
};

export const deleteResource = async (id) => {
  await api.delete(`${API_URL}/${id}`);
};

export const getDashboardStats = async () => {
  const { data } = await api.get(`${API_URL}/stats`);
  return data;
};

export const uploadResourceImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await api.post(`${API_URL}/upload-image`, formData);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 405) {
      throw new Error('Image upload endpoint is not active yet (HTTP 405). Restart backend and try again.');
    }
    const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
    throw new Error(apiMessage || 'Failed to upload resource image');
  }
};
