/**
 * Media Service
 * 
 * Handles file uploads, media library management, and file operations
 */

import { query } from '../lib/db.js';
import { uploadFile, deleteFile, listFiles, getFileCategory } from '../utils/storage.js';

/**
 * Upload a file to storage and save metadata to database
 */
export async function uploadMediaFile(fileBuffer, originalFilename, mimetype, category, context) {
  const { tenantId, userId, courseId, lessonId, assignmentId, tags = [] } = context;
  
  try {
    // Get tenant name for organized storage
    let tenantName = context.tenantName;
    if (!tenantName && tenantId) {
      const tenantResult = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
      tenantName = tenantResult.rows[0]?.name || tenantId;
    }
    
    // Upload to Vercel Blob
    const uploadResult = await uploadFile(
      fileBuffer,
      originalFilename,
      category,
      {
        tenantId,
        tenantName,
        userId,
        courseId,
        lessonId,
        assignmentId
      },
      {
        contentType: mimetype
      }
    );
    
    // Save metadata to database
    const result = await query(`
      INSERT INTO media_files (
        tenant_id,
        uploaded_by,
        filename,
        original_filename,
        file_type,
        file_size,
        mime_type,
        file_url,
        metadata,
        tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      userId,
      uploadResult.filename,
      originalFilename,
      getFileCategory(mimetype),
      uploadResult.size,
      mimetype,
      uploadResult.url,
      JSON.stringify({
        pathname: uploadResult.pathname,
        uploadedAt: uploadResult.uploadedAt,
        category
      }),
      tags
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(files, category, context) {
  const uploadPromises = files.map(file => 
    uploadMediaFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      category,
      context
    )
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Get media files for a tenant
 */
export async function getMediaFiles(tenantId, filters = {}) {
  const { fileType, search, tags, limit = 50, offset = 0 } = filters;
  
  let queryStr = `
    SELECT 
      mf.*,
      up.first_name,
      up.last_name,
      up.email
    FROM media_files mf
    LEFT JOIN user_profiles up ON mf.uploaded_by = up.id
    WHERE mf.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramCount = 1;
  
  if (fileType) {
    paramCount++;
    queryStr += ` AND mf.file_type = $${paramCount}`;
    params.push(fileType);
  }
  
  if (search) {
    paramCount++;
    queryStr += ` AND (
      mf.filename ILIKE $${paramCount} OR 
      mf.original_filename ILIKE $${paramCount} OR
      mf.tags && ARRAY[$${paramCount}]
    )`;
    params.push(`%${search}%`);
  }
  
  if (tags && tags.length > 0) {
    paramCount++;
    queryStr += ` AND mf.tags && $${paramCount}`;
    params.push(tags);
  }
  
  queryStr += ` ORDER BY mf.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);
  
  const result = await query(queryStr, params);
  
  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM media_files WHERE tenant_id = $1',
    [tenantId]
  );
  
  return {
    files: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit,
    offset
  };
}

/**
 * Get a single media file by ID
 */
export async function getMediaFileById(fileId, tenantId) {
  const result = await query(
    `SELECT mf.*, up.first_name, up.last_name, up.email
     FROM media_files mf
     LEFT JOIN user_profiles up ON mf.uploaded_by = up.id
     WHERE mf.id = $1 AND mf.tenant_id = $2`,
    [fileId, tenantId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Media file not found');
  }
  
  return result.rows[0];
}

/**
 * Update media file metadata
 */
export async function updateMediaFile(fileId, tenantId, updates) {
  const { tags, metadata } = updates;
  
  const result = await query(
    `UPDATE media_files
     SET tags = COALESCE($1, tags),
         metadata = COALESCE($2, metadata)
     WHERE id = $3 AND tenant_id = $4
     RETURNING *`,
    [tags, metadata ? JSON.stringify(metadata) : null, fileId, tenantId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Media file not found');
  }
  
  return result.rows[0];
}

/**
 * Delete a media file
 */
export async function deleteMediaFile(fileId, tenantId) {
  // Get file info
  const file = await getMediaFileById(fileId, tenantId);
  
  // Delete from storage
  await deleteFile(file.file_url);
  
  // Delete from database
  await query(
    'DELETE FROM media_files WHERE id = $1 AND tenant_id = $2',
    [fileId, tenantId]
  );
  
  return { success: true, message: 'File deleted successfully' };
}

/**
 * Delete multiple media files
 */
export async function deleteMultipleFiles(fileIds, tenantId) {
  const deletePromises = fileIds.map(fileId => 
    deleteMediaFile(fileId, tenantId)
  );
  
  return Promise.all(deletePromises);
}

/**
 * Get storage statistics for a tenant
 */
export async function getStorageStats(tenantId) {
  const result = await query(`
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_size,
      COUNT(*) FILTER (WHERE file_type = 'image') as image_count,
      COUNT(*) FILTER (WHERE file_type = 'video') as video_count,
      COUNT(*) FILTER (WHERE file_type = 'audio') as audio_count,
      COUNT(*) FILTER (WHERE file_type = 'document') as document_count,
      SUM(file_size) FILTER (WHERE file_type = 'image') as image_size,
      SUM(file_size) FILTER (WHERE file_type = 'video') as video_size,
      SUM(file_size) FILTER (WHERE file_type = 'audio') as audio_size,
      SUM(file_size) FILTER (WHERE file_type = 'document') as document_size
    FROM media_files
    WHERE tenant_id = $1
  `, [tenantId]);
  
  return result.rows[0];
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(fileBuffer, originalFilename, mimetype, userId, tenantId, userName) {
  // Get tenant name for organized storage
  const tenantResult = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
  const tenantName = tenantResult.rows[0]?.name || tenantId;
  
  const uploadResult = await uploadFile(
    fileBuffer,
    originalFilename,
    'avatar',
    { tenantId, tenantName, userId },
    { contentType: mimetype }
  );
  
  // Update user profile
  await query(
    'UPDATE user_profiles SET avatar_url = $1 WHERE id = $2',
    [uploadResult.url, userId]
  );
  
  return uploadResult;
}

/**
 * Upload course thumbnail
 */
export async function uploadCourseThumbnail(fileBuffer, originalFilename, mimetype, courseId, tenantId, userId) {
  // Get tenant name for organized storage
  const tenantResult = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
  const tenantName = tenantResult.rows[0]?.name || tenantId;
  
  const uploadResult = await uploadFile(
    fileBuffer,
    originalFilename,
    'course-thumbnail',
    { tenantId, tenantName, courseId, userId },
    { contentType: mimetype }
  );
  
  // Update course
  await query(
    'UPDATE courses SET thumbnail_url = $1 WHERE id = $2',
    [uploadResult.url, courseId]
  );
  
  return uploadResult;
}

/**
 * Upload assignment submission files
 */
export async function uploadAssignmentFiles(files, assignmentId, studentId, tenantId) {
  // Get tenant name for organized storage
  const tenantResult = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
  const tenantName = tenantResult.rows[0]?.name || tenantId;
  
  const uploadPromises = files.map(file => 
    uploadFile(
      file.buffer,
      file.originalname,
      'assignment-submission',
      { tenantId, tenantName, assignmentId, userId: studentId },
      { contentType: file.mimetype }
    )
  );
  
  const results = await Promise.all(uploadPromises);
  
  return results.map(result => ({
    url: result.url,
    filename: result.originalFilename,
    size: result.size,
    contentType: result.contentType
  }));
}

/**
 * Upload tenant/school logo
 */
export async function uploadTenantLogo(fileBuffer, originalFilename, mimetype, tenantId, userId) {
  // Get tenant name for organized storage
  const tenantResult = await query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
  const tenantName = tenantResult.rows[0]?.name || tenantId;
  
  const uploadResult = await uploadFile(
    fileBuffer,
    originalFilename,
    'tenant-logo',
    { tenantId, tenantName, userId },
    { contentType: mimetype }
  );
  
  // Update tenant with new logo URL
  await query(
    'UPDATE tenants SET logo_url = $1, updated_at = NOW() WHERE id = $2',
    [uploadResult.url, tenantId]
  );
  
  return uploadResult;
}

export default {
  uploadMediaFile,
  uploadMultipleFiles,
  getMediaFiles,
  getMediaFileById,
  updateMediaFile,
  deleteMediaFile,
  deleteMultipleFiles,
  getStorageStats,
  uploadAvatar,
  uploadCourseThumbnail,
  uploadAssignmentFiles,
  uploadTenantLogo
};

