# Notification System Documentation

## Overview

The SunLMS Notification System provides comprehensive notification capabilities, including in-app notifications, email notifications, and SMS alerts. The system uses HTTP polling for notification delivery and includes advanced features like quiet hours, notification preferences, and multi-channel delivery.

**Note**: As of version 3.0.0, the notification system has been migrated from Socket.IO (WebSocket) to HTTP polling for improved reliability and simpler deployment.

## Architecture

### Frontend Components

#### NotificationProvider
```typescript
import { NotificationProvider, useNotification } from './contexts/NotificationContext';

// Provider wraps the application
<NotificationProvider>
  <App />
</NotificationProvider>

// Hook for accessing notifications
const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  deleteNotification
} = useNotification();
```

#### NotificationDropdown
```typescript
import NotificationDropdown from './components/common/NotificationDropdown';

// Real-time notification dropdown in header
<NotificationDropdown />
```

#### Notification Settings Modals
```typescript
import NotificationSettingsModal from './components/settings/NotificationSettingsModal';
import AdvancedNotificationSettingsModal from './components/settings/AdvancedNotificationSettingsModal';

// Basic notification preferences
<NotificationSettingsModal isOpen={showBasic} onClose={() => setShowBasic(false)} />

// Advanced notification settings
<AdvancedNotificationSettingsModal isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} />
```

### Backend Services

#### NotificationService
```javascript
import notificationsService from './services/notifications.service.js';

// Create notification
await notificationsService.createNotification(userId, {
  type: 'course_update',
  title: 'New Lesson Available',
  message: 'A new lesson has been added to your course',
  link: '/courses/123/lessons/456'
});

// Get user notifications
const notifications = await notificationsService.getUserNotifications(userId, {
  limit: 20,
  offset: 0,
  unreadOnly: false
});

// Mark as read
await notificationsService.markAsRead(notificationId, userId);
```

#### Socket.IO Integration

**⚠️ CRITICAL: JWT Import Issue with ES Modules**

When using dynamic ES module imports (`await import('jsonwebtoken')`), you **must** access functions via the `.default` property:

```javascript
// ❌ WRONG - Will cause "jwt.verify is not a function"
const jwt = await import('jsonwebtoken');
const decoded = jwt.verify(token, JWT_SECRET);

// ✅ CORRECT - Use .default for dynamic ES module imports
const jwt = await import('jsonwebtoken');
const decoded = jwt.default.verify(token, JWT_SECRET);
```

**Server-side Socket.IO setup**:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Authentication middleware (CRITICAL: Use .default with dynamic import)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.cookie?.split('auth_token=')[1]?.split(';')[0];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Dynamic import requires .default
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, APP_CONFIG.JWT_SECRET);
    
    // Token expiration check
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return next(new Error('Authentication error: Token expired'));
    }
    
    // Verify user exists and is active
    const result = await pool.query(
      'SELECT id, email, role, tenant_id FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }

    const user = result.rows[0];
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.tenantId = user.tenant_id;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});
```

// Connection handling
io.on('connection', (socket) => {
  socket.join(`user_${socket.userId}`);
  socket.join(`tenant_${socket.tenantId}`);
  socket.join(`role_${socket.userRole}`);
});
```

## Notification Types

### System Notifications
- **Platform Updates**: System maintenance, feature releases
- **Security Alerts**: Login attempts, password changes, 2FA events
- **Account Changes**: Profile updates, role changes
- **System Announcements**: Important platform-wide announcements

### Course Notifications
- **New Content**: New lessons, modules, assignments
- **Deadlines**: Assignment due dates, exam schedules
- **Grades**: Grade postings, feedback availability
- **Announcements**: Course-specific announcements from instructors

### Social Notifications
- **Messages**: Direct messages from instructors/students
- **Comments**: Comments on lessons, assignments
- **Mentions**: @mentions in discussions
- **Collaboration**: Group work invitations, updates

### Administrative Notifications
- **Enrollment**: Course enrollment confirmations
- **Approvals**: Assignment submissions, course completions
- **Reports**: Progress reports, analytics summaries
- **Compliance**: Policy updates, training requirements

## Delivery Channels

### In-App Notifications
```typescript
// Real-time in-app notification display
const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead } = useNotification();
  
  return (
    <div className="relative">
      <button className="relative p-2">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg">
        {notifications.map(notification => (
          <div key={notification.id} className="p-4 border-b">
            <h4 className="font-medium">{notification.title}</h4>
            <p className="text-sm text-gray-600">{notification.message}</p>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt))} ago
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Email Notifications
```javascript
// Email notification service
const sendEmailNotification = async (userId, notification) => {
  const user = await getUserById(userId);
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.emailNotifications) return;
  
  const emailTemplate = getEmailTemplate('notification', {
    title: notification.title,
    message: notification.message,
    link: notification.link,
    userName: user.firstName
  });
  
  await sendEmail({
    to: user.email,
    subject: notification.title,
    html: emailTemplate.html,
    text: emailTemplate.text
  });
};
```

### Push Notifications
```javascript
// Push notification service
const sendPushNotification = async (userId, notification) => {
  const user = await getUserById(userId);
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.pushNotifications) return;
  
  // Get user's push subscription
  const subscription = await getPushSubscription(userId);
  if (!subscription) return;
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: '/favicon.ico',
    badge: '/badge.png',
    data: {
      url: notification.link,
      notificationId: notification.id
    }
  });
  
  await webpush.sendNotification(subscription, payload);
};
```

### SMS Notifications
```javascript
// SMS notification service
const sendSMSNotification = async (userId, notification) => {
  const user = await getUserById(userId);
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.smsNotifications || !user.phone) return;
  
  // Only send urgent notifications via SMS
  if (!preferences.smsUrgentOnly || !isUrgentNotification(notification)) return;
  
  const message = `${notification.title}: ${notification.message}`;
  
  await sendSMS({
    to: user.phone,
    message: message,
    from: process.env.SMS_FROM_NUMBER
  });
};
```

## Notification Preferences

### User Preferences Structure
```typescript
interface NotificationPreferences {
  // Global settings
  globalEnabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  
  // Email notifications
  emailNotifications: boolean;
  emailCourseUpdates: boolean;
  emailAssignmentReminders: boolean;
  emailGrades: boolean;
  emailAnnouncements: boolean;
  emailSystemUpdates: boolean;
  emailSecurityAlerts: boolean;
  emailMarketing: boolean;
  
  // Push notifications
  pushNotifications: boolean;
  pushCourseUpdates: boolean;
  pushAssignmentReminders: boolean;
  pushGrades: boolean;
  pushAnnouncements: boolean;
  pushSystemUpdates: boolean;
  pushSecurityAlerts: boolean;
  
  // In-app notifications
  inAppNotifications: boolean;
  inAppCourseUpdates: boolean;
  inAppAssignmentReminders: boolean;
  inAppGrades: boolean;
  inAppAnnouncements: boolean;
  inAppSystemUpdates: boolean;
  inAppSecurityAlerts: boolean;
  
  // SMS notifications
  smsNotifications: boolean;
  smsUrgentOnly: boolean;
  smsSecurityAlerts: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "08:00"
  
  // Advanced settings
  digestEmails: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly';
  showPreview: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
```

### Preference Management
```typescript
// Update notification preferences
const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>) => {
  try {
    await updateUserSettings({
      notifications: preferences
    });
    
    showToast('Notification preferences updated successfully', 'success');
  } catch (error) {
    showToast('Failed to update notification preferences', 'error');
  }
};

// Reset to defaults
const resetNotificationPreferences = async () => {
  const defaultPreferences = getDefaultNotificationPreferences();
  await updateNotificationPreferences(defaultPreferences);
};
```

## Notification Polling

### HTTP Polling Implementation

As of version 3.0.0, notifications are delivered via HTTP polling instead of WebSocket connections. This provides better reliability and simpler deployment.

```typescript
// Frontend polling implementation
const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start polling when user is authenticated
  useEffect(() => {
    if (user && profile) {
      const fetchNotifications = async () => {
        try {
          const response = await get('/api/notifications');
          if (response.success) {
            setNotifications(response.data);
            setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      // Initial fetch
      fetchNotifications();

      // Poll every 30 seconds
      pollingIntervalRef.current = setInterval(fetchNotifications, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [user, profile]);
  
  return { notifications, unreadCount };
};
```

### Server-side Notification Creation

```javascript
// Create notification (stored in database, fetched via polling)
const createNotification = async (userId, notificationData) => {
  // Store notification in database
  const savedNotification = await notificationsService.createNotification(
    userId,
    notificationData
  );
  
  // Send via other channels based on preferences
  const preferences = await getUserNotificationPreferences(userId);
  
  if (preferences.emailNotifications) {
    await sendEmailNotification(userId, savedNotification);
  }
  
  if (preferences.smsNotifications) {
    await sendSMSNotification(userId, savedNotification);
  }
  
  // Note: In-app notifications are fetched via polling
  // No WebSocket broadcasting required
};
```

## Quiet Hours

### Implementation
```typescript
// Check if notification should be sent during quiet hours
const isQuietHours = (preferences: NotificationPreferences): boolean => {
  if (!preferences.quietHoursEnabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseTime(preferences.quietHoursStart);
  const endTime = parseTime(preferences.quietHoursEnd);
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
};

const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};
```

### Quiet Hours UI
```typescript
// Quiet hours configuration in settings
const QuietHoursSettings = () => {
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('08:00');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Quiet Hours</h3>
          <p className="text-sm text-gray-500">
            Pause notifications during specified hours
          </p>
        </div>
        <Toggle
          enabled={quietHoursEnabled}
          onChange={setQuietHoursEnabled}
        />
      </div>
      
      {quietHoursEnabled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

## Notification Templates

### Email Templates
```javascript
// Email notification templates
const emailTemplates = {
  course_update: ({ title, message, link, userName }) => ({
    subject: `Course Update: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Course Update</h2>
        <p>Hi ${userName},</p>
        <p>${message}</p>
        <a href="${link}" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Update
        </a>
      </div>
    `,
    text: `Course Update: ${title}\n\nHi ${userName},\n\n${message}\n\nView Update: ${link}`
  }),
  
  assignment_reminder: ({ title, message, dueDate, link, userName }) => ({
    subject: `Assignment Reminder: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Assignment Reminder</h2>
        <p>Hi ${userName},</p>
        <p>${message}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <a href="${link}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Assignment
        </a>
      </div>
    `,
    text: `Assignment Reminder: ${title}\n\nHi ${userName},\n\n${message}\n\nDue Date: ${dueDate}\n\nView Assignment: ${link}`
  })
};
```

### SunLMS Email System (New)

Implemented in `server/utils/emailTemplates.js` and `server/utils/mailer.js`.

- Branding
  - Inline logo (CID) with fallback URL, larger header image
  - Env: `EMAIL_BRAND_LOGO_URL` (optional), `FRONTEND_URL`

- Account
  - welcome_user, account_activated, account_deactivated, account_deleted,
    admin_password_reset_notification, 2fa_enabled, 2fa_disabled

- Enrollment & Certificates
  - enrollment_created, course_completed_certificate

- Course / Module / Lesson
  - course_published, course_updated (with updateDetails)
  - module_published, module_updated (with updateDetails)
  - lesson_published, lesson_updated (with updateDetails)

- Quizzes (more specific)
  - quiz_assigned (courseName, moduleName, dueAt?, timeLimit?, attemptsAllowed?)
  - quiz_updated (courseName, updateDetails)
  - quiz_result (score?)

Usage:
```js
await sendTemplatedEmail('quiz_assigned', {
  to: user.email,
  variables: { firstName, quizName, courseName, moduleName, quizUrl, dueAt, timeLimit, attemptsAllowed }
});
```

### Event Triggers (Email + In‑App)

- Course
  - Publish: tenant‑wide email to all active students (moved from create)
  - Update: enrolled students (active or completed) via in‑app; email optional by prefs

- Module / Lesson
  - Publish/Update: enrolled students (active or completed)

- Quiz
  - Publish/Assign: enrolled students with course/module context
  - Update / Result: detailed emails

Delivery
- In‑app: saved in notifications; fetched via HTTP polling (30s interval)
- Email: Nodemailer (Gmail SMTP); required env: SMTP_HOST/PORT/USER/PASSWORD, EMAIL_FROM
- Branding logo CID used when available

### Push Notification Templates
```javascript
// Push notification templates
const pushTemplates = {
  course_update: (notification) => ({
    title: notification.title,
    body: notification.message,
    icon: '/icons/course-update.png',
    badge: '/badges/course.png',
    data: {
      type: 'course_update',
      link: notification.link,
      notificationId: notification.id
    }
  }),
  
  assignment_reminder: (notification) => ({
    title: 'Assignment Due Soon',
    body: notification.message,
    icon: '/icons/assignment.png',
    badge: '/badges/assignment.png',
    data: {
      type: 'assignment_reminder',
      link: notification.link,
      notificationId: notification.id
    }
  })
};
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Notification Preferences
```sql
-- Store notification preferences in user settings
-- This is part of the existing users.settings JSONB column
-- Example structure:
{
  "notifications": {
    "globalEnabled": true,
    "frequency": "immediate",
    "emailNotifications": true,
    "pushNotifications": false,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  }
}
```

## API Reference

### Notification Endpoints

#### GET /api/notifications
Get user notifications
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "course_update",
      "title": "New Lesson Available",
      "message": "A new lesson has been added to your course",
      "link": "/courses/123/lessons/456",
      "read": false,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

#### PUT /api/notifications/:id/read
Mark notification as read
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### DELETE /api/notifications/:id
Delete notification
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

#### PUT /api/notifications/read-all
Mark all notifications as read
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Polling Configuration

#### Polling Interval
```typescript
// Configure polling interval (default: 30 seconds)
const POLLING_INTERVAL = 30000; // 30 seconds

// Adjust based on application needs:
// - Lower interval (10-15s): More real-time, higher server load
// - Higher interval (60s+): Less real-time, lower server load
// - Default (30s): Balanced approach
```

#### Polling Best Practices
- **Start polling** when user authenticates
- **Stop polling** when user logs out or component unmounts
- **Handle errors gracefully** - continue polling even if a request fails
- **Respect rate limits** - don't poll too frequently
- **Optimize queries** - use pagination and filtering to reduce payload size

## Performance Optimization

### Caching Strategy
```javascript
// Cache notification preferences
const cacheNotificationPreferences = async (userId, preferences) => {
  const cacheKey = `notification_prefs:${userId}`;
  await redis.setex(cacheKey, 3600, JSON.stringify(preferences)); // 1 hour cache
};

// Cache unread count
const cacheUnreadCount = async (userId, count) => {
  const cacheKey = `unread_count:${userId}`;
  await redis.setex(cacheKey, 300, count.toString()); // 5 minute cache
};
```

### Batch Processing
```javascript
// Batch notification processing
const processNotificationBatch = async (notifications) => {
  const batches = chunk(notifications, 100); // Process 100 at a time
  
  for (const batch of batches) {
    await Promise.all(batch.map(notification => 
      processNotification(notification)
    ));
    
    // Small delay between batches to prevent overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

### Database Optimization
```sql
-- Optimized query for getting user notifications
SELECT n.*, 
       CASE WHEN n.read = false THEN 1 ELSE 0 END as is_unread
FROM notifications n
WHERE n.user_id = $1
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;

-- Optimized query for unread count
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = $1 AND read = false;
```

## Security Considerations

### Input Validation
```javascript
// Validate notification data
const validateNotification = (notification) => {
  const schema = Joi.object({
    type: Joi.string().valid('course_update', 'assignment_reminder', 'grade_posted', 'system_announcement').required(),
    title: Joi.string().max(255).required(),
    message: Joi.string().max(1000).required(),
    link: Joi.string().uri().optional(),
    data: Joi.object().optional()
  });
  
  return schema.validate(notification);
};
```

### Rate Limiting
```javascript
// Rate limiting for notification creation
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many notifications created, please try again later.'
});
```

### Access Control
```javascript
// Ensure users can only access their own notifications
const getNotification = async (notificationId, userId) => {
  const notification = await db.query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
  
  if (notification.rows.length === 0) {
    throw new Error('Notification not found or access denied');
  }
  
  return notification.rows[0];
};
```

## Polling Implementation & Best Practices

### Polling Architecture

The notification system uses HTTP polling for reliable notification delivery. This approach eliminates WebSocket complexity while maintaining good user experience.

#### Key Benefits

1. **Simplified Deployment**: No WebSocket server configuration required
2. **Better Reliability**: Works behind firewalls, proxies, and restrictive networks
3. **Reduced Complexity**: No connection state management or reconnection logic
4. **Universal Compatibility**: Works with all network configurations
5. **Easier Debugging**: Standard HTTP requests are easier to monitor and debug

#### Polling Implementation
```typescript
// Polling implementation with error handling
useEffect(() => {
  if (user && profile) {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await get('/api/notifications');
        if (response.success) {
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Don't show error to user - polling will retry automatically
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
    };
  }
}, [user, profile]);
```

#### Error Handling Best Practices
```typescript
// Graceful error handling for polling
const fetchNotifications = async () => {
  try {
    const response = await get('/api/notifications');
    if (response.success) {
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
    }
  } catch (error) {
    // Log error but don't interrupt polling
    console.error('Notification polling error:', error);
    // Polling will automatically retry on next interval
  }
};
```

#### Polling State Management
```typescript
// Track polling state
const [isPolling, setIsPolling] = useState(false);

useEffect(() => {
  if (user && profile) {
    setIsPolling(true);
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      setIsPolling(false);
      clearInterval(interval);
    };
  }
}, [user, profile]);
```

### Database Schema Compatibility

The notification system has been updated to work with the existing database schema:

```sql
-- Existing notifications table structure
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NULL,
  is_read BOOLEAN NULL DEFAULT FALSE,  -- Note: column is 'is_read', not 'read'
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
);
```

**Important**: The API routes have been updated to use `is_read as read` in SELECT queries to maintain compatibility with the frontend code that expects a `read` field.

## Troubleshooting

### Common Issues

#### WebSocket Connection Problems
```javascript
// Debug WebSocket connection
const debugWebSocketConnection = () => {
  socket.on('connect', () => {
    console.log('✅ Connected to notification server');
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });
};
```

#### Authentication Issues
```javascript
// Debug authentication issues
const debugAuthentication = () => {
  const token = localStorage.getItem('token');
  console.log('🔐 Token available:', !!token);
  console.log('👤 User logged in:', !!user);
  console.log('👤 Profile loaded:', !!profile);
  
  if (!token) {
    console.log('❌ No authentication token - Socket.IO connection will be skipped');
  }
};
```

#### Notification Delivery Issues
```javascript
// Debug notification delivery
const debugNotificationDelivery = async (userId, notification) => {
  console.log('📤 Sending notification to user:', userId);
  console.log('📋 Notification data:', notification);
  
  // Check user preferences
  const preferences = await getUserNotificationPreferences(userId);
  console.log('⚙️ User preferences:', preferences);
  
  // Check quiet hours
  if (isQuietHours(preferences)) {
    console.log('🔇 Notification blocked by quiet hours');
    return;
  }
  
  // Check channel preferences
  if (preferences.emailNotifications) {
    console.log('📧 Sending email notification');
  }
  
  if (preferences.pushNotifications) {
    console.log('📱 Sending push notification');
  }
};
```

#### Performance Issues
```javascript
// Monitor notification performance
const monitorNotificationPerformance = async () => {
  const startTime = Date.now();
  
  try {
    await processNotificationBatch(notifications);
    const duration = Date.now() - startTime;
    console.log(`✅ Processed ${notifications.length} notifications in ${duration}ms`);
  } catch (error) {
    console.error('❌ Notification processing failed:', error);
  }
};
```

## Troubleshooting Guide

### Authentication Issues

#### Symptom: "jwt.verify is not a function"
**Cause**: Using dynamic ES module import without `.default` property.

**Solution**:
```javascript
// ❌ Wrong
const jwt = await import('jsonwebtoken');
const decoded = jwt.verify(token, SECRET);

// ✅ Correct
const jwt = await import('jsonwebtoken');
const decoded = jwt.default.verify(token, SECRET);
```

#### Symptom: "Invalid token" Socket.IO errors
**Check**:
1. Token exists in localStorage: `localStorage.getItem('token')`
2. Token is valid: Check terminal for JWT verification logs
3. User is active in database
4. Token hasn't expired

**Debug**:
```typescript
console.log('Token available:', !!localStorage.getItem('token'));
console.log('User logged in:', !!user);
console.log('Socket connected:', connectionStatus === 'connected');
```

### Notification Delivery Issues

#### Symptom: Notifications not appearing in database
**Check**:
1. Notification triggers are present in route handlers
2. `io` instance is available: `req.app.get('io')`
3. No errors in terminal logs

**Debug**:
```javascript
// Look for these logs in terminal:
🎓 [COURSE-CREATE] Course created successfully
📚 [LESSON-CREATE] Lesson created successfully
📦 [MODULE-CREATE] Module created successfully
```

#### Symptom: "Invalid date" in notifications
**Cause**: API returning snake_case, frontend expecting camelCase.

**Solution**: Already fixed in `server/routes/notifications.js` with transformation:
```javascript
const notifications = result.rows.map(row => ({
  ...row,
  createdAt: row.created_at
}));
```

### Polling Issues

#### Symptom: Notifications not updating
**Check**:
1. Polling interval is set correctly (default: 30 seconds)
2. User is authenticated
3. API endpoint `/api/notifications` is accessible
4. No network errors in browser console

**Debug**:
```typescript
// Check if polling is active
console.log('Polling active:', isPolling);
console.log('User authenticated:', !!user);
console.log('Last fetch time:', lastFetchTime);
```

#### Symptom: Too many API requests
**Cause**: Polling interval set too low or multiple polling instances.

**Solution**: Ensure single polling instance and appropriate interval:
```typescript
// Use ref to prevent multiple intervals
const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (user && profile && !pollingIntervalRef.current) {
    pollingIntervalRef.current = setInterval(fetchNotifications, 30000);
  }
  
  return () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };
}, [user, profile]);
```

### Performance Issues

#### Symptom: Slow notification loading
**Optimization**:
```javascript
// Limit results
LIMIT 50

// Add pagination
OFFSET $2 LIMIT $3

// Index database columns
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Future Enhancements

### Planned Features
- **Rich Notifications**: Support for images, videos, and interactive content
- **Notification Scheduling**: Schedule notifications for specific times
- **Notification Analytics**: Track notification engagement and effectiveness
- **Smart Notifications**: AI-powered notification timing and content
- **Multi-language Support**: Localized notification content
- **Notification Templates**: Customizable notification templates
- **Advanced Filtering**: Smart notification filtering and categorization
- **Notification History**: Extended notification history and search

### Integration Opportunities
- **Calendar Integration**: Sync with Google Calendar, Outlook
- **Slack Integration**: Send notifications to Slack channels
- **Microsoft Teams**: Integration with Teams notifications
- **Mobile Apps**: Native mobile notification support
- **Email Marketing**: Integration with email marketing platforms
- **Analytics Platforms**: Integration with Google Analytics, Mixpanel
- **CRM Systems**: Integration with Salesforce, HubSpot
- **Learning Analytics**: Advanced learning analytics and insights

## Migration from Socket.IO to Polling (v3.0.0)

### Breaking Changes

**Socket.IO Removed**: As of version 3.0.0, Socket.IO has been completely removed from the notification system. All real-time WebSocket functionality has been replaced with HTTP polling.

### Migration Guide

#### Frontend Changes Required

1. **Remove Socket.IO Dependencies**:
   ```bash
   npm uninstall socket.io-client
   ```

2. **Update NotificationContext**: The context now uses polling instead of WebSocket connections. No changes needed if using the updated `NotificationContext.tsx`.

3. **Remove Socket Connection Code**: Any custom Socket.IO connection code should be removed.

#### Backend Changes

1. **Socket.IO Server Removed**: The Socket.IO server setup in `server/index.js` has been removed.

2. **Notification Service**: The notification service no longer requires `io` parameter. All socket-related code has been removed.

3. **Route Handlers**: Route handlers no longer emit socket events. Notifications are stored in the database and fetched via polling.

### Benefits of Migration

- **Simplified Architecture**: No WebSocket server management
- **Better Reliability**: Works in all network environments
- **Easier Deployment**: Standard HTTP-only deployment
- **Reduced Complexity**: No connection state management
- **Better Debugging**: Standard HTTP requests are easier to monitor

### Performance Considerations

- **Polling Interval**: Default 30 seconds provides good balance between real-time feel and server load
- **API Optimization**: Notifications endpoint is optimized with pagination and filtering
- **Database Indexes**: Proper indexes ensure fast notification queries
