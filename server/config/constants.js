/**
 * Application Constants
 * 
 * App-wide constants and enums
 */

/**
 * User roles
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

/**
 * Course status
 */
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

/**
 * Enrollment status
 */
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  SUSPENDED: 'suspended'
};

/**
 * Lesson types
 */
export const LESSON_TYPES = {
  VIDEO: 'video',
  TEXT: 'text',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  INTERACTIVE: 'interactive'
};

/**
 * Progress status
 */
export const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

/**
 * Assignment status
 */
export const ASSIGNMENT_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  RETURNED: 'returned'
};

/**
 * Certificate status
 */
export const CERTIFICATE_STATUS = {
  NOT_EARNED: 'not_earned',
  EARNED: 'earned',
  ISSUED: 'issued',
  REVOKED: 'revoked'
};

/**
 * Goal types
 */
export const GOAL_TYPES = {
  COURSE_COMPLETION: 'course_completion',
  SKILL_MASTERY: 'skill_mastery',
  TIME_BASED: 'time_based',
  CUSTOM: 'custom'
};

/**
 * Media types
 */
export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  OTHER: 'other'
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
  TIMESTAMP: 'YYYY-MM-DD_HH-mm-ss',
  DISPLAY: 'MMM DD, YYYY'
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error',
  AUTHENTICATION_FAILED: 'Authentication failed',
  INVALID_TOKEN: 'Invalid or expired token',
  TENANT_MISMATCH: 'Tenant access violation',
  FILE_UPLOAD_ERROR: 'File upload failed',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type'
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  OPERATION_SUCCESS: 'Operation completed successfully'
};

export default {
  USER_ROLES,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  LESSON_TYPES,
  PROGRESS_STATUS,
  ASSIGNMENT_STATUS,
  CERTIFICATE_STATUS,
  GOAL_TYPES,
  MEDIA_TYPES,
  PAGINATION,
  DATE_FORMATS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};

