// useEnrollments Hook - Manage course enrollments
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';
import type { Enrollment } from '../types/database.types';

interface UseEnrollmentsReturn {
  enrollments: any[];
  loading: boolean;
  error: Error | null;
  enrollStudent: (studentId: string, courseId: string) => Promise<any>;
  createEnrollment: (data: { student_id?: string; course_id: string; status?: string }) => Promise<any>;
  updateStatus: (enrollmentId: string, status: string) => Promise<any>;
  updateProgress: (enrollmentId: string, progress: number) => Promise<any>;
  unenrollStudent: (enrollmentId: string) => Promise<void>;
  refreshEnrollments: () => Promise<void>;
}

export function useEnrollments(filters?: { student_id?: string; course_id?: string; status?: string }): UseEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters?.student_id,
    filters?.course_id,
    filters?.status
  ]);

  // Build query params
  const buildQueryParams = useCallback(() => {
    if (!memoizedFilters) return '';
    const params = new URLSearchParams();
    if (memoizedFilters.student_id) params.append('student_id', memoizedFilters.student_id);
    if (memoizedFilters.course_id) params.append('course_id', memoizedFilters.course_id);
    if (memoizedFilters.status) params.append('status', memoizedFilters.status);
    return params.toString();
  }, [memoizedFilters]);

  // Fetch enrollments with progress data
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If we have a student_id filter, use the progress endpoint for detailed data
      if (memoizedFilters?.student_id) {
        const response = await api.get<{ success: boolean; data: any[] }>(`/progress/student/${memoizedFilters.student_id}`);
        if (response.success) {
          setEnrollments(response.data);
        }
      } else {
        // For other cases, use the regular enrollments endpoint
        const queryParams = buildQueryParams();
        const url = `/enrollments${queryParams ? `?${queryParams}` : ''}`;
        const response = await api.get<{ success: boolean; data: any[] }>(url);
        
        if (response.success) {
          setEnrollments(response.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, memoizedFilters]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Enroll student
  const enrollStudent = async (studentId: string, courseId: string): Promise<any> => {
    try {
      const response = await api.post<{ success: boolean; data: any }>('/enrollments', {
        student_id: studentId,
        course_id: courseId
      });
      
      if (response.success) {
        setEnrollments(prev => [response.data, ...prev]);
        return response.data;
      }
      
      throw new Error('Failed to enroll student');
    } catch (err: any) {
      console.error('Error enrolling student:', err);
      throw err;
    }
  };

  // Backward/forward compatible creator used by UI layers
  const createEnrollment = async (data: { student_id?: string; course_id: string; status?: string }): Promise<any> => {
    try {
      const response = await api.post<{ success: boolean; data: any }>('/enrollments', data);
      if (response.success) {
        setEnrollments(prev => [response.data, ...prev]);
        return response.data;
      }
      throw new Error('Failed to enroll student');
    } catch (err: any) {
      console.error('Error creating enrollment:', err);
      throw err;
    }
  };

  // Update status
  const updateStatus = async (enrollmentId: string, status: string): Promise<any> => {
    try {
      const response = await api.put<{ success: boolean; data: any }>(`/enrollments/${enrollmentId}/status`, { status });
      
      if (response.success) {
        setEnrollments(prev =>
          prev.map(e => e.id === enrollmentId ? response.data : e)
        );
        return response.data;
      }
      
      throw new Error('Failed to update status');
    } catch (err: any) {
      console.error('Error updating enrollment status:', err);
      throw err;
    }
  };

  // Update progress
  const updateProgress = async (enrollmentId: string, progress: number): Promise<any> => {
    try {
      const response = await api.put<{ success: boolean; data: any }>(`/enrollments/${enrollmentId}/progress`, {
        progress_percentage: progress
      });
      
      if (response.success) {
        setEnrollments(prev =>
          prev.map(e => e.id === enrollmentId ? response.data : e)
        );
        return response.data;
      }
      
      throw new Error('Failed to update progress');
    } catch (err: any) {
      console.error('Error updating progress:', err);
      throw err;
    }
  };

  // Unenroll
  const unenrollStudent = async (enrollmentId: string): Promise<void> => {
    try {
      const response = await api.del<{ success: boolean }>(`/enrollments/${enrollmentId}`);
      
      if (response.success) {
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      }
    } catch (err: any) {
      console.error('Error unenrolling student:', err);
      throw err;
    }
  };

  return {
    enrollments,
    loading,
    error,
    enrollStudent,
    createEnrollment,
    updateStatus,
    updateProgress,
    unenrollStudent,
    refreshEnrollments: fetchEnrollments
  };
}

export default useEnrollments;

