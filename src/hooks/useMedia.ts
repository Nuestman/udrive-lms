/**
 * Media Management Hook
 * 
 * Provides hooks for interacting with the media library
 */

import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../lib/api';
import { MediaFile } from '../types/database.types';

interface MediaFilters {
  fileType?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

interface MediaResponse {
  success: boolean;
  files: MediaFile[];
  total: number;
  limit: number;
  offset: number;
}

interface StorageStats {
  total_files: number;
  total_size: number;
  image_count: number;
  video_count: number;
  audio_count: number;
  document_count: number;
  image_size: number;
  video_size: number;
  audio_size: number;
  document_size: number;
}

/**
 * Hook to manage media library
 */
export function useMedia(filters?: MediaFilters) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.fileType) params.append('fileType', filters.fileType);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags) params.append('tags', filters.tags.join(','));
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await get<MediaResponse>(`/media?${params.toString()}`);
      
      setFiles(response.files);
      setTotal(response.total);
      setHasMore(response.offset + response.files.length < response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media files');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const refreshFiles = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    total,
    hasMore,
    refreshFiles
  };
}

/**
 * Hook to get a single media file
 */
export function useMediaFile(fileId: string | null) {
  const [file, setFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setFile(null);
      return;
    }

    const fetchFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await get<{ success: boolean; file: MediaFile }>(`/media/${fileId}`);
        setFile(response.file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch media file');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  return { file, loading, error };
}

/**
 * Hook to manage media operations
 */
export function useMediaOperations() {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const uploadFiles = useCallback(async (files: File[], category: string, tags?: string[]) => {
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (category) {
        formData.append('category', category);
      }
      
      if (tags && tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/media/upload`, {
        method: 'POST',
        credentials: 'include', // Use cookie-based auth
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } finally {
      setUploading(false);
    }
  }, []);

  const updateFile = useCallback(async (fileId: string, updates: { tags?: string[]; metadata?: any }) => {
    setUpdating(true);

    try {
      return await put(`/media/${fileId}`, updates);
    } finally {
      setUpdating(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    setDeleting(true);

    try {
      return await del(`/media/${fileId}`);
    } finally {
      setDeleting(false);
    }
  }, []);

  const deleteMultipleFiles = useCallback(async (fileIds: string[]) => {
    setDeleting(true);

    try {
      return await post('/media/delete-multiple', { fileIds });
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    uploadFiles,
    uploading,
    updateFile,
    updating,
    deleteFile,
    deleteMultipleFiles,
    deleting
  };
}

/**
 * Hook to get storage statistics
 */
export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await get<{ success: boolean; stats: StorageStats }>('/media/stats');
      setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refreshStats: fetchStats };
}

/**
 * Hook to upload avatar
 */
export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/media/avatar`, {
        method: 'POST',
        credentials: 'include', // Use cookie-based auth
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Avatar upload failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadAvatar, uploading, error };
}

/**
 * Hook to upload course thumbnail
 */
export function useCourseThumbnailUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadThumbnail = useCallback(async (file: File, courseId: string) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/media/course-thumbnail/${courseId}`, {
        method: 'POST',
        credentials: 'include', // Use cookie-based auth
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Thumbnail upload failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Thumbnail upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadThumbnail, uploading, error };
}

/**
 * Hook to upload assignment submission files
 */
export function useAssignmentUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFiles = useCallback(async (files: File[], assignmentId: string) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', `${import.meta.env.VITE_API_URL}/media/assignment-submission/${assignmentId}`);
        xhr.withCredentials = true; // ✅ Send cookies with XHR
        xhr.send(formData);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadFiles, uploading, error, progress };
}

export default useMedia;

