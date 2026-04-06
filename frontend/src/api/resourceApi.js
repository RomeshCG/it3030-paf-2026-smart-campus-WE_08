import axios from 'axios';

const API_URL = 'http://localhost:8080/api/resources';

export const getResources = async (params) => {
  const { data } = await axios.get(API_URL, { params });
  return data;
};

export const getResourceById = async (id) => {
  const { data } = await axios.get(`${API_URL}/${id}`);
  return data;
};

export const createResource = async (resource) => {
  const { data } = await axios.post(API_URL, resource);
  return data;
};

export const updateResource = async (id, resource) => {
  const { data } = await axios.put(`${API_URL}/${id}`, resource);
  return data;
};

export const deleteResource = async (id) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const getDashboardStats = async () => {
  const { data } = await axios.get(`${API_URL}/stats`);
  return data;
};
