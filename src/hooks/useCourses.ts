// useCourses Hook - Manage courses data
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import type { Course } from '../types/database.types';

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: Error | null;
  createCourse: (courseData: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  publishCourse: (id: string) => Promise<Course>;
  refreshCourses: () => Promise<void>;
  getCourse: (id: string) => Course | undefined;
}

export function useCourses(): UseCoursesReturn {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: Course[] }>('/courses');
      
      if (response.success) {
        setCourses(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Initial load
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Create new course
  const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
    try {
      const response = await api.post<{ success: boolean; data: Course; message: string }>('/courses', courseData);
      
      if (response.success) {
        // Add to local state
        setCourses(prevCourses => [response.data, ...prevCourses]);
        return response.data;
      }
      
      throw new Error('Failed to create course');
    } catch (err: any) {
      console.error('Error creating course:', err);
      throw err;
    }
  };

  // Update existing course
  const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course> => {
    try {
      const response = await api.put<{ success: boolean; data: Course; message: string }>(`/courses/${id}`, updates);
      
      if (response.success) {
        // Update in local state
        setCourses(prevCourses =>
          prevCourses.map(course =>
            course.id === id ? { ...course, ...response.data } : course
          )
        );
        return response.data;
      }
      
      throw new Error('Failed to update course');
    } catch (err: any) {
      console.error('Error updating course:', err);
      throw err;
    }
  };

  // Delete course
  const deleteCourse = async (id: string): Promise<void> => {
    try {
      const response = await api.del<{ success: boolean; message: string }>(`/courses/${id}`);
      
      if (response.success) {
        // Remove from local state
        setCourses(prevCourses => prevCourses.filter(course => course.id !== id));
      } else {
        throw new Error('Failed to delete course');
      }
    } catch (err: any) {
      console.error('Error deleting course:', err);
      throw err;
    }
  };

  // Publish course
  const publishCourse = async (id: string): Promise<Course> => {
    try {
      const response = await api.post<{ success: boolean; data: Course; message: string }>(`/courses/${id}/publish`);
      
      if (response.success) {
        // Update in local state
        setCourses(prevCourses =>
          prevCourses.map(course =>
            course.id === id ? response.data : course
          )
        );
        return response.data;
      }
      
      throw new Error('Failed to publish course');
    } catch (err: any) {
      console.error('Error publishing course:', err);
      throw err;
    }
  };

  // Get single course from local state
  const getCourse = (id: string): Course | undefined => {
    return courses.find(course => course.id === id);
  };

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    refreshCourses: fetchCourses,
    getCourse
  };
}

export default useCourses;

