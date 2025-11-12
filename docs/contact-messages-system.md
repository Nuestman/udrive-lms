# Contact Messages System Documentation

## Overview

The Contact Messages System provides a comprehensive solution for managing public inquiries from the SunLMS landing page. The system includes a public contact form, backend message storage, email notifications, and an admin interface for managing and responding to messages. All contact messages are system-level and accessible only to super administrators.

## Architecture

### Database Schema

#### Contact Messages Table
```sql
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    is_read BOOLEAN DEFAULT false,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Contact Message Replies Table
```sql
CREATE TABLE contact_message_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_message_id UUID NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    replied_by UUID NOT NULL REFERENCES users(id),
    reply_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_contact_messages_status` - For filtering by status
- `idx_contact_messages_is_read` - For unread message queries
- `idx_contact_messages_created_at` - For sorting by date
- `idx_contact_messages_email` - For email-based searches
- `idx_contact_message_replies_message_id` - For fetching replies
- `idx_contact_message_replies_created_at` - For sorting replies

### Frontend Components

#### Landing Page Contact Form
**File**: `src/components/pages/LandingPage.tsx`

The contact form is integrated into the landing page with:
- Real-time validation
- Success/error feedback
- Direct API integration with fallback handling
- Responsive design

```typescript
const [contactForm, setContactForm] = useState({
  name: '',
  email: '',
  subject: '',
  message: ''
});

const handleContactSubmit = async (e: React.FormEvent) => {
  // Submits to /api/contact endpoint
  // Shows success/error messages
};
```

#### Admin Contact Messages Page
**File**: `src/components/pages/ContactMessagesPage.tsx`

Email-style interface for managing messages:
- **Message List**: Sidebar with unread indicators, status badges, and search
- **Message Detail View**: Full conversation view with original message and replies
- **Reply Functionality**: Send replies directly from the interface
- **Status Management**: Update message status (new, read, replied, archived)
- **Statistics Dashboard**: Real-time counts of messages by status
- **Filters**: Search, status filter, and read/unread filter

**Features:**
- Email-style conversational interface
- Real-time statistics
- Mark as read functionality
- Reply to messages with email notifications
- Status management
- Responsive design (mobile-friendly)

### Backend Services

#### Contact Messages Service
**File**: `server/services/contactMessages.service.js`

**Functions:**

1. **`createContactMessage(data)`** - Public endpoint
   - Creates a new contact message
   - Sends admin notification email if configured
   - Returns the created message

2. **`getContactMessages(filters)`** - Admin only
   - Retrieves messages with filtering and pagination
   - Filters: status, is_read, search
   - Includes reply counts and replier information

3. **`getContactMessageById(id)`** - Admin only
   - Gets a single message with all replies
   - Includes user profile information for repliers

4. **`getContactMessageReplies(contactMessageId)`** - Admin only
   - Retrieves all replies for a message
   - Ordered by creation date

5. **`markContactMessageAsRead(id)`** - Admin only
   - Marks message as read
   - Updates status from 'new' to 'read' if applicable

6. **`replyToContactMessage(contactMessageId, userId, replyMessage)`** - Admin only
   - Creates a reply record
   - Updates message status to 'replied'
   - Sends email notification to original sender
   - Uses database transaction for consistency

7. **`updateContactMessageStatus(id, status)`** - Admin only
   - Updates message status (new, read, replied, archived)

8. **`getContactMessageStats()`** - Admin only
   - Returns statistics: total, new, read, replied, archived, unread counts

### API Endpoints

#### Public Endpoints (No Auth Required)

**POST /api/contact**
Create a new contact message from the landing page.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about pricing",
  "message": "I would like to know more about your pricing plans."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about pricing",
    "message": "I would like to know more about your pricing plans.",
    "status": "new",
    "is_read": false,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "Contact message submitted successfully"
}
```

#### Admin Endpoints (Super Admin Only)

**GET /api/contact/messages**
Get all contact messages with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (new, read, replied, archived)
- `is_read` (optional): Filter by read status (true/false)
- `search` (optional): Search in name, email, subject, or message
- `limit` (optional): Number of messages per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Question about pricing",
      "message": "I would like to know more...",
      "status": "new",
      "is_read": false,
      "created_at": "2025-01-15T10:30:00Z",
      "reply_count": 0,
      "replied_by_name": null,
      "replied_by_email": null
    }
  ]
}
```

**GET /api/contact/messages/stats**
Get contact message statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "new_count": 25,
    "read_count": 80,
    "replied_count": 40,
    "archived_count": 5,
    "unread_count": 30
  }
}
```

**GET /api/contact/messages/:id**
Get a single contact message with all replies.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about pricing",
    "message": "I would like to know more...",
    "status": "replied",
    "is_read": true,
    "created_at": "2025-01-15T10:30:00Z",
    "replied_at": "2025-01-15T11:00:00Z",
    "replied_by": "admin-uuid",
    "replied_by_name": "System Admin",
    "replied_by_email": "admin@sunlms.com",
    "reply_count": 1,
    "replies": [
      {
        "id": "reply-uuid",
        "contact_message_id": "uuid",
        "replied_by": "admin-uuid",
        "reply_message": "Thank you for your inquiry...",
        "created_at": "2025-01-15T11:00:00Z",
        "replied_by_name": "System Admin",
        "replied_by_email": "admin@sunlms.com"
      }
    ]
  }
}
```

**PUT /api/contact/messages/:id/read**
Mark a contact message as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_read": true,
    "status": "read"
  },
  "message": "Message marked as read"
}
```

**POST /api/contact/messages/:id/reply**
Reply to a contact message.

**Request:**
```json
{
  "reply_message": "Thank you for your inquiry. We'll get back to you soon."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": {
      "id": "reply-uuid",
      "contact_message_id": "uuid",
      "replied_by": "admin-uuid",
      "reply_message": "Thank you for your inquiry...",
      "created_at": "2025-01-15T11:00:00Z"
    },
    "contactMessage": {
      "id": "uuid",
      "status": "replied",
      "replied_at": "2025-01-15T11:00:00Z"
    }
  },
  "message": "Reply sent successfully"
}
```

**PUT /api/contact/messages/:id/status**
Update contact message status.

**Request:**
```json
{
  "status": "archived"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "archived"
  },
  "message": "Status updated successfully"
}
```

## Security & Access Control

### Access Levels

- **Public**: Anyone can submit contact messages via the landing page
- **Super Admin Only**: All message management and viewing is restricted to super administrators
- **School Admins**: No access to contact messages (system-level feature)

### Role-Based Access Control

All admin endpoints require:
1. **Authentication**: Valid JWT token
2. **Authorization**: Super admin role only (`requireRole('super_admin')`)

### Data Isolation

- Contact messages are system-level and not tenant-isolated
- All messages are accessible to all super admins
- No tenant filtering is applied

## Email Notifications

### Admin Notification Email

When a new contact message is received, an email is sent to the admin email (configured via `ADMIN_EMAIL` environment variable or defaults to `nuestman@icloud.com`).

**Email Includes:**
- Sender information (name and email)
- Message subject
- Full message content
- Link to view message in admin panel

### Reply Notification Email

When an admin replies to a message, an email is sent to the original sender.

**Email Includes:**
- Personalized greeting
- Admin's reply message
- Original message for context
- Professional SunLMS branding

### Email Configuration

Email notifications require SMTP configuration in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="SunLMS <noreply@sunlms.com>"
ADMIN_EMAIL=admin@sunlms.com
```

**Note**: If email is not configured, the system will gracefully skip sending emails but still save messages to the database.

## Admin Interface Features

### Dashboard Statistics

Real-time statistics displayed at the top of the page:
- **Total Messages**: Total count of all messages
- **New Messages**: Messages with status 'new'
- **Unread Messages**: Messages with `is_read = false`
- **Read Messages**: Messages with status 'read'
- **Replied Messages**: Messages with status 'replied'
- **Archived Messages**: Messages with status 'archived'

### Message List View

- **Unread Indicators**: Blue circle for unread, checkmark for read
- **Status Badges**: Color-coded status indicators
- **Reply Count**: Shows number of replies per message
- **Search**: Full-text search across name, email, subject, and message
- **Filters**: Filter by status and read/unread state
- **Responsive Design**: Adapts to mobile screens

### Message Detail View

- **Full Message Display**: Shows original message with formatting preserved
- **Sender Information**: Name, email, and timestamp
- **Reply Thread**: All replies displayed in chronological order
- **Reply Form**: Inline reply functionality
- **Status Management**: Dropdown to change message status
- **Email-Style Layout**: Familiar email client interface

### Workflow

1. **New Message Arrives**
   - Appears in message list with "new" status
   - Unread indicator shows in sidebar badge
   - Admin receives email notification

2. **View Message**
   - Click message in list to view details
   - Message automatically marked as read
   - Badge count updates

3. **Reply to Message**
   - Type reply in the reply form
   - Click "Send Reply"
   - Reply saved and email sent to original sender
   - Message status updated to "replied"

4. **Status Management**
   - Change status via dropdown (new, read, replied, archived)
   - Archived messages can be filtered out

## Setup Instructions

### Step 1: Database Migration

Run the contact messages migration:

```bash
# Using psql
psql -d your_database -f database/migrations/create_contact_messages.sql

# Or using your database client
# Execute the SQL from database/migrations/create_contact_messages.sql
```

### Step 2: Environment Configuration

Ensure your `.env` file has the necessary configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="SunLMS <noreply@sunlms.com>"
ADMIN_EMAIL=admin@sunlms.com
```

### Step 3: Access the Admin Interface

1. **Login as Super Admin**
2. **Navigate to**: Admin Dashboard → Contact Messages
3. **Or directly**: `/admin/contact-messages`

## Integration with Landing Page

### Contact Form Integration

The contact form on the landing page automatically submits to `/api/contact`:

```typescript
// From LandingPage.tsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const endpoint = `${API_URL}/contact`;

const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(contactForm)
});
```

### Success/Error Handling

- **Success**: Shows green success message, clears form
- **Error**: Shows red error message with manual email link as fallback
- **No Automatic Email Client**: Never opens email client automatically

## Sidebar Badge Integration

The contact messages menu item shows a badge with unread message count:

- **Badge Display**: Red badge with count (similar to notifications)
- **Auto-Refresh**: Updates every 30 seconds
- **Real-Time Updates**: Badge updates when messages are read

**Implementation:**
```typescript
// From DashboardLayout.tsx
const [unreadContactMessages, setUnreadContactMessages] = useState(0);

useEffect(() => {
  if (role === 'super_admin') {
    const fetchUnreadCount = async () => {
      // Fetches from /api/contact/messages/stats
      // Updates badge count
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }
}, [role]);
```

## Best Practices

### Message Management

1. **Regular Review**: Check messages regularly and respond promptly
2. **Status Organization**: Use status filters to manage workflow
3. **Archive Old Messages**: Archive resolved messages to keep list clean
4. **Search Effectively**: Use search to find specific messages quickly

### Response Guidelines

1. **Timely Responses**: Respond within 24-48 hours
2. **Professional Tone**: Maintain professional communication
3. **Complete Information**: Provide comprehensive answers
4. **Follow-Up**: Archive after confirming resolution

### Email Configuration

1. **Test Email Setup**: Verify email notifications are working
2. **Monitor Admin Email**: Ensure ADMIN_EMAIL is checked regularly
3. **Email Templates**: Customize email templates if needed (in `server/utils/mailer.js`)

## Troubleshooting

### Messages Not Saving

- **Check Database**: Verify migration was run successfully
- **Check API Endpoint**: Ensure `/api/contact` route is registered
- **Check Console**: Look for JavaScript errors in browser console
- **Check Network**: Verify API calls are reaching the server

### Email Notifications Not Sending

- **Check SMTP Config**: Verify all SMTP environment variables are set
- **Check Email Service**: Ensure SMTP credentials are correct
- **Check Logs**: Look for email errors in server logs
- **Graceful Degradation**: System continues to work without email

### Badge Not Updating

- **Check Role**: Ensure user is logged in as super_admin
- **Check API**: Verify `/api/contact/messages/stats` is accessible
- **Check Console**: Look for JavaScript errors
- **Manual Refresh**: Badge auto-refreshes every 30 seconds

### Access Denied Errors

- **Check Authentication**: Ensure user is logged in
- **Check Role**: Contact messages require super_admin role
- **Check Token**: Verify JWT token is valid and not expired

## Database Maintenance

### Cleanup Old Messages

Periodically archive or delete old messages:

```sql
-- Archive messages older than 1 year
UPDATE contact_messages 
SET status = 'archived' 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND status != 'archived';

-- Delete archived messages older than 2 years (optional)
DELETE FROM contact_messages 
WHERE status = 'archived' 
AND created_at < NOW() - INTERVAL '2 years';
```

### Performance Optimization

The system includes indexes for optimal performance:
- Status filtering
- Read/unread queries
- Date sorting
- Email searches

For large datasets, consider:
- Adding pagination (already implemented)
- Periodic archiving
- Database maintenance

## Future Enhancements

Potential improvements for the contact messages system:

1. **Categorization**: Add message categories (sales, support, technical, etc.)
2. **Tags**: Add tagging system for better organization
3. **Assignments**: Assign messages to specific admins
4. **Templates**: Pre-written response templates
5. **Analytics**: Response time tracking and analytics
6. **Export**: Export messages to CSV/Excel
7. **Rich Text Editor**: HTML email replies
8. **Attachments**: Support for file attachments
9. **Integration**: Integration with help desk systems
10. **Automation**: Auto-responders and canned responses

## API Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Summary

The Contact Messages System provides a complete solution for managing public inquiries:

✅ **Public Contact Form** - Integrated into landing page  
✅ **Message Storage** - PostgreSQL database with proper schema  
✅ **Email Notifications** - Admin notifications and reply emails  
✅ **Admin Interface** - Email-style management interface  
✅ **Status Management** - Track message lifecycle  
✅ **Reply System** - Respond directly from admin panel  
✅ **Search & Filter** - Find messages quickly  
✅ **Statistics** - Real-time dashboard metrics  
✅ **Badge Integration** - Unread count in sidebar  
✅ **Security** - Super admin only access  
✅ **Mobile Responsive** - Works on all devices  

*Last updated: November 2025*  
*System Version: 2.4.0*

