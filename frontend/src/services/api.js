import axios from 'axios';

// Production or local development backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token or municipal password
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('up_token');
    const municipalPass = localStorage.getItem('municipal_pass');
    
    if (municipalPass) {
      config.headers['x-municipal-pass'] = municipalPass;
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  googleLogin: async (googleData) => {
    const response = await apiClient.post('/auth/google', googleData);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

export const reportService = {
  // Submit a new civic issue report
  submitReport: async (reportData) => {
    const response = await apiClient.post('/issues', reportData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Fetch all issues (e.g., for map and dashboard)
  getIssues: async (params = {}) => {
    const response = await apiClient.get('/issues', { params });
    return response.data;
  },

  // Fetch a single issue by ID
  getIssueById: async (id) => {
    const response = await apiClient.get(`/issues/${id}`);
    return response.data;
  },

  // Update an issue (status etc.) — authority only
  updateIssue: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await apiClient.put(`/issues/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
    return response.data;
  }
};

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  }
};

