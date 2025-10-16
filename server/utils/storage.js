/**
 * Vercel Blob Storage Utility
 * 
 * Provides a comprehensive, scalable file storage system with:
 * - Intuitive directory structure
 * - Consistent file naming with sanitization
 * - Human-readable date formats
 * - Context-aware file organization
 */

import { put, del, list } from '@vercel/blob';
import path from 'path';

/**
 * Storage Directory Structure:
 * 
 * /tenants/{tenant-name}/  (sanitized school name)
 *   ├── avatars/              - User profile pictures
 *   ├── logos/                - School logos
 *   ├── courses/              - Course-related media
 *   │   ├── thumbnails/       - Course thumbnail images
 *   │   └── {course_id}/      - Course-specific files
 *   ├── lessons/              - Lesson content media
 *   │   └── {lesson_id}/      - Lesson-specific files
 *   ├── assignments/          - Assignment submissions
 *   │   └── {assignment_id}/  - Assignment-specific submissions
 *   ├── certificates/         - Generated certificates
 *   └── media-library/        - General media library files
 *       ├── images/
 *       ├── videos/
 *       ├── audio/
 *       └── documents/
 * 
 * Files named as: {tenant-name}_{category}_{date}.ext
 * Example: elite-driving_logo_2025-01-15_14-30-45.png
 */

/**
 * Sanitize filename to be URL-safe and human-readable
 */
export function sanitizeFilename(filename) {
  // Get file extension
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  
  // Remove special characters, replace spaces with hyphens, convert to lowercase
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
    .substring(0, 50);            // Limit length
  
  return `${sanitized}${ext.toLowerCase()}`;
}

/**
 * Generate human-readable timestamp with milliseconds for uniqueness
 * Format: YYYY-MM-DD_HH-MM-SS-mmm
 */
export function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}`;
}

/**
 * Generate a unique, context-aware filename
 * Uses tenant name for cleaner, more readable filenames
 * 
 * @param {string} originalFilename - Original file name
 * @param {object} context - Context information (tenantName, category, etc.)
 * @returns {string} - Formatted filename
 * 
 * Format: {tenant-name}_{category}_{date}.ext
 * Example: elite-driving_logo_2025-01-15_14-30-45.png
 */
export function generateFilename(originalFilename, context = {}) {
  const ext = path.extname(originalFilename).toLowerCase();
  const timestamp = getTimestamp();
  
  // Build contextual parts
  const parts = [];
  
  // Add tenant name (primary identifier)
  if (context.tenantName) {
    const sanitizedTenantName = context.tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    parts.push(sanitizedTenantName);
  }
  
  // Add category/type
  if (context.category) {
    parts.push(context.category);
  }
  
  // Add timestamp
  parts.push(timestamp);
  
  // Add unique identifier for collision prevention
  if (context.uniqueId) {
    parts.push(context.uniqueId.substring(0, 8));
  }
  
  return parts.join('_') + ext;
}

/**
 * Build storage path for a file
 * Uses tenant name for human-readable, organized structure
 * 
 * @param {string} category - Storage category (avatar, course-thumbnail, etc.)
 * @param {object} context - Context information
 * @returns {string} - Full storage path
 * 
 * Format: tenants/{tenant-name}/{category}/
 * Example: tenants/elite-driving/logos/
 */
export function buildStoragePath(category, context = {}) {
  const { tenantName, tenantId, courseId, lessonId, assignmentId } = context;
  
  // Sanitize tenant name for directory use
  const sanitizedTenantName = tenantName
    ? tenantName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
    : (tenantId || 'default');
  
  const parts = ['tenants', sanitizedTenantName];
  
  switch (category) {
    case 'avatar':
      parts.push('avatars');
      break;
      
    case 'course-thumbnail':
      parts.push('courses', 'thumbnails');
      break;
      
    case 'course-media':
      parts.push('courses', courseId || 'general');
      break;
      
    case 'lesson-media':
      parts.push('lessons', lessonId || 'general');
      break;
      
    case 'assignment-submission':
      parts.push('assignments', assignmentId || 'general');
      break;
      
    case 'certificate':
      parts.push('certificates');
      break;
      
    case 'tenant-logo':
      parts.push('logos');
      break;
      
    case 'media-library-image':
      parts.push('media-library', 'images');
      break;
      
    case 'media-library-video':
      parts.push('media-library', 'videos');
      break;
      
    case 'media-library-audio':
      parts.push('media-library', 'audio');
      break;
      
    case 'media-library-document':
      parts.push('media-library', 'documents');
      break;
      
    default:
      parts.push('misc');
  }
  
  return parts.join('/');
}

/**
 * Upload a file to Vercel Blob storage
 * 
 * @param {Buffer|ReadableStream} fileData - File data to upload
 * @param {string} originalFilename - Original filename
 * @param {string} category - Storage category
 * @param {object} context - Context information
 * @param {object} options - Additional options (contentType, metadata)
 * @returns {Promise<object>} - Upload result with URL
 */
export async function uploadFile(fileData, originalFilename, category, context = {}, options = {}) {
  try {
    // Generate the storage path and filename
    const storagePath = buildStoragePath(category, context);
    const filename = generateFilename(originalFilename, {
      tenantName: context.tenantName,
      category: getCategoryLabel(category),
      uniqueId: context.userId || context.courseId || context.lessonId
    });
    
    const fullPath = `${storagePath}/${filename}`;
    
    console.log(`📤 Uploading file to: ${fullPath}`);
    
    // Upload to Vercel Blob
    const blob = await put(fullPath, fileData, {
      access: 'public',
      contentType: options.contentType,
      cacheControlMaxAge: 31536000, // 1 year cache
      ...options,
      addRandomSuffix: true // MUST be after ...options to prevent override
    });
    
    console.log(`✅ File uploaded successfully: ${blob.url}`);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
      filename: filename,
      originalFilename: originalFilename,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from Vercel Blob storage
 * 
 * @param {string} url - The blob URL to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(url) {
  try {
    console.log(`🗑️ Deleting file: ${url}`);
    await del(url);
    console.log(`✅ File deleted successfully`);
  } catch (error) {
    console.error('❌ File deletion error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List files in a storage path
 * 
 * @param {string} prefix - Path prefix to list
 * @param {object} options - List options
 * @returns {Promise<Array>} - List of files
 */
export async function listFiles(prefix, options = {}) {
  try {
    console.log(`📋 Listing files with prefix: ${prefix}`);
    const result = await list({ prefix, ...options });
    console.log(`✅ Found ${result.blobs.length} files`);
    return result.blobs;
  } catch (error) {
    console.error('❌ File listing error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

/**
 * Validate file type
 * 
 * @param {string} mimetype - File MIME type
 * @param {Array<string>} allowedTypes - Allowed MIME types or categories
 * @returns {boolean}
 */
export function validateFileType(mimetype, allowedTypes = []) {
  if (allowedTypes.length === 0) return true;
  
  // Support category-based validation
  const categories = {
    'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    'video': ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    'document': [
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
  
  // Expand categories
  const expandedTypes = allowedTypes.flatMap(type => 
    categories[type] || [type]
  );
  
  return expandedTypes.includes(mimetype);
}

/**
 * Validate file size
 * 
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum size in MB
 * @returns {boolean}
 */
export function validateFileSize(fileSize, maxSize = 50) {
  const maxBytes = maxSize * 1024 * 1024;
  return fileSize <= maxBytes;
}

/**
 * Get file category from MIME type
 * 
 * @param {string} mimetype - File MIME type
 * @returns {string} - Category name
 */
export function getFileCategory(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Get category label for filename
 * 
 * @param {string} category - Storage category
 * @returns {string} - Label for filename
 */
export function getCategoryLabel(category) {
  if (category.includes('avatar')) return 'avatar';
  if (category.includes('logo')) return 'logo';
  if (category.includes('thumbnail')) return 'thumbnail';
  if (category.includes('assignment')) return 'assignment';
  if (category.includes('certificate')) return 'certificate';
  if (category.includes('lesson')) return 'lesson';
  if (category.includes('course')) return 'course';
  return 'file';
}

export default {
  uploadFile,
  deleteFile,
  listFiles,
  sanitizeFilename,
  generateFilename,
  buildStoragePath,
  validateFileType,
  validateFileSize,
  getFileCategory,
  getCategoryLabel,
  getTimestamp
};

