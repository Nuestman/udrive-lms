/**
 * File Upload Hook
 * 
 * Provides a reusable hook for file uploads with progress tracking
 */

import { useState, useCallback } from 'react';
import { uploadFileWithProgress, validateFile, UploadProgress } from '../utils/upload.utils';
import { ALLOWED_FILE_TYPES } from '../utils/upload.utils';

interface UseFileUploadOptions {
  endpoint: string;
  fieldName?: string;
  category?: keyof typeof ALLOWED_FILE_TYPES;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  additionalData?: Record<string, any>;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const {
    endpoint,
    fieldName = 'file',
    category = 'document',
    onSuccess,
    onError,
    additionalData
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const upload = useCallback(async (file: File) => {
    setError(null);
    setProgress(0);
    setUploadedFile(null);

    // Validate file
    const validation = validateFile(file, category);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      onError?.(new Error(validation.error));
      return;
    }

    setUploading(true);

    try {
      const response = await uploadFileWithProgress(
        file,
        endpoint,
        fieldName,
        additionalData,
        (progress) => setProgress(progress)
      );

      setUploadedFile(response);
      onSuccess?.(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setUploading(false);
    }
  }, [endpoint, fieldName, category, additionalData, onSuccess, onError]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    uploadedFile,
    reset
  };
}

/**
 * Multiple Files Upload Hook
 */
interface UseMultipleFileUploadOptions {
  endpoint: string;
  fieldName?: string;
  category?: keyof typeof ALLOWED_FILE_TYPES;
  onSuccess?: (responses: any[]) => void;
  onError?: (error: Error) => void;
  additionalData?: Record<string, any>;
}

export function useMultipleFileUpload(options: UseMultipleFileUploadOptions) {
  const {
    endpoint,
    fieldName = 'files',
    category = 'document',
    onSuccess,
    onError,
    additionalData
  } = options;

  const [uploading, setUploading] = useState(false);
  const [filesProgress, setFilesProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const upload = useCallback(async (files: File[]) => {
    setErrors({});
    setFilesProgress({});
    setUploadedFiles([]);

    // Validate all files
    const validations = files.map((file, index) => ({
      file,
      index,
      validation: validateFile(file, category)
    }));

    const invalidFiles = validations.filter(v => !v.validation.valid);
    if (invalidFiles.length > 0) {
      const errorMap: Record<string, string> = {};
      invalidFiles.forEach(({ file, validation }) => {
        errorMap[file.name] = validation.error || 'Invalid file';
      });
      setErrors(errorMap);
      onError?.(new Error('Some files are invalid'));
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append(fieldName, file);
      });

      // Add additional data
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      // Upload with XMLHttpRequest for progress tracking
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            // Update progress for all files (simplified)
            const progressMap: Record<string, number> = {};
            files.forEach(file => {
              progressMap[file.name] = progress;
            });
            setFilesProgress(progressMap);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
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

        const token = localStorage.getItem('token');
        xhr.open('POST', endpoint);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      setUploadedFiles(response.files || []);
      onSuccess?.(response.files || []);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      const errorMap: Record<string, string> = {};
      files.forEach(file => {
        errorMap[file.name] = errorMessage;
      });
      setErrors(errorMap);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setUploading(false);
    }
  }, [endpoint, fieldName, category, additionalData, onSuccess, onError]);

  const reset = useCallback(() => {
    setUploading(false);
    setFilesProgress({});
    setErrors({});
    setUploadedFiles([]);
  }, []);

  return {
    upload,
    uploading,
    filesProgress,
    errors,
    uploadedFiles,
    reset
  };
}

export default useFileUpload;

