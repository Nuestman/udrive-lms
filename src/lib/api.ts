// API Client for Frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  // Prevent double "/api" when API_URL already ends with /api and endpoint starts with /api
  const shouldStripLeadingApi = API_URL.endsWith('/api') && endpoint.startsWith('/api/');
  const normalizedEndpoint = shouldStripLeadingApi ? endpoint.slice(4) : endpoint;
  const url = `${API_URL}${normalizedEndpoint}`;
  
  const bearer = localStorage.getItem('token');
  const config: RequestInit = {
    ...options,
    headers: {
      ...(bearer ? { 'Authorization': `Bearer ${bearer}` } : {}),
      ...options.headers,
    },
    credentials: 'include', // Include cookies
  };

  // Detect FormData robustly to avoid forcing JSON headers on uploads
  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body &&
    (options.body instanceof FormData || (typeof (options.body as any).append === 'function' && typeof (options.body as any) !== 'string'));

  // Only set Content-Type for JSON requests
  if (!isFormData) {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

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
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });
}

/**
 * PUT request
 */
export function put<T = any>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
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
  login: (email: string, password: string, twoFactorToken?: string) =>
    post<{ success: boolean; user: any; token: string; requires2FA?: boolean; userId?: string; message?: string }>('/auth/login', { email, password, twoFactorToken }),

  verify2FA: (userId: string, twoFactorToken: string) =>
    post<{ success: boolean; user: any; token: string }>('/auth/verify-2fa', { userId, twoFactorToken }),

  signup: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    tenant_id?: string;
    subdomain?: string;
    role?: string;
  }) => post<{ success: boolean; user: any; token: string }>('/auth/signup', data),

  logout: () => post('/auth/logout'),

  getCurrentUser: () => get<{ success: boolean; user: any; token: string }>('/auth/me'),

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

  getTopUsers: (limit: number = 10, timeFilter: string = 'all') =>
    get<{ success: boolean; data: any[] }>(`/users/top?limit=${limit}&timeFilter=${timeFilter}`),

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
    post<{ success: boolean; updatedCount: number; message: string; emailStats?: { attempted: number; sent: number; failed: number; emailEnabled: boolean } }>(
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

/**
 * Students API
 */
export const studentsApi = {
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
      `/students${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: (id: string) =>
    get<{ success: boolean; data: any }>(`/students/${id}`),

  create: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id?: string;
    phone?: string;
  }) => post<{ success: boolean; data: any; message: string }>('/students', data),

  update: (id: string, data: any) =>
    put<{ success: boolean; data: any; message: string }>(`/students/${id}`, data),

  delete: (id: string) =>
    del<{ success: boolean; message: string }>(`/students/${id}`),

  getEnrollments: (id: string) =>
    get<{ success: boolean; data: any[] }>(`/students/${id}/enrollments`),

  getProgress: (id: string) =>
    get<{ success: boolean; data: any }>(`/students/${id}/progress`),
};

/**
 * Enrollments API - Universal enrollment for all user roles
 */
export const enrollmentsApi = {
  getAll: (params?: {
    student_id?: string;
    course_id?: string;
    status?: string;
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
    return get<{ success: boolean; data: any[] }>(
      `/enrollments${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: (id: string) =>
    get<{ success: boolean; data: any }>(`/enrollments/${id}`),

  getByStudent: (studentId: string) =>
    get<{ success: boolean; data: any[] }>(`/enrollments/student/${studentId}`),

  create: (data: {
    student_id?: string; // Optional - defaults to current user if not provided
    course_id: string;
  }) => post<{ success: boolean; data: any; message: string }>('/enrollments', data),

  updateStatus: (id: string, status: string) =>
    put<{ success: boolean; data: any; message: string }>(`/enrollments/${id}/status`, { status }),

  updateProgress: (id: string, progress_percentage: number) =>
    put<{ success: boolean; data: any }>(`/enrollments/${id}/progress`, { progress_percentage }),

  delete: (id: string) =>
    del<{ success: boolean; message: string }>(`/enrollments/${id}`),
};

/**
 * Quizzes API
 */
export const quizzesApi = {
  // Create a quiz for a module
  create: (data: {
    module_id: string;
    title: string;
    description?: string;
    passing_score?: number;
    time_limit?: number; // minutes
    attempts_allowed?: number;
  }) => post<{ success: boolean; data: any }>('/quizzes', data),

  // Get quiz by id (includes questions)
  getById: (id: string) => get<{ success: boolean; data: any }>(`/quizzes/${id}`),

  // Add question to quiz
  addQuestion: (
    quizId: string,
    question: {
      question_text: string;
      question_type: 'multiple_choice' | 'true_false' | 'short_answer';
      options?: string[];
      correct_answer: any;
      points?: number;
    }
  ) => post<{ success: boolean; data: any }>(`/quizzes/${quizId}/questions`, question),

  // Update question
  updateQuestion: (
    quizId: string,
    questionId: string,
    updates: any,
  ) => put<{ success: boolean; data: any }>(`/quizzes/${quizId}/questions/${questionId}`, updates),

  // Delete question
  deleteQuestion: (quizId: string, questionId: string) => del<{ success: boolean }>(`/quizzes/${quizId}/questions/${questionId}`),

  // Submit a quiz attempt
  submit: (
    quizId: string,
    payload: { answers: Record<string, any> }
  ) => post<{ success: boolean; data: any }>(`/quizzes/${quizId}/submit`, payload),

  // Get attempts for current student
  getAttempts: (quizId: string) => get<{ success: boolean; data: any[] }>(`/quizzes/${quizId}/attempts`),

  // List quizzes by module
  listByModule: (moduleId: string) => get<{ success: boolean; data: any[] }>(`/quizzes/module/${moduleId}`),

  // Update a quiz
  update: (id: string, updates: any) => put<{ success: boolean; data: any }>(`/quizzes/${id}`, updates),

  // Delete a quiz
  delete: (id: string) => del<{ success: boolean }>(`/quizzes/${id}`),
};

// Main API object with all methods
export const api = {
  get,
  post,
  put,
  del,
  auth: authApi,
  courses: coursesApi,
  modules: modulesApi,
  users: usersApi,
  instructors: instructorsApi,
  students: studentsApi,
  enrollments: enrollmentsApi,
  quizzes: quizzesApi,
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
  studentsApi,
  enrollmentsApi,
  quizzesApi,
};

