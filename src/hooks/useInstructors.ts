// Instructor Management Hook
import { useState, useEffect } from 'react';
import { instructorsApi } from '../lib/api';

export interface Instructor {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'instructor';
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  tenant_subdomain?: string;
  courses_count?: number;
  published_courses?: number;
  draft_courses?: number;
  total_students?: number;
  active_enrollments?: number;
  completed_enrollments?: number;
  avg_student_progress?: number;
}

export interface InstructorStatistics {
  total_instructors: number;
  active_instructors: number;
  inactive_instructors: number;
  new_instructors_week: number;
  new_instructors_month: number;
  total_courses: number;
  published_courses: number;
  total_students: number;
  avg_courses_per_instructor: number;
}

export interface InstructorActivity {
  date: string;
  new_instructors: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Hook for managing instructors
 */
export function useInstructors(initialFilters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState(initialFilters || {});

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await instructorsApi.getAll(filters);
      setInstructors(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch instructors');
      console.error('Fetch instructors error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [filters]);

  const updateFilters = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const goToPage = (page: number) => {
    setFilters({ ...filters, page });
  };

  const createInstructor = async (instructorData: any) => {
    try {
      const response = await instructorsApi.create(instructorData);
      await fetchInstructors();
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create instructor');
    }
  };

  const updateInstructor = async (instructorId: string, updates: any) => {
    try {
      const response = await instructorsApi.update(instructorId, updates);
      await fetchInstructors();
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update instructor');
    }
  };

  const assignCourse = async (instructorId: string, courseId: string) => {
    try {
      await instructorsApi.assignCourse(instructorId, courseId);
      await fetchInstructors();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to assign course');
    }
  };

  return {
    instructors,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    goToPage,
    createInstructor,
    updateInstructor,
    assignCourse,
    refresh: fetchInstructors
  };
}

/**
 * Hook for instructor statistics
 */
export function useInstructorStatistics() {
  const [statistics, setStatistics] = useState<InstructorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await instructorsApi.getStatistics();
        setStatistics(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch statistics');
        console.error('Fetch statistics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, loading, error };
}

/**
 * Hook for instructor activity over time
 */
export function useInstructorActivity(days: number = 30) {
  const [activity, setActivity] = useState<InstructorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await instructorsApi.getActivity(days);
        setActivity(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch activity');
        console.error('Fetch activity error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [days]);

  return { activity, loading, error };
}

/**
 * Hook for top instructors
 */
export function useTopInstructors(limit: number = 10) {
  const [topInstructors, setTopInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopInstructors = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await instructorsApi.getTopInstructors(limit);
        setTopInstructors(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch top instructors');
        console.error('Fetch top instructors error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopInstructors();
  }, [limit]);

  return { topInstructors, loading, error };
}

/**
 * Hook for instructor courses
 */
export function useInstructorCourses(instructorId: string) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await instructorsApi.getCourses(instructorId);
        setCourses(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch courses');
        console.error('Fetch courses error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [instructorId]);

  return { courses, loading, error };
}

