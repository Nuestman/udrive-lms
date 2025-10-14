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

/**
 * Users API
 */
export const usersApi = {
  getAll: (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[]; pagination: any }>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: (id: string) =>
    get<{ success: boolean; data: any }>(`/users/${id}`),

  getStatistics: () =>
    get<{ success: boolean; data: any }>('/users/statistics'),

  getActivity: (days: number = 30) =>
    get<{ success: boolean; data: any[] }>(`/users/activity?days=${days}`),

  getTopUsers: (limit: number = 10) =>
    get<{ success: boolean; data: any[] }>(`/users/top?limit=${limit}`),

  create: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    tenant_id?: string;
    phone?: string;
    avatar_url?: string;
  }) => post<{ success: boolean; data: any; message: string }>('/users', data),

  update: (id: string, data: any) =>
    put<{ success: boolean; data: any; message: string }>(`/users/${id}`, data),

  delete: (id: string) =>
    del<{ success: boolean; message: string }>(`/users/${id}`),

  permanentlyDelete: (id: string) =>
    del<{ success: boolean; message: string }>(`/users/${id}/permanent`),

  resetPassword: (id: string, newPassword: string) =>
    post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      newPassword,
    }),

  bulkUpdate: (userIds: string[], updates: any) =>
    post<{ success: boolean; updatedCount: number; message: string }>(
      '/users/bulk-update',
      { userIds, updates }
    ),
};

/**
 * Instructors API
 */
export const instructorsApi = {
  getAll: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[]; pagination: any }>(
      `/instructors${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: (id: string) =>
    get<{ success: boolean; data: any }>(`/instructors/${id}`),

  getStatistics: () =>
    get<{ success: boolean; data: any }>('/instructors/statistics'),

  getActivity: (days: number = 30) =>
    get<{ success: boolean; data: any[] }>(`/instructors/activity?days=${days}`),

  getTopInstructors: (limit: number = 10) =>
    get<{ success: boolean; data: any[] }>(`/instructors/top?limit=${limit}`),

  getCourses: (id: string) =>
    get<{ success: boolean; data: any[] }>(`/instructors/${id}/courses`),

  create: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id?: string;
    phone?: string;
    avatar_url?: string;
  }) => post<{ success: boolean; data: any; message: string }>('/instructors', data),

  update: (id: string, data: any) =>
    put<{ success: boolean; data: any; message: string }>(`/instructors/${id}`, data),

  assignCourse: (id: string, courseId: string) =>
    post<{ success: boolean; data: any; message: string }>(`/instructors/${id}/assign-course`, {
      courseId,
    }),
};

export default {
  get,
  post,
  put,
  del,
  authApi,
  coursesApi,
  modulesApi,
  usersApi,
  instructorsApi,
};

