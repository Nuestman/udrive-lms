/**
 * Media Routes
 * 
 * Handles all media upload and management operations
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateTenantAccess } from '../middleware/tenant.middleware.js';
import {
  uploadMedia,
  uploadAvatar,
  uploadCourseThumbnail,
  uploadAssignment,
  handleUploadError
} from '../middleware/upload.middleware.js';
import * as mediaService from '../services/media.service.js';

const router = express.Router();

/**
 * POST /api/media/upload
 * Upload files to media library
 */
router.post('/upload',
  requireAuth,
  validateTenantAccess,
  uploadMedia,
  handleUploadError,
  async (req, res) => {
    try {
      const { tags = [] } = req.body;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }
      
      const category = `media-library-${req.body.category || 'document'}`;
      
      const uploadedFiles = await mediaService.uploadMultipleFiles(
        files,
        category,
        {
          tenantId: req.tenantId,
          userId: req.user.id,
          userName: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
          tags: tags.split ? tags.split(',') : tags
        }
      );
      
      res.json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload files'
      });
    }
  }
);

/**
 * GET /api/media
 * Get media files for current tenant
 */
router.get('/',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { fileType, search, tags, limit, offset } = req.query;
      
      const result = await mediaService.getMediaFiles(req.tenantId, {
        fileType,
        search,
        tags: tags ? tags.split(',') : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      });
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get media files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get media files'
      });
    }
  }
);

/**
 * GET /api/media/:id
 * Get a single media file by ID
 */
router.get('/:id',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      const file = await mediaService.getMediaFileById(req.params.id, req.tenantId);
      
      res.json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Get media file error:', error);
      res.status(error.message === 'Media file not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to get media file'
      });
    }
  }
);

/**
 * PUT /api/media/:id
 * Update media file metadata (tags, etc.)
 */
router.put('/:id',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { tags, metadata } = req.body;
      
      const updatedFile = await mediaService.updateMediaFile(
        req.params.id,
        req.tenantId,
        { tags, metadata }
      );
      
      res.json({
        success: true,
        message: 'Media file updated successfully',
        file: updatedFile
      });
    } catch (error) {
      console.error('Update media file error:', error);
      res.status(error.message === 'Media file not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to update media file'
      });
    }
  }
);

/**
 * DELETE /api/media/:id
 * Delete a media file
 */
router.delete('/:id',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      await mediaService.deleteMediaFile(req.params.id, req.tenantId);
      
      res.json({
        success: true,
        message: 'Media file deleted successfully'
      });
    } catch (error) {
      console.error('Delete media file error:', error);
      res.status(error.message === 'Media file not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete media file'
      });
    }
  }
);

/**
 * POST /api/media/delete-multiple
 * Delete multiple media files
 */
router.post('/delete-multiple',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { fileIds } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No file IDs provided'
        });
      }
      
      await mediaService.deleteMultipleFiles(fileIds, req.tenantId);
      
      res.json({
        success: true,
        message: `${fileIds.length} file(s) deleted successfully`
      });
    } catch (error) {
      console.error('Delete multiple files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete files'
      });
    }
  }
);

/**
 * GET /api/media/stats
 * Get storage statistics
 */
router.get('/stats',
  requireAuth,
  validateTenantAccess,
  async (req, res) => {
    try {
      const stats = await mediaService.getStorageStats(req.tenantId);
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get storage stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get storage statistics'
      });
    }
  }
);

/**
 * POST /api/media/avatar
 * Upload user avatar
 */
router.post('/avatar',
  requireAuth,
  validateTenantAccess,
  uploadAvatar,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }
      
      const result = await mediaService.uploadAvatar(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user.id,
        req.tenantId,
        `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim()
      );
      
      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: result.url
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload avatar'
      });
    }
  }
);

/**
 * POST /api/media/course-thumbnail/:courseId
 * Upload course thumbnail
 */
router.post('/course-thumbnail/:courseId',
  requireAuth,
  validateTenantAccess,
  uploadCourseThumbnail,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }
      
      const result = await mediaService.uploadCourseThumbnail(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.params.courseId,
        req.tenantId,
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Course thumbnail uploaded successfully',
        thumbnailUrl: result.url
      });
    } catch (error) {
      console.error('Course thumbnail upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload course thumbnail'
      });
    }
  }
);

/**
 * POST /api/media/assignment-submission/:assignmentId
 * Upload assignment submission files
 */
router.post('/assignment-submission/:assignmentId',
  requireAuth,
  validateTenantAccess,
  uploadAssignment,
  handleUploadError,
  async (req, res) => {
    try {
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }
      
      const uploadedFiles = await mediaService.uploadAssignmentFiles(
        files,
        req.params.assignmentId,
        req.user.id,
        req.tenantId
      );
      
      res.json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Assignment submission upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload assignment files'
      });
    }
  }
);

/**
 * POST /api/media/tenant-logo/:tenantId
 * Upload tenant/school logo (Super Admin or School Admin only)
 */
router.post('/tenant-logo/:tenantId',
  requireAuth,
  uploadCourseThumbnail, // Reuse same constraints (image, 5MB)
  handleUploadError,
  async (req, res) => {
    try {
      console.log('🔍 Backend Debug - Tenant Logo Upload');
      console.log('   User:', req.user);
      console.log('   Tenant ID:', req.params.tenantId);
      console.log('   Has file:', !!req.file);
      
      // Verify permission: Super admin or admin of the tenant
      const tenantId = req.params.tenantId;
      const isSuperAdmin = req.user.role === 'super_admin';
      const isSchoolAdmin = req.user.role === 'school_admin' && req.user.tenant_id === tenantId;
      
      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only upload logos for your own school'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }
      
      const result = await mediaService.uploadTenantLogo(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        tenantId,
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'School logo uploaded successfully',
        logoUrl: result.url
      });
    } catch (error) {
      console.error('Tenant logo upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload school logo'
      });
    }
  }
);

export default router;

