// User Management Routes
import express from 'express';
import usersService from '../services/users.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(requireAuth);

/**
 * GET /api/users
 * Get all users with filtering and pagination
 */
router.get('/', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { role, status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // If school admin, only show users from their tenant
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;

    const result = await usersService.getAllUsers({
      tenantId,
      role,
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/statistics
 * Get user statistics
 */
router.get('/statistics', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    const stats = await usersService.getUserStatistics(tenantId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/activity
 * Get user activity over time
 */
router.get('/activity', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    
    const activity = await usersService.getUserActivityOverTime(tenantId, parseInt(days));

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/top
 * Get top users by activity
 */
router.get('/top', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tenantId = req.user.role === 'school_admin' ? req.user.tenant_id : null;
    
    const topUsers = await usersService.getTopUsers(tenantId, parseInt(limit));

    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    // School admins can only view users from their tenant
    if (req.user.role === 'school_admin' && user.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const userData = req.body;

    // School admins can only create users in their tenant
    if (req.user.role === 'school_admin') {
      userData.tenant_id = req.user.tenant_id;
      
      // School admins cannot create super admins
      if (userData.role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot create super admin users' });
      }
    }

    const user = await usersService.createUser(userData);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get user to check permissions
    const existingUser = await usersService.getUserById(id);

    // School admins can only update users in their tenant
    if (req.user.role === 'school_admin') {
      if (existingUser.tenant_id !== req.user.tenant_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // School admins cannot change role to super_admin
      if (updates.role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot set role to super admin' });
      }
    }

    const user = await usersService.updateUser(id, updates);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (soft delete)
 */
router.delete('/:id', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get user to check permissions
    const user = await usersService.getUserById(id);

    // School admins can only delete users in their tenant
    if (req.user.role === 'school_admin' && user.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await usersService.deleteUser(id);

    res.json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:id/permanent
 * Permanently delete user
 */
router.delete('/:id/permanent', requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await usersService.permanentlyDeleteUser(id);

    res.json(result);
  } catch (error) {
    console.error('Permanently delete user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Reset user password (admin action)
 */
router.post('/:id/reset-password', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Get user to check permissions
    const user = await usersService.getUserById(id);

    // School admins can only reset passwords for users in their tenant
    if (req.user.role === 'school_admin' && user.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await usersService.resetUserPassword(id, newPassword);

    res.json(result);
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/users/bulk-update
 * Bulk update users
 */
router.post('/bulk-update', requireRole(['super_admin', 'school_admin']), async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    // School admins - verify all users belong to their tenant
    if (req.user.role === 'school_admin') {
      for (const userId of userIds) {
        const user = await usersService.getUserById(userId);
        if (user.tenant_id !== req.user.tenant_id) {
          return res.status(403).json({ error: 'Access denied to one or more users' });
        }
      }

      // Cannot update to super_admin
      if (updates.role === 'super_admin') {
        return res.status(403).json({ error: 'Cannot set role to super admin' });
      }
    }

    const result = await usersService.bulkUpdateUsers(userIds, updates);

    res.json(result);
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

