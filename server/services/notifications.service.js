import { query } from '../lib/db.js';
import { sendTemplatedEmail, isEmailConfigured } from '../utils/mailer.js';
import { buildEmail } from '../utils/emailTemplates.js';

/**
 * Create a notification with optional email and Socket.IO delivery
 */
export async function createNotification(userId, { type, title, message, link = null, data = {} }, io = null) {
  try {
    console.log('📨 [NOTIFICATION] Creating notification:', { userId, type, title });
    
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, link, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, type, title, message, link, JSON.stringify(data)]
    );
    
    const notification = result.rows[0];
    console.log('✅ [NOTIFICATION] Notification created successfully:', notification.id);
    
    // Emit Socket.IO event if io instance is provided
    if (io) {
      try {
        const socketPayload = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : {},
          read: false,
          createdAt: notification.created_at
        };
        
        io.to(`user_${userId}`).emit('notification', socketPayload);
        console.log(`📡 [SOCKET] Notification emitted to user_${userId}:`, notification.title);
      } catch (error) {
        console.error('❌ [SOCKET] Error emitting Socket.IO notification:', error);
      }
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error('❌ [NOTIFICATION] Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create notification with email delivery for course/module/quiz updates
 */
export async function createUpdateNotification(userId, notificationData, io = null) {
  const { type, title, message, link = null, data = {}, emailData = {} } = notificationData;
  
  // Create in-app notification
  const result = await createNotification(userId, { type, title, message, link, data }, io);
  
  // Send email notification if user has email notifications enabled
  try {
    const userResult = await query(
      `SELECT email, first_name, last_name, settings FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const settings = user.settings || {};
      const notificationSettings = settings.notifications || {};
      
      // Check if email notifications are enabled for this type
      const emailEnabled = notificationSettings.emailNotifications && 
                          notificationSettings[`email${type.charAt(0).toUpperCase() + type.slice(1)}`];
      
      if (emailEnabled && isEmailConfigured()) {
        await sendUpdateEmail(user.email, user.first_name, type, {
          title,
          message,
          link,
          ...emailData
        });
        console.log(`Email notification sent to ${user.email} for ${type}`);
      }
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't fail the notification creation if email fails
  }
  
  return result;
}

/**
 * Send email for course/module/quiz updates
 */
async function sendUpdateEmail(userEmail, firstName, type, data) {
  const emailTemplate = getUpdateEmailTemplate(type);
  if (!emailTemplate) {
    console.warn(`No email template found for notification type: ${type}`);
    return;
  }
  
  try {
    const { subject, html, text } = buildEmail(emailTemplate, {
      firstName,
      ...data
    });
    
    await sendTemplatedEmail(emailTemplate, {
      to: userEmail,
      variables: {
        firstName,
        ...data
      }
    });
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
  }
}

/**
 * Get email template for update notifications
 */
function getUpdateEmailTemplate(type) {
  const templateMap = {
    'course_update': 'course_updated',
    'module_update': 'module_updated', 
    'quiz_update': 'quiz_updated',
    'lesson_update': 'lesson_updated',
    'course_published': 'course_published',
    'module_published': 'module_published',
    'quiz_published': 'quiz_published'
  };
  
  return templateMap[type] || null;
}

/**
 * Notify enrolled students about course updates
 */
export async function notifyEnrolledStudents(courseId, notificationData, io = null) {
  try {
    // Get all enrolled students for the course
    const result = await query(
      `SELECT DISTINCT e.student_id, u.email, u.first_name, u.last_name, u.settings
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1 AND e.status = 'active'`,
      [courseId]
    );
    
    const notifications = [];
    for (const student of result.rows) {
      const notification = await createUpdateNotification(
        student.student_id,
        notificationData,
        io
      );
      notifications.push(notification);
    }
    
    console.log(`Notified ${notifications.length} students about course update`);
    return notifications;
  } catch (error) {
    console.error('Error notifying enrolled students:', error);
    throw error;
  }
}

/**
 * Notify students about module updates
 */
export async function notifyModuleStudents(moduleId, notificationData, io = null) {
  try {
    // Get all students enrolled in the course that contains this module
    const result = await query(
      `SELECT DISTINCT e.student_id, u.email, u.first_name, u.last_name, u.settings
       FROM enrollments e
       JOIN modules m ON e.course_id = m.course_id
       JOIN users u ON e.student_id = u.id
       WHERE m.id = $1 AND e.status IN ('active','completed')`,
      [moduleId]
    );
    
    const notifications = [];
    for (const student of result.rows) {
      const notification = await createUpdateNotification(
        student.student_id,
        notificationData,
        io
      );
      notifications.push(notification);
    }
    
    console.log(`Notified ${notifications.length} students about module update`);
    return notifications;
  } catch (error) {
    console.error('Error notifying module students:', error);
    throw error;
  }
}

/**
 * Notify students about quiz updates
 */
export async function notifyQuizStudents(quizId, notificationData, io = null) {
  try {
    // Get all students enrolled in the course that contains this quiz
    const result = await query(
      `SELECT DISTINCT e.student_id, u.email, u.first_name, u.last_name, u.settings
       FROM enrollments e
       JOIN modules m ON e.course_id = m.course_id
       JOIN quizzes q ON q.module_id = m.id
       JOIN users u ON e.student_id = u.id
       WHERE q.id = $1 AND e.status IN ('active','completed')`,
      [quizId]
    );
    
    const notifications = [];
    for (const student of result.rows) {
      const notification = await createUpdateNotification(
        student.student_id,
        notificationData,
        io
      );
      notifications.push(notification);
    }
    
    console.log(`Notified ${notifications.length} students about quiz update`);
    return notifications;
  } catch (error) {
    console.error('Error notifying quiz students:', error);
    throw error;
  }
}

/**
 * Notify students about lesson updates
 */
export async function notifyLessonStudents(lessonId, notificationData, io = null) {
  try {
    const result = await query(
      `SELECT DISTINCT e.student_id, u.email, u.first_name, u.last_name, u.settings
       FROM enrollments e
       JOIN modules m ON e.course_id = m.course_id
       JOIN lessons l ON l.module_id = m.id
       JOIN users u ON e.student_id = u.id
       WHERE l.id = $1 AND e.status IN ('active','completed')`,
      [lessonId]
    );

    const notifications = [];
    for (const student of result.rows) {
      const notification = await createUpdateNotification(
        student.student_id,
        notificationData,
        io
      );
      notifications.push(notification);
    }

    console.log(`Notified ${notifications.length} students about lesson update`);
    return notifications;
  } catch (error) {
    console.error('Error notifying lesson students:', error);
    throw error;
  }
}

export default {
  createNotification,
  createUpdateNotification,
  notifyEnrolledStudents,
  notifyModuleStudents,
  notifyQuizStudents
};


