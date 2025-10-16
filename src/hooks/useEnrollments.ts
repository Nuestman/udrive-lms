// useEnrollments Hook - Manage course enrollments
import { useState, useEffect, useCallback } from 'react';
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

  // Build query params
  const buildQueryParams = useCallback(() => {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.course_id) params.append('course_id', filters.course_id);
    if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [filters]);

  // Fetch enrollments
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const url = `/enrollments${queryParams ? `?${queryParams}` : ''}`;
      const response = await api.get<{ success: boolean; data: any[] }>(url);
      
      if (response.success) {
        setEnrollments(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

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

