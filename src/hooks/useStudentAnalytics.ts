// useStudentAnalytics Hook - Student progress analytics and statistics
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface StudentAnalytics {
  totalCourses: number;
  completedCourses: number;
  activeCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalTimeSpent: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  lastActivity: string | null;
  weeklyProgress: Array<{
    week: string;
    lessonsCompleted: number;
    quizzesCompleted: number;
    timeSpent: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progressPercentage: number;
    lessonsCompleted: number;
    totalLessons: number;
    quizzesCompleted: number;
    totalQuizzes: number;
    averageScore: number;
    timeSpent: number;
    lastActivity: string | null;
  }>;
}

interface UseStudentAnalyticsReturn {
  analytics: StudentAnalytics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStudentAnalytics(studentId?: string): UseStudentAnalyticsReturn {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both progress data and analytics
      const [progressResponse, analyticsResponse] = await Promise.all([
        api.get(`/progress/student/${studentId}`),
        api.get(`/progress/student/${studentId}/analytics`)
      ]);
      
      if (progressResponse.success && analyticsResponse.success) {
        const progressData = progressResponse.data;
        const analyticsData = analyticsResponse.data;
        
        // Calculate comprehensive analytics
        const calculatedAnalytics: StudentAnalytics = {
          totalCourses: progressData.length,
          completedCourses: progressData.filter((course: any) => course.status === 'completed').length,
          activeCourses: progressData.filter((course: any) => course.status === 'active').length,
          totalLessons: progressData.reduce((sum: number, course: any) => sum + parseInt(course.total_lessons || 0), 0),
          completedLessons: progressData.reduce((sum: number, course: any) => sum + parseInt(course.completed_lessons || 0), 0),
          totalQuizzes: progressData.reduce((sum: number, course: any) => sum + parseInt(course.total_quizzes || 0), 0),
          completedQuizzes: progressData.reduce((sum: number, course: any) => sum + parseInt(course.completed_quizzes || 0), 0),
          averageScore: Math.round(progressData.reduce((sum: number, course: any) => sum + (parseFloat(course.average_score) || 0), 0) / progressData.length) || 0,
          totalTimeSpent: progressData.reduce((sum: number, course: any) => sum + parseInt(course.time_spent_minutes || 0), 0),
          currentStreak: analyticsData.currentStreak || 0,
          longestStreak: analyticsData.currentStreak || 0, // For now, same as current streak
          lastActivity: progressData.length > 0 ? progressData[0].updated_at : null,
          weeklyProgress: analyticsData.weeklyProgress || [],
          courseProgress: progressData.map((course: any) => ({
            courseId: course.course_id,
            courseTitle: course.course_title,
            progressPercentage: course.progress_percentage || 0,
            lessonsCompleted: parseInt(course.completed_lessons || 0),
            totalLessons: parseInt(course.total_lessons || 0),
            quizzesCompleted: parseInt(course.completed_quizzes || 0),
            totalQuizzes: parseInt(course.total_quizzes || 0),
            averageScore: Math.round(parseFloat(course.average_score) || 0),
            timeSpent: parseInt(course.time_spent_minutes || 0),
            lastActivity: course.updated_at
          }))
        };
        
        setAnalytics(calculatedAnalytics);
      }
    } catch (err: any) {
      console.error('Error fetching student analytics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  };
}

export default useStudentAnalytics;
