/**
 * Frontend Upload Utilities
 * 
 * Provides utilities for file uploads, validation, and formatting
 */

/**
 * File size limits (in MB)
 */
export const FILE_SIZE_LIMITS = {
  avatar: 5,
  thumbnail: 5,
  image: 10,
  video: 100,
  audio: 50,
  document: 20,
  assignment: 50
};

/**
 * Allowed file types
 */
export const ALLOWED_FILE_TYPES = {
  avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  thumbnail: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
};

/**
 * Validate file type
 */
export function validateFileType(file: File, category: keyof typeof ALLOWED_FILE_TYPES): boolean {
  const allowedTypes = ALLOWED_FILE_TYPES[category];
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, category: keyof typeof FILE_SIZE_LIMITS): boolean {
  const maxSize = FILE_SIZE_LIMITS[category] * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSize;
}

/**
 * Validate file
 */
export function validateFile(file: File, category: keyof typeof ALLOWED_FILE_TYPES): { valid: boolean; error?: string } {
  // Check file type
  if (!validateFileType(file, category)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${getFileTypeNames(category)}`
    };
  }
  
  // Check file size
  if (!validateFileSize(file, category)) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${FILE_SIZE_LIMITS[category]}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Get human-readable file type names
 */
export function getFileTypeNames(category: keyof typeof ALLOWED_FILE_TYPES): string {
  const extensions: Record<string, string[]> = {
    avatar: ['JPG', 'PNG', 'WebP'],
    thumbnail: ['JPG', 'PNG', 'WebP'],
    image: ['JPG', 'PNG', 'GIF', 'WebP', 'SVG'],
    video: ['MP4', 'MPEG', 'MOV', 'AVI', 'WebM'],
    audio: ['MP3', 'WAV', 'OGG', 'WebM'],
    document: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'CSV']
  };
  
  return extensions[category]?.join(', ') || 'All files';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Get file icon based on type
 */
export function getFileIcon(mimetype: string): string {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype === 'application/pdf') return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📊';
  return '📎';
}

/**
 * Create a preview URL for a file
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload progress interface
 */
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

/**
 * Upload file with progress tracking
 */
export async function uploadFileWithProgress(
  file: File,
  endpoint: string,
  fieldName: string = 'file',
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append(fieldName, file);
    
    // Add additional data
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
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
    
    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });
    
    // Send request
    xhr.open('POST', endpoint);
    xhr.withCredentials = true; // ✅ Send cookies with XHR (cookie-based auth)
    xhr.send(formData);
  });
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(
  files: File[],
  endpoint: string,
  fieldName: string = 'files',
  additionalData?: Record<string, any>,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<any[]> {
  const uploadPromises = files.map((file, index) => 
    uploadFileWithProgress(
      file,
      endpoint,
      fieldName,
      additionalData,
      (progress) => onProgress?.(index, progress)
    )
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Compress image file
 */
export async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default {
  validateFile,
  validateFileType,
  validateFileSize,
  formatFileSize,
  getFileExtension,
  getFileIcon,
  getFileTypeNames,
  createFilePreview,
  uploadFileWithProgress,
  uploadMultipleFiles,
  compressImage,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES
};

