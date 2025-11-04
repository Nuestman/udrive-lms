import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth as authMiddleware } from '../middleware/auth.middleware.js';
import { tenantContext as tenantMiddleware } from '../middleware/tenant.middleware.js';
import { query } from '../lib/db.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await query(
    `SELECT id, type, title, message, link, is_read as read, created_at
     FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [userId]
  );
  
  // Transform snake_case to camelCase for frontend compatibility
  const notifications = result.rows.map(row => ({
    ...row,
    createdAt: row.created_at
  }));
  
  res.json({
    success: true,
    data: notifications
  });
}));

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  const result = await query(
    `UPDATE notifications 
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id, type, title, message, link, is_read as read, created_at`,
    [notificationId, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }
  
  // Transform snake_case to camelCase
  const notification = {
    ...result.rows[0],
    createdAt: result.rows[0].created_at
  };
  
  // Emit to socket.io
  req.app.get('io').to(`user_${userId}`).emit('notification_updated', notification);
  
  res.json({
    success: true,
    data: notification
  });
}));

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
router.put('/read-all', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await query(
    `UPDATE notifications 
     SET is_read = true
     WHERE user_id = $1 AND is_read = false
     RETURNING id, type, title, message, link, is_read as read, created_at`,
    [userId]
  );
  
  // Emit to socket.io
  req.app.get('io').to(`user_${userId}`).emit('notifications_marked_read', {
    count: result.rows.length
  });
  
  res.json({
    success: true,
    data: { count: result.rows.length }
  });
}));

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  const result = await query(
    `DELETE FROM notifications 
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }
  
  // Emit to socket.io
  req.app.get('io').to(`user_${userId}`).emit('notification_deleted', notificationId);
  
  res.json({
    success: true,
    data: { id: notificationId }
  });
}));

/**
 * DELETE /api/notifications/clear-all
 * Delete all notifications for the current user
 */
router.delete('/clear-all', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await query(
    `DELETE FROM notifications 
     WHERE user_id = $1
     RETURNING COUNT(*) as count`,
    [userId]
  );
  
  const count = parseInt(result.rows[0].count);
  
  // Emit to socket.io
  req.app.get('io').to(`user_${userId}`).emit('notifications_cleared', { count });
  
  res.json({
    success: true,
    data: { count }
  });
}));

export default router;
