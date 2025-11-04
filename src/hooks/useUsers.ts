// User Management Hook
import { useState, useEffect } from 'react';
import { usersApi } from '../lib/api';
import { UserWithProfile } from '../types/database.types';

// Extended User interface for admin management
export interface User extends UserWithProfile {
  tenant_name?: string;
  tenant_subdomain?: string;
  enrollment_count?: number;
  courses_created_count?: number;
  lessons_completed?: number;
  total_enrollments?: number;
  completed_lessons?: number;
  courses_created?: number;
  quiz_attempts?: number;
  recent_login_score?: number;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  super_admins: number;
  school_admins: number;
  instructors: number;
  students: number;
  new_users_week: number;
  new_users_month: number;
  active_last_week: number;
  active_last_month: number;
}

export interface UserActivity {
  date: string;
  new_users: number;
  new_students: number;
  new_instructors: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Hook for managing users
 */
export function useUsers(initialFilters?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState(initialFilters || {});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll(filters);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const updateFilters = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters, page: 1 }); // Reset to page 1 on filter change
  };

  const goToPage = (page: number) => {
    setFilters({ ...filters, page });
  };

  const createUser = async (userData: any) => {
    try {
      const response = await usersApi.create(userData);
      await fetchUsers(); // Refresh list
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create user');
    }
  };

  const updateUser = async (userId: string, updates: any) => {
    try {
      const response = await usersApi.update(userId, updates);
      await fetchUsers(); // Refresh list
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete user');
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      await usersApi.resetPassword(userId, newPassword);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reset password');
    }
  };

  const bulkUpdate = async (userIds: string[], updates: any) => {
    try {
      const response = await usersApi.bulkUpdate(userIds, updates);
      await fetchUsers(); // Refresh list
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to bulk update users');
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    goToPage,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    bulkUpdate,
    refresh: fetchUsers
  };
}

/**
 * Hook for user statistics
 */
export function useUserStatistics() {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.getStatistics();
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
 * Hook for user activity over time
 */
export function useUserActivity(days: number = 30) {
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.getActivity(days);
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
 * Hook for top users
 */
export function useTopUsers(limit: number = 10, timeFilter: string = 'all') {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.getTopUsers(limit, timeFilter);
        setTopUsers(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch top users');
        console.error('Fetch top users error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, [limit, timeFilter]);

  return { topUsers, loading, error };
}

