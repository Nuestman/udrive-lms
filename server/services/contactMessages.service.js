// Contact Messages Service
import { query, getClient } from '../lib/db.js';
import { sendMail, isEmailConfigured } from '../utils/mailer.js';

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Create a new contact message (public endpoint)
 */
export async function createContactMessage(data) {
  const { name, email, subject, message } = data;

  const result = await query(
    `INSERT INTO contact_messages (name, email, subject, message, status, is_read)
     VALUES ($1, $2, $3, $4, 'new', false)
     RETURNING *`,
    [name, email, subject, message]
  );

  const contactMessage = result.rows[0];

  // Send notification email to admin if configured
  if (isEmailConfigured()) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'nuestman@icloud.com';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const messageUrl = `${frontendUrl}/admin/contact-messages`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0F52BA;">New Contact Message</h2>
          <p>You have received a new contact message from the SunLMS website.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>
            <a href="${messageUrl}" style="display:inline-block;background:#0F52BA;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">
              View in Admin Panel
            </a>
          </p>
        </div>
      `;
      
      const text = `New Contact Message\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}\n\nView in Admin Panel: ${messageUrl}`;
      
      await sendMail({
        to: adminEmail,
        subject: `[SunLMS] New Contact Message: ${subject}`,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send contact notification email:', error);
      // Don't fail the request if email fails
    }
  }

  return contactMessage;
}

/**
 * Get all contact messages (admin only)
 */
export async function getContactMessages(filters = {}) {
  let queryText = `
    SELECT 
      cm.*,
      COALESCE(p.first_name || ' ' || p.last_name, u.email) as replied_by_name,
      u.email as replied_by_email,
      (SELECT COUNT(*) FROM contact_message_replies WHERE contact_message_id = cm.id) as reply_count
    FROM contact_messages cm
    LEFT JOIN users u ON cm.replied_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
  `;

  const params = [];
  let paramIndex = 1;
  const conditions = [];

  // Apply filters
  if (filters.status) {
    conditions.push(`cm.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.is_read !== undefined) {
    conditions.push(`cm.is_read = $${paramIndex}`);
    params.push(filters.is_read);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(
      cm.name ILIKE $${paramIndex} OR 
      cm.email ILIKE $${paramIndex} OR 
      cm.subject ILIKE $${paramIndex} OR 
      cm.message ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  queryText += ` ORDER BY cm.created_at DESC`;

  // Add pagination
  if (filters.limit) {
    queryText += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    queryText += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get a single contact message by ID
 */
export async function getContactMessageById(id) {
  const result = await query(
    `SELECT 
      cm.*,
      COALESCE(p.first_name || ' ' || p.last_name, u.email) as replied_by_name,
      u.email as replied_by_email,
      (SELECT COUNT(*) FROM contact_message_replies WHERE contact_message_id = cm.id) as reply_count
    FROM contact_messages cm
    LEFT JOIN users u ON cm.replied_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE cm.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Contact message not found');
  }

  return result.rows[0];
}

/**
 * Get replies for a contact message
 */
export async function getContactMessageReplies(contactMessageId) {
  const result = await query(
    `SELECT 
      cmr.*,
      COALESCE(p.first_name || ' ' || p.last_name, u.email) as replied_by_name,
      u.email as replied_by_email
    FROM contact_message_replies cmr
    JOIN users u ON cmr.replied_by = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE cmr.contact_message_id = $1
    ORDER BY cmr.created_at ASC`,
    [contactMessageId]
  );

  return result.rows;
}

/**
 * Mark contact message as read
 */
export async function markContactMessageAsRead(id) {
  const result = await query(
    `UPDATE contact_messages 
     SET is_read = true, status = CASE WHEN status = 'new' THEN 'read' ELSE status END, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Contact message not found');
  }

  return result.rows[0];
}

/**
 * Reply to a contact message
 */
export async function replyToContactMessage(contactMessageId, userId, replyMessage) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Insert reply
    const replyResult = await client.query(
      `INSERT INTO contact_message_replies (contact_message_id, replied_by, reply_message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [contactMessageId, userId, replyMessage]
    );

    // Update contact message status
    const updateResult = await client.query(
      `UPDATE contact_messages 
       SET status = 'replied', replied_at = NOW(), replied_by = $1, is_read = true, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userId, contactMessageId]
    );

    if (updateResult.rows.length === 0) {
      throw new NotFoundError('Contact message not found');
    }

    // Get contact message details for email
    const contactMessage = updateResult.rows[0];

    await client.query('COMMIT');

    // Send reply email to original sender
    if (isEmailConfigured()) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0F52BA;">Re: ${contactMessage.subject}</h2>
            <p>Hi ${contactMessage.name},</p>
            <p>Thank you for contacting SunLMS. Here is our response:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="white-space: pre-wrap;">${replyMessage}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              <strong>Your original message:</strong><br>
              ${contactMessage.message}
            </p>
            <p style="margin-top: 20px;">
              If you have any further questions, please don't hesitate to contact us.
            </p>
            <p>Best regards,<br>The SunLMS Team</p>
          </div>
        `;
        
        const text = `Re: ${contactMessage.subject}\n\nHi ${contactMessage.name},\n\nThank you for contacting SunLMS. Here is our response:\n\n${replyMessage}\n\n---\n\nYour original message:\n${contactMessage.message}\n\nIf you have any further questions, please don't hesitate to contact us.\n\nBest regards,\nThe SunLMS Team`;
        
        await sendMail({
          to: contactMessage.email,
          subject: `Re: ${contactMessage.subject}`,
          html,
          text,
        });
      } catch (error) {
        console.error('Failed to send reply email:', error);
        // Don't fail the request if email fails
      }
    }

    return {
      reply: replyResult.rows[0],
      contactMessage: contactMessage,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update contact message status
 */
export async function updateContactMessageStatus(id, status) {
  const validStatuses = ['new', 'read', 'replied', 'archived'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const result = await query(
    `UPDATE contact_messages 
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Contact message not found');
  }

  return result.rows[0];
}

/**
 * Get contact message statistics
 */
export async function getContactMessageStats() {
  const result = await query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'new') as new_count,
      COUNT(*) FILTER (WHERE status = 'read') as read_count,
      COUNT(*) FILTER (WHERE status = 'replied') as replied_count,
      COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
      COUNT(*) FILTER (WHERE is_read = false) as unread_count
    FROM contact_messages`
  );

  return result.rows[0];
}

export default {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  getContactMessageReplies,
  markContactMessageAsRead,
  replyToContactMessage,
  updateContactMessageStatus,
  getContactMessageStats,
};


