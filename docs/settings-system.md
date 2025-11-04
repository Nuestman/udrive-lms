# Settings System Documentation

## Overview

The SunLMS Settings System provides comprehensive configuration management for users, tenants, and system-wide settings. It includes role-based access control, real-time updates, and a modern UI for managing all aspects of the platform.

## Architecture

### Frontend Components

#### Context Providers
- **SettingsProvider**: Main context for managing all settings state
- **ThemeProvider**: Handles theme management (light/dark/auto)
- **WhiteLabelProvider**: Manages white-label branding settings
- **NotificationProvider**: Real-time notification management

#### Settings Modals
- **ProfileSettingsModal**: User profile and personal information
- **NotificationSettingsModal**: Basic notification preferences
- **AdvancedNotificationSettingsModal**: Comprehensive notification settings
- **SecuritySettingsModal**: Security settings including 2FA
- **AppearanceSettingsModal**: Theme and UI preferences
- **SchoolSettingsModal**: School/tenant-specific settings
- **SystemSettingsModal**: System-wide configuration
- **WhiteLabelSettingsModal**: White-label branding configuration

### Backend Services

#### API Endpoints
- `/api/settings/user` - User-specific settings
- `/api/settings/tenant` - Tenant/school settings
- `/api/settings/system` - System-wide settings
- `/api/settings/white-label` - White-label settings
- `/api/2fa/*` - Two-factor authentication
- `/api/notifications/*` - Notification management

#### Services
- **SettingsService**: Core settings management
- **WhiteLabelService**: White-label functionality
- **TwoFactorAuthService**: 2FA implementation
- **NotificationService**: Real-time notifications

## User Settings

### Profile Settings
- **Personal Information**: Name, email, phone, avatar
- **Contact Details**: Address, emergency contacts
- **Preferences**: Language, timezone, date format

### Security Settings
- **Password Management**: Change password, password requirements
- **Two-Factor Authentication**: TOTP-based 2FA with QR codes
- **Login Security**: Session management, device tracking
- **Privacy Controls**: Data sharing preferences

### Notification Settings
- **Email Notifications**: Course updates, assignments, grades, announcements
- **Push Notifications**: Mobile and desktop push notifications
- **In-App Notifications**: Real-time in-application notifications
- **SMS Notifications**: Urgent alerts and security notifications
- **Quiet Hours**: Scheduled notification pauses
- **Advanced Settings**: Sound, vibration, preview options

### Appearance Settings
- **Theme Selection**: Light, dark, or auto (system preference)
- **UI Preferences**: Compact mode, sidebar behavior
- **Accessibility**: High contrast, font size, screen reader support
- **Customization**: Personal dashboard layout

## Tenant/School Settings

### Basic Information
- **School Details**: Name, address, contact information
- **Branding**: Logo, colors, custom CSS
- **Domain Configuration**: Custom domain setup
- **Support Information**: Support email, help desk URL

### Academic Settings
- **Academic Calendar**: Terms, semesters, holidays
- **Grading System**: Grade scales, passing criteria
- **Course Management**: Course creation, enrollment rules
- **Instructor Management**: Role assignments, permissions

### System Configuration
- **User Registration**: Open/closed registration policies
- **Authentication**: SSO integration, password policies
- **Data Management**: Backup schedules, retention policies
- **Integration Settings**: Third-party service configurations

## System Settings

### Platform Configuration
- **System Information**: Version, build details
- **Maintenance Mode**: System maintenance controls
- **Feature Flags**: Enable/disable system features
- **Performance Settings**: Caching, optimization options

### Security Configuration
- **Global Security**: Password policies, session timeouts
- **Audit Logging**: Security event tracking
- **Access Control**: IP restrictions, rate limiting
- **Compliance**: GDPR, FERPA compliance settings

### White Label Settings
- **Branding**: Custom logos, colors, favicon
- **Customization**: Custom CSS, footer text
- **Domain Management**: Custom domain configuration
- **Support Configuration**: Custom support channels

## Two-Factor Authentication (2FA)

### Implementation
- **TOTP Support**: Google Authenticator, Authy compatible
- **QR Code Generation**: Easy setup process
- **Backup Codes**: Recovery options
- **Email Notifications**: 2FA status change alerts

### Security Features
- **Time-based Tokens**: 30-second rotating codes
- **Verification Window**: 2-step tolerance for clock drift
- **Secure Storage**: Encrypted secret storage
- **Audit Trail**: 2FA event logging

## Real-time Notifications

### WebSocket Integration
- **Socket.IO**: Real-time communication
- **Authentication**: JWT-based connection auth
- **Room Management**: User, tenant, role-based rooms
- **Event Broadcasting**: System-wide notifications

### Notification Types
- **System Notifications**: Updates, maintenance alerts
- **Course Notifications**: New content, assignments
- **Security Alerts**: Login attempts, 2FA changes
- **Social Notifications**: Messages, mentions, comments

### Delivery Channels
- **In-App**: Real-time dashboard notifications
- **Email**: Digest and immediate notifications
- **Push**: Mobile and desktop push notifications
- **SMS**: Critical security alerts

## Theme System

### Implementation
- **CSS Variables**: Dynamic theme switching
- **Tailwind Integration**: Class-based dark mode
- **System Preference**: Auto theme detection
- **Persistence**: Local storage and database sync

### Theme Options
- **Light Theme**: Default light appearance
- **Dark Theme**: Dark mode with proper contrast
- **Auto Theme**: System preference following
- **Custom Themes**: White-label custom themes

## White Label System

### Branding Features
- **Logo Management**: Upload and manage logos
- **Color Customization**: Primary, secondary, accent colors
- **Favicon Support**: Custom favicon upload
- **Custom CSS**: Advanced styling capabilities

### Domain Management
- **Custom Domains**: Branded domain configuration
- **SSL Support**: Automatic SSL certificate management
- **DNS Configuration**: Domain setup guidance
- **Subdomain Support**: Multi-tenant subdomain handling

### Support Integration
- **Custom Support**: Branded support channels
- **Help Documentation**: Custom help content
- **Contact Information**: Branded contact details
- **Footer Customization**: Custom footer content

## API Reference

### Settings Endpoints

#### GET /api/settings/user
Get user-specific settings
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "notifications": { ... },
    "appearance": { ... },
    "security": { ... }
  }
}
```

#### PUT /api/settings/user
Update user settings
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "notifications": {
    "emailNotifications": true,
    "pushNotifications": false
  }
}
```

#### GET /api/settings/tenant
Get tenant settings (school admin only)
```json
{
  "success": true,
  "data": {
    "basic": { ... },
    "academic": { ... },
    "branding": { ... }
  }
}
```

#### GET /api/settings/system
Get system settings (super admin only)
```json
{
  "success": true,
  "data": {
    "platform": { ... },
    "security": { ... },
    "features": { ... }
  }
}
```

### 2FA Endpoints

#### POST /api/2fa/generate
Generate 2FA secret and QR code
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["123456", "789012"]
  }
}
```

#### POST /api/2fa/verify
Verify 2FA token
```json
{
  "token": "123456"
}
```

#### POST /api/2fa/disable
Disable 2FA
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

### Notification Endpoints

#### GET /api/notifications
Get user notifications
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "type": "course_update",
      "title": "New Lesson Available",
      "message": "A new lesson has been added to your course",
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
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

## Database Schema

### Users Table
```sql
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
```

### User Profiles Table
```sql
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
```

### Tenants Table
```sql
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
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Role-based permissions
- **Audit Logging**: All changes tracked
- **Data Retention**: Configurable retention policies

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Configurable session timeouts
- **2FA Support**: TOTP-based two-factor authentication
- **Password Policies**: Enforceable password requirements

### API Security
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin policies
- **HTTPS Enforcement**: Secure communication

## Performance Optimization

### Caching Strategy
- **Redis Integration**: Session and data caching
- **CDN Support**: Static asset delivery
- **Database Optimization**: Query optimization and indexing
- **Lazy Loading**: Component and route lazy loading

### Real-time Performance
- **WebSocket Optimization**: Efficient connection management
- **Event Batching**: Batch notification delivery
- **Connection Pooling**: Database connection optimization
- **Memory Management**: Efficient state management

## Troubleshooting

### Common Issues

#### Theme Not Applying
- Check Tailwind configuration for `darkMode: 'class'`
- Verify CSS variables are properly defined
- Ensure theme classes are applied to root element

#### 2FA Setup Issues
- Verify QR code generation is working
- Check TOTP secret storage
- Ensure proper time synchronization

#### Notification Delivery Problems
- Check WebSocket connection status
- Verify notification service configuration
- Review email service setup

#### White Label Not Working
- Verify file upload permissions
- Check custom CSS syntax
- Ensure domain configuration is correct

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=settings:*
DEBUG=notifications:*
DEBUG=2fa:*
```

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Settings usage analytics
- **Bulk Operations**: Mass settings updates
- **Import/Export**: Settings backup and restore
- **API Versioning**: Backward compatibility
- **Mobile App**: Native mobile settings management
- **Advanced Theming**: Theme builder interface
- **Multi-language**: Full i18n support
- **Advanced Notifications**: Rich notification templates

### Integration Opportunities
- **SSO Providers**: SAML, OAuth integration
- **Email Services**: Advanced email providers
- **SMS Services**: Multiple SMS providers
- **Analytics**: Google Analytics, Mixpanel
- **Monitoring**: Application performance monitoring
- **Backup Services**: Automated backup solutions
