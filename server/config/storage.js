/**
 * Storage Configuration
 * 
 * Vercel Blob storage settings and file handling constants
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Storage settings
 */
export const STORAGE_CONFIG = {
  // Vercel Blob token (required)
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  
  // Default storage paths
  DEFAULT_TENANT: 'default',
  BASE_PATH: 'tenants',
  
  // File size limits (in MB)
  MAX_FILE_SIZE: {
    image: 10,      // 10 MB for images
    video: 500,     // 500 MB for videos
    audio: 50,      // 50 MB for audio
    document: 50,   // 50 MB for documents
    default: 50     // 50 MB default
  },
  
  // Allowed file types by category
  ALLOWED_TYPES: {
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
  },
  
  // Storage categories
  CATEGORIES: {
    AVATAR: 'avatar',
    COURSE_THUMBNAIL: 'course-thumbnail',
    COURSE_MEDIA: 'course-media',
    LESSON_MEDIA: 'lesson-media',
    ASSIGNMENT: 'assignment-submission',
    CERTIFICATE: 'certificate',
    TENANT_LOGO: 'tenant-logo',
    MEDIA_LIBRARY_IMAGE: 'media-library-image',
    MEDIA_LIBRARY_VIDEO: 'media-library-video',
    MEDIA_LIBRARY_AUDIO: 'media-library-audio',
    MEDIA_LIBRARY_DOCUMENT: 'media-library-document'
  }
};

/**
 * Get max file size for a category
 */
export function getMaxFileSize(category) {
  if (category.includes('video')) return STORAGE_CONFIG.MAX_FILE_SIZE.video;
  if (category.includes('audio')) return STORAGE_CONFIG.MAX_FILE_SIZE.audio;
  if (category.includes('image') || category.includes('avatar') || category.includes('logo')) {
    return STORAGE_CONFIG.MAX_FILE_SIZE.image;
  }
  return STORAGE_CONFIG.MAX_FILE_SIZE.default;
}

/**
 * Get allowed file types for a category
 */
export function getAllowedTypes(category) {
  if (category.includes('video')) return STORAGE_CONFIG.ALLOWED_TYPES.video;
  if (category.includes('audio')) return STORAGE_CONFIG.ALLOWED_TYPES.audio;
  if (category.includes('image') || category.includes('avatar') || category.includes('logo') || category.includes('thumbnail')) {
    return STORAGE_CONFIG.ALLOWED_TYPES.image;
  }
  if (category.includes('document')) return STORAGE_CONFIG.ALLOWED_TYPES.document;
  
  // Allow all types for media library
  if (category.includes('media-library')) {
    return [
      ...STORAGE_CONFIG.ALLOWED_TYPES.image,
      ...STORAGE_CONFIG.ALLOWED_TYPES.video,
      ...STORAGE_CONFIG.ALLOWED_TYPES.audio,
      ...STORAGE_CONFIG.ALLOWED_TYPES.document
    ];
  }
  
  return [];
}

/**
 * Storage Directory Structure:
 * 
 * /tenants/{tenant-name}/
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
 */

export default {
  STORAGE_CONFIG,
  getMaxFileSize,
  getAllowedTypes
};

