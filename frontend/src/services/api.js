import axios from 'axios';

// Mengambil URL dasar API dari environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Listener untuk menyimpan instance ID yang melayani request (load balancer verification)
let onInstanceIdReceived = null;

export const setInstanceIdCallback = (callback) => {
  onInstanceIdReceived = callback;
};

// Request Interceptor: Menyisipkan token JWT jika ada di localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('simaris_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Menangani error 401 dan menangkap X-Instance-Id header
api.interceptors.response.use(
  (response) => {
    // Tangkap header X-Instance-Id (baik case-sensitive maupun tidak)
    const instanceId = response.headers['x-instance-id'] || response.headers['X-Instance-Id'];
    if (instanceId && onInstanceIdReceived) {
      onInstanceIdReceived(instanceId);
    }
    return response;
  },
  (error) => {
    // Jika response ada, periksa header X-Instance-Id
    if (error.response) {
      const instanceId = error.response.headers['x-instance-id'] || error.response.headers['X-Instance-Id'];
      if (instanceId && onInstanceIdReceived) {
        onInstanceIdReceived(instanceId);
      }

      // Jika tidak terotorisasi (401), bersihkan token dan redirect ke login
      if (error.response.status === 401) {
        localStorage.removeItem('simaris_token');
        // Gunakan window.location agar aplikasi ter-refresh dan mengarah ke login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// NAMED EXPORTS: FUNGSI API SETIAP MODUL
// ============================================================================

// 1. AUTH API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data; // format sukses -> { success: true, data: {...} }
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  users: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
};

// 2. INVENTARIS API
export const inventarisAPI = {
  list: async (params) => {
    const response = await api.get('/inventaris', { params });
    return response.data;
  },
  categories: async () => {
    const response = await api.get('/inventaris/categories');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/inventaris/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/inventaris', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/inventaris/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/inventaris/${id}`);
    return response.data;
  },
};

// 3. PEMINJAMAN API
export const peminjamanAPI = {
  list: async (params) => {
    const response = await api.get('/peminjaman', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/peminjaman', data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.put(`/peminjaman/${id}/approve`);
    return response.data;
  },
  reject: async (id) => {
    const response = await api.put(`/peminjaman/${id}/reject`);
    return response.data;
  },
  return: async (id, data) => {
    const response = await api.put(`/peminjaman/${id}/return`, data);
    return response.data;
  },
};

// 4. MAINTENANCE API
export const maintenanceAPI = {
  list: async (params) => {
    const response = await api.get('/maintenance', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },
  start: async (id) => {
    const response = await api.put(`/maintenance/${id}/start`);
    return response.data;
  },
  complete: async (id, data) => {
    const response = await api.put(`/maintenance/${id}/complete`, data);
    return response.data;
  },
};

// 5. PENGADAAN API
export const pengadaanAPI = {
  list: async () => {
    const response = await api.get('/pengadaan');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/pengadaan', data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.put(`/pengadaan/${id}/approve`);
    return response.data;
  },
  arrived: async (id, data) => {
    const response = await api.put(`/pengadaan/${id}/arrived`, data);
    return response.data;
  },
};

// 6. PENGHAPUSAN API
export const penghapusanAPI = {
  list: async () => {
    const response = await api.get('/penghapusan');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/penghapusan', data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.put(`/penghapusan/${id}/approve`);
    return response.data;
  },
};

// 7. ACTIVITY LOG API
export const activitylogAPI = {
  list: async (params) => {
    const response = await api.get('/activitylog', { params });
    return response.data;
  },
  export: async (params) => {
    // Return raw response atau URL untuk download file log
    const response = await api.get('/activitylog/export', { params, responseType: 'blob' });
    return response;
  },
};

// 8. DASHBOARD API
export const dashboardAPI = {
  summary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  recentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },
  alerts: async () => {
    const response = await api.get('/dashboard/low-stock');
    return response.data;
  },
};

export default api;
