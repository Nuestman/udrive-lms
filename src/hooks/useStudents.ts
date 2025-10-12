// useStudents Hook - Manage students data
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { UserProfile } from '../types/database.types';

interface UseStudentsReturn {
  students: UserProfile[];
  loading: boolean;
  error: Error | null;
  createStudent: (studentData: any) => Promise<UserProfile>;
  updateStudent: (id: string, updates: Partial<UserProfile>) => Promise<UserProfile>;
  deleteStudent: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
  getStudent: (id: string) => UserProfile | undefined;
}

export function useStudents(filters?: { status?: string; search?: string }): UseStudentsReturn {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      const queryString = params.toString();
      
      const url = `/students${queryString ? `?${queryString}` : ''}`;
      const response = await api.get<{ success: boolean; data: UserProfile[] }>(url);
      
      if (response.success) {
        setStudents(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.search]); // Use individual values, not object

  // Initial load and when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Create student
  const createStudent = async (studentData: any): Promise<UserProfile> => {
    try {
      const response = await api.post<{ success: boolean; data: UserProfile }>('/students', studentData);
      
      if (response.success) {
        setStudents(prev => [response.data, ...prev]);
        return response.data;
      }
      
      throw new Error('Failed to create student');
    } catch (err: any) {
      console.error('Error creating student:', err);
      throw err;
    }
  };

  // Update student
  const updateStudent = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: UserProfile }>(`/students/${id}`, updates);
      
      if (response.success) {
        setStudents(prev =>
          prev.map(student =>
            student.id === id ? { ...student, ...response.data } : student
          )
        );
        return response.data;
      }
      
      throw new Error('Failed to update student');
    } catch (err: any) {
      console.error('Error updating student:', err);
      throw err;
    }
  };

  // Delete student
  const deleteStudent = async (id: string): Promise<void> => {
    try {
      const response = await api.del<{ success: boolean }>(`/students/${id}`);
      
      if (response.success) {
        setStudents(prev => prev.filter(student => student.id !== id));
      }
    } catch (err: any) {
      console.error('Error deleting student:', err);
      throw err;
    }
  };

  // Get single student
  const getStudent = (id: string): UserProfile | undefined => {
    return students.find(student => student.id === id);
  };

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    refreshStudents: fetchStudents,
    getStudent
  };
}

export default useStudents;

