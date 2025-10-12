// useSchools Hook - School/Tenant management (Super Admin only)
import { useState, useEffect } from 'react';
import api from '../lib/api';

interface School {
  id: string;
  name: string;
  subdomain: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  settings?: any;
  created_at: string;
  updated_at: string;
  total_users?: number;
  student_count?: number;
  instructor_count?: number;
  course_count?: number;
  enrollment_count?: number;
}

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schools');
      
      if (response.success) {
        setSchools(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching schools:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createSchool = async (schoolData: Partial<School>) => {
    try {
      const response = await api.post('/schools', schoolData);
      
      if (response.success) {
        await fetchSchools();
        return response.data;
      }
    } catch (err: any) {
      console.error('Error creating school:', err);
      throw err;
    }
  };

  const updateSchool = async (schoolId: string, schoolData: Partial<School>) => {
    try {
      const response = await api.put(`/schools/${schoolId}`, schoolData);
      
      if (response.success) {
        await fetchSchools();
        return response.data;
      }
    } catch (err: any) {
      console.error('Error updating school:', err);
      throw err;
    }
  };

  const deleteSchool = async (schoolId: string) => {
    try {
      const response = await api.delete(`/schools/${schoolId}`);
      
      if (response.success) {
        await fetchSchools();
      }
    } catch (err: any) {
      console.error('Error deleting school:', err);
      throw err;
    }
  };

  return {
    schools,
    loading,
    error,
    createSchool,
    updateSchool,
    deleteSchool,
    refresh: fetchSchools
  };
}

export default useSchools;

