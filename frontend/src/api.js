import axios from 'axios';

const API_BASE_URL = '/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post('/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const getStorageAreas = async () => {
  const response = await api.get('/storage-areas');
  return response.data;
};

export const createStorageArea = async (data) => {
  const response = await api.post('/storage-areas', data);
  return response.data;
};

export const updateStorageArea = async (id, data) => {
  const response = await api.put(`/storage-areas/${id}`, data);
  return response.data;
};

export const deleteStorageArea = async (id) => {
  const response = await api.delete(`/storage-areas/${id}`);
  return response.data;
};

export const getBookshelves = async (storageAreaId = null) => {
  const params = storageAreaId ? { storage_area_id: storageAreaId } : {};
  const response = await api.get('/bookshelves', { params });
  return response.data;
};

export const createBookshelf = async (data) => {
  const response = await api.post('/bookshelves', data);
  return response.data;
};

export const updateBookshelf = async (id, data) => {
  const response = await api.put(`/bookshelves/${id}`, data);
  return response.data;
};

export const deleteBookshelf = async (id) => {
  const response = await api.delete(`/bookshelves/${id}`);
  return response.data;
};

export const getSensorPoints = async (storageAreaId = null) => {
  const params = storageAreaId ? { storage_area_id: storageAreaId } : {};
  const response = await api.get('/sensor-points', { params });
  return response.data;
};

export const createSensorPoint = async (data) => {
  const response = await api.post('/sensor-points', data);
  return response.data;
};

export const updateSensorPoint = async (id, data) => {
  const response = await api.put(`/sensor-points/${id}`, data);
  return response.data;
};

export const deleteSensorPoint = async (id) => {
  const response = await api.delete(`/sensor-points/${id}`);
  return response.data;
};

export const getDehumidifiers = async (storageAreaId = null) => {
  const params = storageAreaId ? { storage_area_id: storageAreaId } : {};
  const response = await api.get('/dehumidifiers', { params });
  return response.data;
};

export const createDehumidifier = async (data) => {
  const response = await api.post('/dehumidifiers', data);
  return response.data;
};

export const updateDehumidifier = async (id, data) => {
  const response = await api.put(`/dehumidifiers/${id}`, data);
  return response.data;
};

export const deleteDehumidifier = async (id) => {
  const response = await api.delete(`/dehumidifiers/${id}`);
  return response.data;
};

export const getMovePlans = async () => {
  const response = await api.get('/move-plans');
  return response.data;
};

export const createMovePlan = async (data) => {
  const response = await api.post('/move-plans', data);
  return response.data;
};

export const updateMovePlan = async (id, data) => {
  const response = await api.put(`/move-plans/${id}`, data);
  return response.data;
};

export const deleteMovePlan = async (id) => {
  const response = await api.delete(`/move-plans/${id}`);
  return response.data;
};

export const getMoveTasks = async (bookshelfId = null, status = null) => {
  const params = {};
  if (bookshelfId) params.bookshelf_id = bookshelfId;
  if (status) params.status = status;
  const response = await api.get('/move-tasks', { params });
  return response.data;
};

export const createMoveTask = async (data) => {
  const response = await api.post('/move-tasks', data);
  return response.data;
};

export const updateMoveTask = async (id, data) => {
  const response = await api.put(`/move-tasks/${id}`, data);
  return response.data;
};

export const getInspectionRecords = async (bookshelfId = null) => {
  const params = bookshelfId ? { bookshelf_id: bookshelfId } : {};
  const response = await api.get('/inspection-records', { params });
  return response.data;
};

export const createInspectionRecord = async (data) => {
  const response = await api.post('/inspection-records', data);
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export default api;
