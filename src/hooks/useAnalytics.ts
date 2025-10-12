// useAnalytics Hook - Dashboard statistics
import { useState, useEffect } from 'react';
import api from '../lib/api';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  activeInstructors: number;
  totalEnrollments: number;
  activeEnrollments: number;
  monthlyEnrollments: number;
  averageProgress: number;
  completionRate: number;
  certificatesIssued: number;
  monthlyCertificates: number;
}

export function useAnalytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard');
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: fetchStats };
}

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchActivity();
  }, [limit]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: any[] }>(`/analytics/activity?limit=${limit}`);
      
      if (response.success) {
        setActivities(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching activity:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, error, refresh: fetchActivity };
}

export default useAnalytics;

