// useLessons Hook - Lesson management
import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Lesson } from '../types/database.types';

export function useLessons(moduleId?: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (moduleId) {
      fetchLessons();
    }
  }, [moduleId]);

  const fetchLessons = async () => {
    if (!moduleId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/lessons/module/${moduleId}`);
      
      if (response.success) {
        setLessons(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching lessons:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (lessonData: Partial<Lesson>) => {
    try {
      const response = await api.post('/lessons', lessonData);
      
      if (response.success) {
        await fetchLessons();
        return response.data;
      }
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      throw err;
    }
  };

  const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>) => {
    try {
      const response = await api.put(`/lessons/${lessonId}`, lessonData);
      
      if (response.success) {
        await fetchLessons();
        return response.data;
      }
    } catch (err: any) {
      console.error('Error updating lesson:', err);
      throw err;
    }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      const response = await api.del(`/lessons/${lessonId}`);
      
      if ((response as any)?.success) {
        await fetchLessons();
      }
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      throw err;
    }
  };

  const reorderLessons = async (lessonOrders: Array<{ lesson_id: string; order_index: number }>) => {
    if (!moduleId) return;
    
    try {
      const response = await api.post(`/lessons/module/${moduleId}/reorder`, { lessonOrders });
      
      if (response.success) {
        await fetchLessons();
      }
    } catch (err: any) {
      console.error('Error reordering lessons:', err);
      throw err;
    }
  };

  const markComplete = async (lessonId: string) => {
    try {
      const response = await api.post(`/lessons/${lessonId}/complete`);
      
      if (response.success) {
        await fetchLessons();
        return response.data;
      }
    } catch (err: any) {
      console.error('Error marking lesson complete:', err);
      throw err;
    }
  };

  return {
    lessons,
    loading,
    error,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    markComplete,
    refresh: fetchLessons
  };
}

export default useLessons;

