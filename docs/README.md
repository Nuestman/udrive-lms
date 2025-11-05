# SunLMS Documentation

Welcome to the SunLMS (LMS/CMS-as-a-Service) documentation. This comprehensive guide covers all aspects of the system architecture, features, and implementation. SunLMS is a generic platform that powers specialized solutions for various industries including healthcare, corporate training, driving schools, and education.

## 🏢 System Information

- **System Name**: SunLMS
- **Version**: 2.3.0
- **Status**: Active Development
- **Brand Colors**: Gold/Bronze palette (Primary: #B98C1B)

## 📚 Documentation Structure

### Core System Documentation
- [System Architecture](system-architecture.md) - Overall system design and components
- [Technical Stack](technical-stack.md) - Technologies and frameworks used
- [Database Schema](database-schema.md) - Complete database structure and relationships

### Feature Documentation
- [Authentication System](authentication-system.md) - User authentication, authorization, and security
- [Student Module](student-module.md) - Student dashboard, course enrollment, and learning flows
- [Dual-Role System](dual-role-system.md) - Active role switcher (primary vs active role)
- [Certificate System](certificate-system.md) - Certificates management, verification, and user guides
- [Quiz Engine](quiz-engine.md) - Quiz creation, management, and unified progress tracking
- [Progress Management](progress-management.md) - Unified progress tracking for lessons and quizzes
- [Admin System](admin-system.md) - Administrative features and user management

### Development Documentation
- [API Reference](api-reference.md) - Complete API endpoints and usage
- [Development Setup](development-setup.md) - Local development environment setup
- [Deployment Guide](deployment-guide.md) - Production deployment instructions
- [Migration Guide](migration-guide.md) - Database migrations and updates

### Business Documentation
- [Business Model & Strategic Plan](business-model.md) - Comprehensive business model and market strategy
- [Pitch Deck](pitch-deck.md) - Presentation materials for customer pitches
- [AGA Health Implementation](aga-health-implementation.md) - Specific implementation guide for healthcare pilot

### User Guides
- [Student User Guide](student-user-guide.md) - How to use the system as a student
- [Instructor Guide](instructor-guide.md) - Course creation and management
- [Admin Guide](admin-guide.md) - System administration and management

## 🚀 Quick Start

1. **For Students**: See [Student User Guide](student-user-guide.md)
2. **For Developers**: See [Development Setup](development-setup.md)
3. **For Administrators**: See [Admin Guide](admin-guide.md)

## 📋 Recent Updates

### Version 2.3.0 - Active Role Switcher & Certificates UX
- **Dual-Role (Current Approach)**: Active role switching via `settings.active_role` + `X-Active-Role` header; routing/nav respect `active_role`
- **RBAC/Tenant Isolation**: Student Mode scoping hardened; super admin bypass preserved by primary role
- **Certificates Management**: Revoke/Activate modal with notes and presets; bulk revoke with results; Download/Print via verification page
- **Public Verification**: URL-encoding/decoding handled; enriched details; clearer messages
- **Docs**: Updated dual-role doc and comprehensive certificate doc including end-user guides and media placeholders

### Version 2.2.0 - Brand System Implementation
- **SunLMS Brand Colors**: Comprehensive system-wide implementation of SunLMS brand color palette
  - Primary: `#B98C1B` (Gold/Bronze)
  - Secondary: `#6A4F10` (Deep Gold)
  - Accent: `#D4A730` (Lighter Gold)
  - Brand Text: `#150F00` (Dark Brown)
- **Complete Color Scale**: Full 50-900 scale for all brand colors
- **White-Label System**: Enhanced white-label system with SunLMS brand defaults and revert functionality
- **System-Wide Branding**: All UI components, dashboards, charts, and elements now use brand colors
- **Avatar Branding**: Default avatars now use brand primary color

### Version 2.1.0 - Dual-Role Learning System
- **Dual-Role System**: Instructors, school admins, and super admins can now take courses as students
- **Universal Enrollment**: Cross-role enrollment system that works for all user types
- **Student View Mode**: Elevated roles can access the full student learning experience
- **Seamless View Switching**: Easy switching between management and student views
- **Smart Navigation**: Role-aware navigation that adapts based on user context

### Version 2.0.0 - Unified Learning System
- **Unified Progress Tracking**: Lessons and quizzes now use the same completion system
- **Enhanced Quiz Engine**: Improved quiz experience with unified completion flow
- **Better User Experience**: Consistent interface across all learning content
- **Improved Performance**: Optimized database queries and progress calculations

See [Changelog](../CHANGELOG.md) for complete version history.

## 🎨 Branding & Theming

SunLMS features a comprehensive brand color system with full white-label support:

- **Brand Colors**: Professional gold/bronze palette throughout the application
- **Theme System**: Light/dark mode support with automatic system preference detection
- **White-Label Support**: Custom branding for tenants with logo, colors, and company name
- **CSS Variables**: Flexible theming system using CSS custom properties
- **Tailwind Integration**: Brand colors integrated into Tailwind CSS for consistent styling

See [Theme System Documentation](theme-system.md) for detailed information.

## 🔧 System Status

- ✅ **Authentication System**: Fully implemented with tenant isolation
- ✅ **Student Module**: Complete with course enrollment and progress tracking
- ✅ **Quiz Engine**: Unified with lesson system for consistent experience
- ✅ **Progress Management**: Real-time progress tracking across all content
- ✅ **Admin System**: Full administrative capabilities
- ✅ **Dual-Role System**: Instructors and admins can take courses as students
- ✅ **Universal Enrollment**: Cross-role enrollment system for all user types
- ✅ **File Storage**: Integrated with Vercel Blob for media management
- ✅ **Brand System**: System-wide SunLMS brand color implementation

## 📞 Support

For technical support or questions:
- Check the relevant documentation section
- Review the [Troubleshooting Guide](troubleshooting.md)
- Contact the development team

---

*Last updated: November 2025*  
*Current Version: 2.3.0*
