// API Client for Frontend
// Automatically detect if we should use relative URLs
// When accessed from external device (non-localhost) or through browser-sync, use relative URLs
const envApiUrl = import.meta.env.VITE_API_URL;
const isBrowserSync = typeof window !== 'undefined' && window.location.port === '3000';
const isExternalAccess = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

// Use relative URL if:
// 1. VITE_API_URL starts with '/' (explicitly set for proxy)
// 2. We're accessing through browser-sync (port 3000)
// 3. We're accessing from an external device (non-localhost) - Vite will proxy it
// Otherwise use the configured URL or default to localhost
const API_URL = (envApiUrl?.startsWith('/') || isBrowserSync || isExternalAccess)
  ? '/api'
  : (envApiUrl || 'http://localhost:5000/api');

// Log API URL configuration for debugging
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[API Client] API URL:', API_URL);
  console.log('[API Client] Hostname:', window.location.hostname);
  console.log('[API Client] Port:', window.location.port);
  console.log('[API Client] Browser-sync detected:', isBrowserSync);
  console.log('[API Client] External access detected:', isExternalAccess);
}

// Store active role for API requests
let activeRole: string | null = null;

export const setActiveRole = (role: string | null) => {
  activeRole = role;
};

export const getActiveRole = () => activeRole;

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
      ...(activeRole ? { 'X-Active-Role': activeRole } : {}),
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
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error message from JSON, but handle non-JSON responses
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, throw a more helpful error
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error: any) {
    // Enhanced error logging
    console.error('API Error:', {
      url,
      method: config.method || 'GET',
      error: error.message,
      stack: error.stack
    });
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check if the backend is running and accessible.');
    }
    
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

  switchRole: (activeRole: string) =>
    put<{ success: boolean; user: any; message: string }>('/auth/switch-role', { active_role: activeRole }),
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
 * Enrollments API - Student enrollments
 * - Students can enroll themselves (server enforces role)
 * - Admins/Instructors enroll students by passing a student_id
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
    student_id?: string; // Optional for student self-enrollment only; server enforces role
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
 * Reviews API - User feedback and moderation
 */
export const reviewsApi = {
  submit: (data: {
    type: 'course' | 'school';
    targetId?: string;
    rating?: number | null;
    title?: string | null;
    body: string;
  }) =>
    post<{ success: boolean; data: any; message: string }>('/reviews', data),

  mine: () => get<{ success: boolean; data: any[] }>('/reviews/mine'),

  list: (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: 'platform' | 'course' | 'school';
    user_id?: string;
    reviewable_id?: string;
    search?: string;
    visibility?: 'private' | 'public';
    limit?: number;
    offset?: number;
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
      `/reviews${queryString ? `?${queryString}` : ''}`
    );
  },

  updateStatus: (id: string, status: 'pending' | 'approved' | 'rejected') =>
    put<{ success: boolean; data: any; message: string }>(`/reviews/${id}/status`, {
      status,
    }),

  updateVisibility: (id: string, visibility: 'private' | 'public') =>
    put<{ success: boolean; data: any; message: string }>(`/reviews/${id}/visibility`, {
      visibility,
    }),

  getPublic: (params?: { type?: 'platform' | 'course' | 'school'; limit?: number; reviewable_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) {
      queryParams.set('type', params.type);
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }
    if (params?.reviewable_id) {
      queryParams.set('reviewable_id', params.reviewable_id);
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[] }>(
      `/reviews/public${queryString ? `?${queryString}` : ''}`
    );
  },
  comment: (reviewId: string, data: { body: string }) =>
    post<{ success: boolean; data: any; message: string }>(`/reviews/${reviewId}/comments`, data),
};

/**
 * Feedback API - Platform surveys
 */
export const feedbackApi = {
  submitPlatform: (data: {
    onboarding_score?: number | null;
    usability_score?: number | null;
    ui_score?: number | null;
    navigation_score?: number | null;
    support_score?: number | null;
    role_context?: string | null;
    comments?: string | null;
    submitted_from?: string | null;
    additional_context?: Record<string, any>;
  }) => post<{ success: boolean; data: any; message: string }>('/feedback/platform', data),

  listPlatform: (params?: { tenant_id?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.tenant_id) {
      queryParams.set('tenant_id', params.tenant_id);
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.set('offset', params.offset.toString());
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[] }>(
      `/feedback/platform${queryString ? `?${queryString}` : ''}`
    );
  },

  getSummary: (params?: { tenant_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.tenant_id) {
      queryParams.set('tenant_id', params.tenant_id);
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any }>(
      `/feedback/platform/summary${queryString ? `?${queryString}` : ''}`
    );
  },
};

/**
 * Testimonials API
 */
export const testimonialsApi = {
  listPublic: (params?: { placement?: string; limit?: number; featured?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.placement) {
      queryParams.set('placement', params.placement);
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }
    if (params?.featured !== undefined) {
      queryParams.set('featured', params.featured ? 'true' : 'false');
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[] }>(
      `/testimonials/public${queryString ? `?${queryString}` : ''}`
    );
  },

  list: (params?: { status?: 'draft' | 'published' | 'archived'; placement?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) {
      queryParams.set('status', params.status);
    }
    if (params?.placement) {
      queryParams.set('placement', params.placement);
    }
    const queryString = queryParams.toString();
    return get<{ success: boolean; data: any[] }>(
      `/testimonials${queryString ? `?${queryString}` : ''}`
    );
  },

  create: (data: any) => post<{ success: boolean; data: any; message: string }>('/testimonials', data),

  update: (id: string, data: any) =>
    put<{ success: boolean; data: any; message: string }>(`/testimonials/${id}`, data),

  remove: (id: string) => del<{ success: boolean; message: string }>(`/testimonials/${id}`),
};

/**
 * Course Review Settings API
 */
export const reviewSettingsApi = {
  get: (courseId: string) =>
    get<{ success: boolean; data: any | null }>(`/review-settings/${courseId}`),

  update: (courseId: string, data: any) =>
    put<{ success: boolean; data: any; message: string }>(`/review-settings/${courseId}`, data),
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

/**
 * SCORM API
 */
export const scormApi = {
  uploadPackage: (file: File, courseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (courseId) {
      formData.append('courseId', courseId);
    }
    return post<{ success: boolean; data: { package: any; scos: any[] } }>('/scorm/upload', formData);
  },

  listPackages: () =>
    get<{ success: boolean; data: any[] }>('/scorm/packages'),

  listScos: (packageId: string) =>
    get<{ success: boolean; data: { package: any; scos: any[] } }>(`/scorm/packages/${packageId}/sco-list`),

  createCourseFromPackage: (packageId: string, courseData?: {
    title?: string;
    description?: string;
    status?: string;
    duration_weeks?: number;
    price?: number;
  }) =>
    post<{ success: boolean; data: any }>(`/scorm/packages/${packageId}/create-course`, courseData || {}),

  getPackageByCourseId: (courseId: string) =>
    get<{ success: boolean; data: { package: any; scos: any[] } | null }>(`/scorm/course/${courseId}/package`),

  verifyFile: (packageId: string, filePath: string) =>
    get<{ success: boolean; data: { exists: boolean; isFile: boolean; isDirectory: boolean; size: number; path: string } }>(
      `/scorm/verify-file/${packageId}?filePath=${encodeURIComponent(filePath)}`
    ),

  deletePackage: (packageId: string) =>
    del<{ success: boolean; message: string }>(`/scorm/packages/${packageId}`),
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
  reviews: reviewsApi,
  feedback: feedbackApi,
  testimonials: testimonialsApi,
  reviewSettings: reviewSettingsApi,
  quizzes: quizzesApi,
  scorm: scormApi,
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
  reviewsApi,
  feedbackApi,
  testimonialsApi,
  reviewSettingsApi,
  quizzesApi,
  scorm: scormApi,
};

