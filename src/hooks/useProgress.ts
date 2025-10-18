// useProgress Hook - Progress tracking
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useProgress(studentId?: string, courseId?: string) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (courseId) {
        // Get course-specific progress using unified endpoint (lessons + quizzes)
        response = await api.get(`/progress/course/${courseId}/student/${studentId}/unified`);
      } else {
        // Get overall progress
        response = await api.get(`/progress/student/${studentId}`);
      }
      
      if (response.success) {
        setProgress(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching progress:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [studentId, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markLessonComplete = async (lessonId: string) => {
    try {
      const response = await api.post(`/progress/lesson/${lessonId}/complete`);
      
      if (response.success) {
        await fetchProgress(); // Refresh progress
        return response.data;
      }
    } catch (err: any) {
      console.error('Error marking lesson complete:', err);
      throw err;
    }
  };

  const markLessonIncomplete = async (lessonId: string) => {
    try {
      const response = await api.post(`/progress/lesson/${lessonId}/incomplete`);
      
      if (response.success) {
        await fetchProgress(); // Refresh progress
        return response.data;
      }
    } catch (err: any) {
      console.error('Error marking lesson incomplete:', err);
      throw err;
    }
  };

  return {
    progress,
    loading,
    error,
    markLessonComplete,
    markLessonIncomplete,
    refresh: fetchProgress
  };
}

export default useProgress;

