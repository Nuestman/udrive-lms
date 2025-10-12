// useModules Hook - Manage course modules
import { useState, useEffect, useCallback } from 'react';
import { modulesApi } from '../lib/api';
import type { Module } from '../types/database.types';

interface UseModulesReturn {
  modules: Module[];
  loading: boolean;
  error: Error | null;
  createModule: (moduleData: Partial<Module>) => Promise<Module>;
  updateModule: (id: string, updates: Partial<Module>) => Promise<Module>;
  deleteModule: (id: string) => Promise<void>;
  reorderModules: (moduleOrders: Array<{ moduleId: string; orderIndex: number }>) => Promise<void>;
  refreshModules: () => Promise<void>;
}

export function useModules(courseId?: string): UseModulesReturn {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch modules for a course
  const fetchModules = useCallback(async () => {
    if (!courseId) {
      setModules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await modulesApi.getByCourse(courseId);
      
      if (response.success) {
        setModules(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Load modules when courseId changes
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Create module
  const createModule = async (moduleData: Partial<Module>): Promise<Module> => {
    try {
      const response = await modulesApi.create({
        ...moduleData,
        course_id: courseId
      });
      
      if (response.success) {
        setModules(prevModules => [...prevModules, response.data]);
        return response.data;
      }
      
      throw new Error('Failed to create module');
    } catch (err: any) {
      console.error('Error creating module:', err);
      throw err;
    }
  };

  // Update module
  const updateModule = async (id: string, updates: Partial<Module>): Promise<Module> => {
    try {
      const response = await modulesApi.update(id, updates);
      
      if (response.success) {
        setModules(prevModules =>
          prevModules.map(module =>
            module.id === id ? { ...module, ...response.data } : module
          )
        );
        return response.data;
      }
      
      throw new Error('Failed to update module');
    } catch (err: any) {
      console.error('Error updating module:', err);
      throw err;
    }
  };

  // Delete module
  const deleteModule = async (id: string): Promise<void> => {
    try {
      const response = await modulesApi.delete(id);
      
      if (response.success) {
        setModules(prevModules => prevModules.filter(module => module.id !== id));
      } else {
        throw new Error('Failed to delete module');
      }
    } catch (err: any) {
      console.error('Error deleting module:', err);
      throw err;
    }
  };

  // Reorder modules
  const reorderModules = async (moduleOrders: Array<{ moduleId: string; orderIndex: number }>): Promise<void> => {
    if (!courseId) return;

    try {
      const response = await modulesApi.reorder(courseId, moduleOrders);
      
      if (response.success) {
        // Update local state
        const reorderedModules = [...modules].sort((a, b) => {
          const aOrder = moduleOrders.find(o => o.moduleId === a.id)?.orderIndex ?? a.order_index;
          const bOrder = moduleOrders.find(o => o.moduleId === b.id)?.orderIndex ?? b.order_index;
          return aOrder - bOrder;
        });
        setModules(reorderedModules);
      }
    } catch (err: any) {
      console.error('Error reordering modules:', err);
      throw err;
    }
  };

  return {
    modules,
    loading,
    error,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    refreshModules: fetchModules
  };
}

export default useModules;

