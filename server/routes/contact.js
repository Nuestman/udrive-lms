// Contact Messages Routes
import express from 'express';
import contactMessagesService from '../services/contactMessages.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/contact
 * Create a new contact message (public endpoint)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: name, email, subject, message'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address'
    });
  }

  const contactMessage = await contactMessagesService.createContactMessage({
    name,
    email,
    subject,
    message
  });

  res.status(201).json({
    success: true,
    data: contactMessage,
    message: 'Contact message submitted successfully'
  });
}));

/**
 * GET /api/contact/messages
 * Get all contact messages (admin only)
 */
router.get('/messages', 
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    };

    const messages = await contactMessagesService.getContactMessages(filters);
    
    res.json({
      success: true,
      data: messages
    });
  })
);

/**
 * GET /api/contact/messages/stats
 * Get contact message statistics (admin only)
 */
router.get('/messages/stats',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const stats = await contactMessagesService.getContactMessageStats();
    
    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/contact/messages/:id
 * Get a single contact message (admin only)
 */
router.get('/messages/:id',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const message = await contactMessagesService.getContactMessageById(req.params.id);
    const replies = await contactMessagesService.getContactMessageReplies(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...message,
        replies
      }
    });
  })
);

/**
 * GET /api/contact/messages/:id/replies
 * Get replies for a contact message (admin only)
 */
router.get('/messages/:id/replies',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const replies = await contactMessagesService.getContactMessageReplies(req.params.id);
    
    res.json({
      success: true,
      data: replies
    });
  })
);

/**
 * PUT /api/contact/messages/:id/read
 * Mark contact message as read (admin only)
 */
router.put('/messages/:id/read',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const message = await contactMessagesService.markContactMessageAsRead(req.params.id);
    
    res.json({
      success: true,
      data: message,
      message: 'Message marked as read'
    });
  })
);

/**
 * POST /api/contact/messages/:id/reply
 * Reply to a contact message (admin only)
 */
router.post('/messages/:id/reply',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { reply_message } = req.body;

    if (!reply_message || reply_message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const result = await contactMessagesService.replyToContactMessage(
      req.params.id,
      req.user.id,
      reply_message
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Reply sent successfully'
    });
  })
);

/**
 * PUT /api/contact/messages/:id/status
 * Update contact message status (admin only)
 */
router.put('/messages/:id/status',
  requireAuth,
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const message = await contactMessagesService.updateContactMessageStatus(
      req.params.id,
      status
    );
    
    res.json({
      success: true,
      data: message,
      message: 'Status updated successfully'
    });
  })
);

export default router;


