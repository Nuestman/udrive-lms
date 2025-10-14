/**
 * File Upload Middleware
 * 
 * Handles multipart form data and validates uploads
 */

import multer from 'multer';
import { validateFileType, validateFileSize } from '../utils/storage.js';

// Use memory storage for Vercel Blob uploads
const storage = multer.memoryStorage();

/**
 * Create upload middleware with validation
 */
export function createUploadMiddleware(options = {}) {
  const {
    allowedTypes = ['image', 'video', 'audio', 'document'],
    maxSize = 50, // MB
    maxFiles = 10
  } = options;
  
  return multer({
    storage,
    limits: {
      fileSize: maxSize * 1024 * 1024, // Convert MB to bytes
      files: maxFiles
    },
    fileFilter: (req, file, cb) => {
      // Validate file type
      if (!validateFileType(file.mimetype, allowedTypes)) {
        return cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
      }
      
      cb(null, true);
    }
  });
}

/**
 * Single file upload middleware
 */
export const uploadSingle = (fieldName = 'file', options = {}) => {
  const middleware = createUploadMiddleware(options);
  return middleware.single(fieldName);
};

/**
 * Multiple files upload middleware
 */
export const uploadMultiple = (fieldName = 'files', maxCount = 10, options = {}) => {
  const middleware = createUploadMiddleware({ ...options, maxFiles: maxCount });
  return middleware.array(fieldName, maxCount);
};

/**
 * Avatar upload middleware (images only, max 5MB)
 */
export const uploadAvatar = uploadSingle('avatar', {
  allowedTypes: ['image'],
  maxSize: 5
});

/**
 * Course thumbnail upload middleware
 */
export const uploadCourseThumbnail = uploadSingle('thumbnail', {
  allowedTypes: ['image'],
  maxSize: 5
});

/**
 * Media library upload middleware (all types, max 100MB)
 */
export const uploadMedia = uploadMultiple('files', 10, {
  allowedTypes: ['image', 'video', 'audio', 'document'],
  maxSize: 100
});

/**
 * Assignment submission upload middleware
 */
export const uploadAssignment = uploadMultiple('files', 5, {
  allowedTypes: ['image', 'video', 'document'],
  maxSize: 50
});

/**
 * Document upload middleware (documents only)
 */
export const uploadDocument = uploadSingle('document', {
  allowedTypes: ['document'],
  maxSize: 20
});

/**
 * Error handling middleware for upload errors
 */
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
}

export default {
  uploadSingle,
  uploadMultiple,
  uploadAvatar,
  uploadCourseThumbnail,
  uploadMedia,
  uploadAssignment,
  uploadDocument,
  handleUploadError
};

