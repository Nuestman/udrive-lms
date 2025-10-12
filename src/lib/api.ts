// API Client for Frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make API request
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * GET request
 */
export function get<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export function post<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export function put<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export function del<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

/**
 * Authentication API
 */
export const authApi = {
  login: (email: string, password: string) =>
    post<{ success: boolean; user: any; token: string }>('/auth/login', { email, password }),

  signup: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    tenant_id: string;
    role?: string;
  }) => post<{ success: boolean; user: any; token: string }>('/auth/signup', data),

  logout: () => post('/auth/logout'),

  getCurrentUser: () => get<{ success: boolean; user: any }>('/auth/me'),

  updateProfile: (updates: any) => put('/auth/profile', updates),

  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    post('/auth/reset-password', { token, newPassword }),
};

/**
 * Courses API
 */
export const coursesApi = {
  getAll: () => get<{ success: boolean; data: any[] }>('/courses'),
  getById: (id: string) => get<{ success: boolean; data: any }>(`/courses/${id}`),
  getFull: (id: string) => get<{ success: boolean; data: any }>(`/courses/${id}/full`),
  getStats: (id: string) => get<{ success: boolean; data: any }>(`/courses/${id}/stats`),
  create: (data: any) => post<{ success: boolean; data: any }>('/courses', data),
  update: (id: string, data: any) => put<{ success: boolean; data: any }>(`/courses/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/courses/${id}`),
  publish: (id: string) => post<{ success: boolean; data: any }>(`/courses/${id}/publish`),
};

/**
 * Modules API
 */
export const modulesApi = {
  getByCourse: (courseId: string) => get<{ success: boolean; data: any[] }>(`/modules/course/${courseId}`),
  getById: (id: string) => get<{ success: boolean; data: any }>(`/modules/${id}`),
  create: (data: any) => post<{ success: boolean; data: any }>('/modules', data),
  update: (id: string, data: any) => put<{ success: boolean; data: any }>(`/modules/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/modules/${id}`),
  reorder: (courseId: string, moduleOrders: any[]) => 
    post<{ success: boolean }>(`/modules/course/${courseId}/reorder`, { moduleOrders }),
};

export default {
  get,
  post,
  put,
  del,
  authApi,
  coursesApi,
  modulesApi,
};





