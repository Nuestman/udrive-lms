# Settings System Overview

## Introduction

The SunLMS Settings System is a comprehensive configuration management platform that provides role-based access to various settings categories. The system is designed to be modular, scalable, and user-friendly, offering different levels of customization based on user roles and permissions.

## System Architecture

### Role-Based Access Control

The settings system implements a hierarchical role-based access control (RBAC) system:

- **Super Admin**: Full system access, can configure system-wide settings and white-label options
- **School Admin**: School/tenant-specific settings, branding, and user management
- **Instructor**: Course and content-related settings
- **Student**: Personal preferences and notification settings

### Settings Categories

#### 1. User Settings (All Roles)
- **Profile Settings**: Personal information, contact details, avatar
- **Security Settings**: Password management, 2FA, login security
- **Notification Settings**: Email, push, in-app, and SMS notifications
- **Appearance Settings**: Theme preferences, UI customization
- **Language & Timezone**: Localization preferences

#### 2. School/Tenant Settings (School Admin & Super Admin)
- **Basic Information**: School details, contact information
- **Academic Settings**: Calendar, grading, course management
- **Branding**: Logo, colors, custom CSS
- **User Management**: Registration policies, role assignments
- **Integration Settings**: Third-party service configurations

#### 3. System Settings (Super Admin Only)
- **Platform Configuration**: System information, maintenance mode
- **Security Configuration**: Global security policies, audit logging
- **Feature Flags**: Enable/disable system features
- **White Label Settings**: Custom branding, domain management
- **Performance Settings**: Caching, optimization options

## Key Features

### 1. Real-time Updates
- **WebSocket Integration**: Real-time notification delivery
- **Live Settings Sync**: Settings changes applied immediately
- **Multi-device Sync**: Settings synchronized across devices

### 2. Advanced Theming
- **Light/Dark Mode**: Automatic and manual theme switching
- **Custom Colors**: White-label color customization
- **CSS Variables**: Dynamic theming with CSS custom properties
- **Responsive Design**: Theme-aware responsive components

### 3. Comprehensive Notifications
- **Multi-channel Delivery**: Email, push, in-app, SMS
- **Quiet Hours**: Scheduled notification pauses
- **Preference Management**: Granular notification controls
- **Template System**: Customizable notification templates

### 4. Security Features
- **Two-Factor Authentication**: TOTP-based 2FA with QR codes
- **Password Policies**: Configurable password requirements
- **Session Management**: Advanced session controls
- **Audit Logging**: Comprehensive security event tracking

### 5. White Label System
- **Custom Branding**: Logo, colors, favicon management
- **Domain Management**: Custom domain configuration
- **CSS Customization**: Advanced styling capabilities
- **Support Integration**: Branded support channels

## Technical Implementation

### Frontend Architecture

#### Context Providers
```typescript
// Main context providers
<ThemeProvider>
  <ToastProvider>
    <SettingsProvider>
      <NotificationProvider>
        <WhiteLabelProvider>
          <App />
        </WhiteLabelProvider>
      </NotificationProvider>
    </SettingsProvider>
  </ToastProvider>
</ThemeProvider>
```

#### Component Structure
```
src/components/settings/
├── ProfileSettingsModal.tsx
├── NotificationSettingsModal.tsx
├── AdvancedNotificationSettingsModal.tsx
├── SecuritySettingsModal.tsx
├── AppearanceSettingsModal.tsx
├── SchoolSettingsModal.tsx
├── SystemSettingsModal.tsx
├── WhiteLabelSettingsModal.tsx
└── TwoFactorSetupModal.tsx
```

### Backend Architecture

#### API Routes
```
/api/settings/
├── user          # User-specific settings
├── tenant        # School/tenant settings
├── system        # System-wide settings
└── white-label   # White-label settings

/api/2fa/         # Two-factor authentication
├── generate      # Generate 2FA secret
├── verify        # Verify 2FA token
├── disable       # Disable 2FA
└── status        # Get 2FA status

/api/notifications/ # Notification management
├── GET           # Get notifications
├── PUT /:id/read # Mark as read
└── DELETE /:id   # Delete notification
```

#### Services
```
server/services/
├── settings.service.js
├── whiteLabel.service.js
├── twoFactorAuth.service.js
└── notifications.service.js
```

## Database Schema

### Core Tables
```sql
-- Users table with settings JSONB column
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User profiles for additional information
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  profile_preferences JSONB DEFAULT '{}',
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenants for school/tenant settings
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  settings JSONB DEFAULT '{}',
  white_label_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications for real-time communication
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Settings Data Structure

### User Settings Example
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "avatarUrl": "/uploads/avatars/user-123.jpg"
  },
  "notifications": {
    "globalEnabled": true,
    "frequency": "immediate",
    "emailNotifications": true,
    "emailCourseUpdates": true,
    "emailAssignmentReminders": true,
    "emailGrades": true,
    "emailAnnouncements": true,
    "emailSystemUpdates": false,
    "emailSecurityAlerts": true,
    "pushNotifications": false,
    "inAppNotifications": true,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  },
  "appearance": {
    "theme": "dark",
    "compactMode": false,
    "sidebarCollapsed": false,
    "fontSize": "medium",
    "highContrast": false
  },
  "security": {
    "twoFactorEnabled": true,
    "twoFactorVerified": true,
    "twoFactorSecret": "JBSWY3DPEHPK3PXP",
    "twoFactorEnabledAt": "2024-01-01T12:00:00Z"
  },
  "preferences": {
    "language": "en",
    "timezone": "America/New_York",
    "dateFormat": "MM/DD/YYYY",
    "timeFormat": "12h"
  }
}
```

### Tenant Settings Example
```json
{
  "basic": {
    "name": "Sunshine University",
    "address": "123 Education St, Learning City, LC 12345",
    "phone": "+1-555-0123",
    "email": "info@sunshine.edu",
    "website": "https://sunshine.edu"
  },
  "academic": {
    "academicYear": "2024-2025",
    "semesters": ["Fall", "Spring", "Summer"],
    "gradingScale": "A-F",
    "passingGrade": 70,
    "creditHours": true
  },
  "branding": {
    "logoUrl": "/uploads/branding/sunshine-logo.png",
    "faviconUrl": "/uploads/branding/sunshine-favicon.ico",
    "primaryColor": "#1e40af",
    "secondaryColor": "#059669",
    "accentColor": "#dc2626"
  },
  "policies": {
    "registrationEnabled": true,
    "selfRegistration": false,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSymbols": true
    }
  }
}
```

### System Settings Example
```json
{
  "platform": {
    "name": "SunLMS",
    "version": "2.1.0",
    "environment": "production",
    "maintenanceMode": false,
    "registrationEnabled": true
  },
  "security": {
    "passwordMinLength": 8,
    "sessionTimeout": 24,
    "maxLoginAttempts": 5,
    "lockoutDuration": 30,
    "requireEmailVerification": true,
    "twoFactorRequired": false
  },
  "features": {
    "analytics": true,
    "certificates": true,
    "whiteLabel": true,
    "notifications": true,
    "twoFactorAuth": true,
    "apiAccess": true
  },
  "performance": {
    "cacheEnabled": true,
    "cacheTTL": 3600,
    "cdnEnabled": true,
    "compressionEnabled": true
  }
}
```

## API Usage Examples

### Getting User Settings
```javascript
// Get current user's settings
const response = await fetch('/api/settings/user', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { success, data } = await response.json();
console.log('User settings:', data);
```

### Updating Notification Preferences
```javascript
// Update notification settings
const response = await fetch('/api/settings/user', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    }
  })
});
```

### Enabling Two-Factor Authentication
```javascript
// Step 1: Generate 2FA secret
const generateResponse = await fetch('/api/2fa/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { data } = await generateResponse.json();
const { secret, qrCode } = data;

// Step 2: Verify token from authenticator app
const verifyResponse = await fetch('/api/2fa/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ token: '123456' })
});
```

### Managing Notifications
```javascript
// Get user notifications
const notificationsResponse = await fetch('/api/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const notifications = await notificationsResponse.json();

// Mark notification as read
await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Role-based permissions for all settings
- **Audit Logging**: Comprehensive logging of all settings changes
- **Input Validation**: Strict validation of all user inputs

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role Verification**: Server-side role verification for all requests
- **Session Management**: Configurable session timeouts and security
- **Two-Factor Authentication**: Optional 2FA for enhanced security

### API Security
- **Rate Limiting**: Prevent abuse and DoS attacks
- **CORS Configuration**: Proper cross-origin resource sharing
- **HTTPS Enforcement**: All communication over secure connections
- **Input Sanitization**: Protection against injection attacks

## Performance Optimization

### Frontend Optimization
- **Lazy Loading**: Settings modals loaded on demand
- **State Management**: Efficient React context usage
- **Caching**: Local storage for frequently accessed settings
- **Debouncing**: Debounced API calls for better performance

### Backend Optimization
- **Database Indexing**: Optimized database queries
- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Batch Processing**: Batch operations for bulk updates

### Real-time Performance
- **WebSocket Optimization**: Efficient WebSocket connection management
- **Event Batching**: Batch notification delivery
- **Memory Management**: Efficient memory usage for real-time features
- **Connection Pooling**: Optimized WebSocket connection pooling

## Monitoring & Analytics

### System Monitoring
- **Performance Metrics**: Track API response times and throughput
- **Error Tracking**: Monitor and alert on system errors
- **Usage Analytics**: Track feature usage and user behavior
- **Security Monitoring**: Monitor for security threats and anomalies

### User Analytics
- **Settings Usage**: Track which settings are most commonly used
- **Feature Adoption**: Monitor adoption of new features
- **User Preferences**: Analyze user preference patterns
- **Performance Impact**: Measure impact of settings on performance

## Troubleshooting Guide

### Common Issues

#### Settings Not Saving
1. Check network connectivity
2. Verify authentication token
3. Check server logs for errors
4. Validate input data format

#### Theme Not Applying
1. Check Tailwind configuration
2. Verify CSS variables are defined
3. Check browser console for errors
4. Clear browser cache

#### Notifications Not Working
1. Check WebSocket connection
2. Verify notification preferences
3. Check email service configuration
4. Review server logs

#### 2FA Setup Issues
1. Verify QR code generation
2. Check authenticator app compatibility
3. Ensure time synchronization
4. Check token validation logic

### Debug Tools
```javascript
// Debug settings state
const debugSettings = () => {
  console.log('Current settings:', userSettings);
  console.log('Theme:', theme);
  console.log('Notifications:', notifications);
  console.log('White label:', whiteLabelSettings);
};

// Debug API calls
const debugAPI = async (endpoint, options) => {
  console.log('API Call:', endpoint, options);
  try {
    const response = await fetch(endpoint, options);
    console.log('Response:', response.status, response.statusText);
    const data = await response.json();
    console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

## Future Roadmap

### Planned Features
- **Advanced Analytics**: Comprehensive settings usage analytics
- **Bulk Operations**: Mass settings updates and management
- **Import/Export**: Settings backup and restore functionality
- **API Versioning**: Backward compatibility for API changes
- **Mobile App**: Native mobile settings management
- **Advanced Theming**: Visual theme builder interface
- **Multi-language**: Full internationalization support
- **Advanced Notifications**: Rich notification templates and scheduling

### Integration Opportunities
- **SSO Providers**: SAML, OAuth integration
- **Email Services**: Advanced email provider integration
- **SMS Services**: Multiple SMS provider support
- **Analytics Platforms**: Google Analytics, Mixpanel integration
- **Monitoring Tools**: Application performance monitoring
- **Backup Services**: Automated backup solutions
- **Design Systems**: Integration with design system tools
- **Brand Guidelines**: Automated brand compliance checking

## Conclusion

The SunLMS Settings System provides a comprehensive, secure, and user-friendly platform for managing all aspects of the learning management system. With its modular architecture, role-based access control, and extensive customization options, it offers the flexibility needed for diverse educational institutions while maintaining security and performance standards.

The system is designed to scale with growing user bases and evolving requirements, providing a solid foundation for future enhancements and integrations. Regular updates and improvements ensure that the settings system remains current with best practices and user expectations.
