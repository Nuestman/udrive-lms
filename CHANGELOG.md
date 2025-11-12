# Changelog

All notable changes to SunLMS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2025-11-12

### 🎓 Course Support System & Announcements Platform

This release introduces a comprehensive course support system for student-instructor collaboration, a full-featured announcements platform, and significant improvements to the review prompt system. These features enhance communication, engagement, and feedback collection across the learning platform.

### ✨ Added

#### Course Support System
- **Question & Answer Platform**: Full-featured Q&A system for course-related support
  - Students can ask questions with categories (course content, certificates, resources, technical, other)
  - Lesson context linking for course content questions
  - File attachments support for questions and replies
  - Reply system with instructor and peer responses
  - Mark replies as accepted answers
  - Question status management (open, answered, resolved, closed)
  - View count tracking and reply count updates
- **Edit/Delete Functionality**: Original posters can edit and delete their questions and replies
  - Edit modals with full form support including attachments
  - Delete confirmation modals
  - Ownership verification on backend
- **Support Tab**: Replaced "Discussions" tab with "Support" in lesson viewer
  - Compelling intro section
  - Advanced filtering (category, status, search)
  - Support count badge for open questions
  - Question detail view with replies and attachments
  - Instructor actions (mark as answer, update status)

#### Announcements System
- **Tenant-Isolated Announcements**: High-level broadcast messaging system separate from notifications
  - Global announcements from super admins
  - Tenant-wide announcements from school admins
  - Course/module/lesson/quiz-scoped announcements
  - Rich HTML content with TinyMCE editor
  - Media attachments (images, documents, videos) via Vercel Blob
  - Email delivery with branded templates
  - Read tracking and unread badges
- **Announcement Management**: Comprehensive CRUD interface for all roles
  - Super admin: Full access to all announcements (immutable by others)
  - School admins/Instructors: Create and manage their own announcements
  - Course-specific announcement creation in course editing interface
  - 3-column card layout with notification-style design
  - Status management (draft, scheduled, published, archived)
  - Audience scope selection with dynamic dropdowns
- **Announcement Display**: Multiple viewing surfaces
  - Student lesson viewer announcements tab
  - Dedicated student announcements page
  - Course details page announcements panel
  - Unread announcement count badges
  - Course-scoped filtering for relevant announcements

#### Review Prompt System
- **Progress-Based Triggers**: Automatic review prompts based on course completion percentage
  - Configurable threshold (default 60%)
  - Cooldown period to prevent spam
  - Local storage tracking of prompt history
- **Manual Triggers**: Student-initiated review prompts
  - Floating review button (peek-and-reveal design) in lesson viewer
  - Review button in module completion modal
  - Review button in course completion modal
  - Works for elevated roles in student context
- **Review Settings**: Per-course configuration
  - Progress percentage threshold
  - Lesson count threshold
  - Manual trigger option
  - Metadata normalization (JSONB handling)

#### File Storage Improvements
- **Human-Readable Paths**: Context-aware file organization
  - Files stored in tenant/course/module/lesson-specific directories
  - Uses course names, lesson names instead of UUIDs for readability
  - Organized by context (announcements, support, assignments, etc.)
- **Filename Sanitization**: URL-safe filename handling
  - Automatic sanitization of all uploaded filenames
  - Preserves original filename in metadata
  - Prevents path traversal and special character issues

### 🔄 Changed

#### CORS Configuration
- **Vercel Preview Support**: Updated CORS to allow Vercel preview deployments
  - Added support for `*.vercel.app` domains
  - Maintains security for development and production
  - Allows testing on preview deployments without CORS errors

#### API Client
- **Delete Method**: Fixed delete operations to use `api.del` instead of `api.delete`
  - Resolves "delete is not a function" errors
  - Consistent with API client implementation

#### Course Details Page
- **Layout Improvements**: Responsive 2-column layout
  - Announcements panel and review prompt settings side-by-side
  - Better use of screen space
  - Improved visual hierarchy

#### Student Lesson Viewer
- **Tab Organization**: Enhanced tab system
  - Renamed "Discussions" to "Support"
  - Added badges for unread announcements and open support questions
  - Improved badge positioning to prevent clipping

### 🐛 Fixed

#### Announcements System
- **Course-Scoped Filtering**: Fixed announcement fetching to show only relevant course announcements
  - Student lesson viewer now filters correctly
  - Course details page shows only course-specific announcements
  - Excludes global announcements with general context type
- **Metadata Handling**: Fixed JSONB vs text errors in review prompt settings
  - Normalized metadata to always be an object
  - Proper parsing on load and stringification on save
- **File Size Constraint**: Fixed null file_size constraint violations
  - Ensures file_size is always provided during media upload
  - Falls back to buffer length if Vercel Blob doesn't provide size

#### Review Prompt System
- **Role Context Detection**: Fixed review prompts for elevated roles in student context
  - Added `isStudentContext` helper function
  - Checks both `profile.role` and `profile.active_role`
  - Floating button and completion modal triggers now work correctly

#### Support System
- **API Response Unwrapping**: Fixed question/reply fetching
  - Corrected response structure handling
  - Proper array vs single-item checks
- **Attachment Constraints**: Fixed database constraint violations
  - Reply attachments now correctly set `question_id` to NULL
  - Satisfies CHECK constraint requirements

### 📚 Documentation

#### New Documentation
- **Announcement System**: Comprehensive documentation (`docs/announcement-system.md`)
  - System architecture and database schema
  - API endpoints with examples
  - Permission rules and tenant isolation
  - Email delivery configuration
  - Troubleshooting guide

#### Updated Documentation
- **Course Support System**: Database migration documentation
- **File Storage**: Updated storage path documentation with human-readable paths

### 🔒 Security

#### Access Control
- **Announcement Immutability**: Super admin announcements are read-only for other roles
- **Ownership Verification**: Edit/delete operations verify original poster ownership
- **Tenant Isolation**: Strict tenant scoping for all announcements and support questions
- **Role-Based Permissions**: Proper RBAC enforcement across all new features

### 🗃️ Database Changes

#### New Tables
- `announcements`: Stores announcement content, metadata, and scheduling
- `announcement_media`: Links media files to announcements
- `announcement_reads`: Tracks read status per user
- `course_support_questions`: Stores student questions with categories and status
- `course_support_replies`: Stores replies to questions with answer marking
- `course_support_attachments`: Stores file attachments for questions and replies

#### Indexes
- Announcement filtering and search indexes
- Support question category and status indexes
- Read tracking indexes
- Performance optimization indexes

### 📋 Migration Required

#### Database Migrations
- Run migration: `database/migrations/20251113_create_announcements_system.sql`
- Run migration: `database/migrations/20251114_create_course_support_system.sql`
- Both migrations create tables, indexes, and triggers
- No data migration required (new features)

---

## [2.4.0] - 2025-11-06

### 📬 Contact Messages System

This release introduces a comprehensive contact messages system for managing public inquiries from the SunLMS landing page, including backend storage, email notifications, and an admin interface for managing and responding to messages.

### ✨ Added

#### Contact Messages System
- **Public Contact Form**: Integrated contact form on landing page with real-time validation and error handling
- **Backend Message Storage**: PostgreSQL database schema for storing contact messages and replies
- **Admin Interface**: Email-style interface for managing messages with search, filters, and status management
- **Reply System**: Direct reply functionality with email notifications to original senders
- **Statistics Dashboard**: Real-time counts of messages by status (new, read, replied, archived)
- **Sidebar Badge**: Unread message count badge in admin sidebar (similar to notifications)

#### Database Schema
- **Contact Messages Table**: Stores public inquiries with status tracking and read/unread states
- **Contact Message Replies Table**: Stores admin replies to messages
- **Indexes**: Optimized indexes for filtering, search, and sorting

#### Email Notifications
- **Admin Notifications**: Email alerts to admin when new messages are received
- **Reply Notifications**: Email notifications to original senders when admins reply
- **Graceful Degradation**: System continues to work without email configuration

#### API Endpoints
- **POST /api/contact**: Public endpoint for submitting contact messages (no auth required)
- **GET /api/contact/messages**: Admin endpoint for retrieving messages with filtering and pagination
- **GET /api/contact/messages/stats**: Admin endpoint for message statistics
- **GET /api/contact/messages/:id**: Admin endpoint for retrieving single message with replies
- **PUT /api/contact/messages/:id/read**: Admin endpoint for marking messages as read
- **POST /api/contact/messages/:id/reply**: Admin endpoint for replying to messages
- **PUT /api/contact/messages/:id/status**: Admin endpoint for updating message status

### 🔄 Changed

#### Security & Access Control
- **Super Admin Only**: All contact message management restricted to super administrators
- **System-Level Feature**: Contact messages are system-level and not tenant-isolated
- **Role-Based Access**: School admins (tenant-level) do not have access to contact messages

#### Landing Page
- **Contact Form Integration**: Contact form now submits directly to backend API
- **Error Handling**: Improved error messages with fallback to manual email contact
- **Success Feedback**: Clear success messages with automatic form clearing

### 🐛 Fixed

#### Database Queries
- **User Profile Joins**: Fixed SQL queries to correctly join `user_profiles` table for replier information
- **Name Fields**: Fixed queries to use `first_name` and `last_name` from `user_profiles` instead of `users` table
- **COALESCE Handling**: Added proper fallback for replier names when profile doesn't exist

#### API Integration
- **Contact Form**: Fixed contact form to work directly with backend API instead of mailto fallback
- **Badge Updates**: Fixed unread message count badge to update correctly in sidebar
- **Message Fetching**: Fixed message list queries to handle missing user profile data gracefully

### 📚 Documentation

#### New Documentation
- **Contact Messages System**: Comprehensive documentation (`docs/contact-messages-system.md`)
  - System architecture and database schema
  - API endpoints with request/response examples
  - Setup instructions and configuration
  - Admin interface features and workflows
  - Troubleshooting guide
  - Best practices and maintenance

#### Updated Documentation
- **API Reference**: Added complete Contact Messages Endpoints section
- **README**: Added link to Contact Messages System documentation
- **Implementation Status**: Updated to include contact messages system

### 🔒 Security

#### Access Control
- **Super Admin Only**: All admin endpoints require super admin role
- **Public Submission**: Public endpoint for message submission (no authentication)
- **Data Isolation**: System-level messages accessible only to super admins
- **RBAC Enforcement**: Proper role-based access control on all admin endpoints

### 🗃️ Database Changes

#### New Tables
- `contact_messages`: Stores public contact form submissions
- `contact_message_replies`: Stores admin replies to messages

#### Indexes
- Status filtering indexes
- Read/unread query indexes
- Date sorting indexes
- Email search indexes
- Reply relationship indexes

### 📋 Migration Required

#### Database Migration
- Run migration: `database/migrations/create_contact_messages.sql`
- Creates tables, indexes, and triggers
- No data migration required (new feature)

## [2.3.0] - 2025-11-05

### ✨ Dual-Role Switcher, Certificates UX, RBAC/Tenant Fixes

This release re-implements the dual-role system via an active role switcher, hardens RBAC and tenant isolation across enrollments/progress, and delivers a complete certificates management experience including public verification improvements and end-user documentation.

### Added
- RoleSwitcher UI with persisted `settings.active_role` and `X-Active-Role` header
- Certificates management UI: Revoke/Activate modal with notes and preset reasons; Download/Print via verification page; bulk revoke with per-item results
- Public verification: URL-encoding/decoding support; enriched details; clearer messages
- Documentation: New `docs/dual-role-system.md`; expanded `docs/certificate-system.md` with end-user guides, screenshots/GIFs placeholders

### Changed
- Auth/Tenant middleware: use activeRole for student scoping and primaryRole for admin privileges; super admin bypass preserved when `tenantId=null`
- App/Dashboard routing/navigation now respect `active_role`
- Certificate routes/services: verification route decodes code; verify service returns normalized data; fixed SQL param index for notes
- Student experience: removed silent redirects; explicit error toasts; improved thumbnail fallbacks

### Fixed
- Cross-user data bleed by enforcing `student_id` scope in Student Mode across APIs and client hooks
- Super admin enrollment/access by bypassing tenant filters where intended
- Build error in `StudentLessonViewer` by renaming conflicting `error` state

### Documentation
- Added and updated dual-role and certificate system docs with setups, flows, FAQs, and media guidance

---

## [2.2.0] - 2025-11-04

### 🎨 Brand System Implementation

This release implements comprehensive SunLMS brand color system throughout the entire application, replacing default Tailwind colors with the SunLMS brand palette.

### ✨ Added

#### Brand Color System
- **SunLMS Brand Colors**: System-wide implementation of SunLMS brand color palette
  - Primary: `#B98C1B` (Gold/Bronze)
  - Secondary: `#6A4F10` (Deep Gold)
  - Accent: `#D4A730` (Lighter Gold)
  - Brand Text: `#150F00` (Dark Brown)
- **Complete Color Scale**: Full 50-900 scale for all brand colors derived from primary
- **CSS Variable Integration**: Brand colors integrated into CSS custom properties for runtime theming
- **Tailwind Config Updates**: Updated Tailwind configuration with brand color fallbacks

#### White-Label System Enhancements
- **Revert to Defaults**: Added "Revert to Defaults" button in White Label Settings with confirmation modal
- **SunLMS Default Colors**: White-label system now defaults to SunLMS brand colors
- **Improved Color Management**: Enhanced color variable management for proper fallback behavior

### 🔄 Changed

#### System-Wide Brand Application
- **Dashboard Components**: Converted all blue/orange/teal/indigo colors to primary/accent brand colors
  - SuperAdminDashboard, SchoolAdminDashboard, InstructorDashboard, StudentDashboard
  - All stat cards, icons, progress bars, and UI elements
- **Student Components**: Updated ProgressTracking, StudentDashboard, StudentManagement, StudentCoursesPage
- **User Management**: Updated UsersPage, UserRoleDistribution, UserProfilePage
- **Course Components**: Updated CoursesPage, CourseDetailsPage, enrollment components
- **Lesson Components**: Updated ScenarioBlock, RoadSignBlock, BlockEditor
- **Documentation Pages**: Updated all documentation components with brand colors
- **Analytics & Charts**: Updated chart colors to use brand colors (primary and brand text)
- **Avatar Generation**: Updated default avatar background colors to use brand primary color (`#B98C1B`)

#### Color Token Mapping
- **Blue → Primary**: All blue color classes converted to primary brand token
- **Orange → Accent**: All orange color classes converted to accent brand token
- **Purple → Primary**: General UI purple elements converted to primary (kept for super_admin role distinction)
- **Indigo → Primary**: All indigo colors converted to primary brand token

#### Tailwind Configuration
- **Gradient Support**: Fixed primary-500 to use RGB format for proper gradient support
- **Fallback Values**: Updated all color fallbacks to SunLMS brand colors instead of blue
- **CSS Variable Integration**: Proper RGB format for all color scales to support gradients

### 🐛 Fixed

#### Brand Color Issues
- **Gradient Colors**: Fixed `from-primary-500 to-primary-600` gradients displaying blue instead of brand colors
- **Avatar Colors**: Fixed default avatar backgrounds using blue instead of brand color
- **White-Label Revert**: Fixed revert functionality to properly restore SunLMS brand colors
- **Tailwind Fallbacks**: Fixed Tailwind config fallback values to use brand colors

### 📚 Documentation

#### Updated Documentation
- **Theme System**: Updated theme system documentation with SunLMS brand color specifications
- **White-Label Guide**: Updated white-label documentation with new revert functionality
- **Brand Guidelines**: Documented brand color system and usage guidelines

## [2.1.0] - 2025-10-21

### 🎉 Major Release - Dual-Role Learning System

This major release introduces a revolutionary dual-role system that allows elevated roles (instructors, school admins, super admins) to participate as students in courses while maintaining their administrative capabilities. This creates a more flexible and comprehensive learning experience for all user types.

### ✨ Added

#### Dual-Role System
- **Universal Enrollment**: Instructors, school admins, and super admins can now enroll in courses as students
- **Student View Mode**: Elevated roles can access the full student learning experience
- **Role-Aware Navigation**: Smart navigation that adapts based on user role
- **Seamless View Switching**: Easy switching between management and student views

#### Enhanced Course Navigation
- **Student View Button**: Dedicated button in course management to access student learning experience
- **Back to Management Button**: Easy return to administrative view from student experience
- **Universal Enrollment Button**: Smart enrollment button that adapts based on enrollment status
- **Progress-Aware Actions**: Buttons that change based on course progress (Start Course → Continue Learning → View Certificate)

#### Universal Student Dashboard
- **Cross-Role Dashboard**: Student dashboard component accessible to all user roles
- **Enrollment Tracking**: Track enrollments and progress regardless of primary role
- **Course Actions**: Start, continue, review, and certificate actions for all enrolled courses
- **Progress Visualization**: Real-time progress tracking for all enrolled courses

#### Enhanced API System
- **Universal Enrollment API**: New enrollment endpoints that work across all user roles
- **Role-Aware Access Control**: API endpoints that respect both administrative and student roles
- **Progress Tracking**: Unified progress tracking for all user types
- **Flexible Permissions**: Permissions system that allows dual-role functionality

### 🔄 Changed

#### User Experience
- **Elevated Role Learning**: Instructors and admins can now take courses alongside students
- **Unified Learning Interface**: Same learning experience for all user types
- **Smart Button States**: Enrollment buttons that adapt based on progress and completion
- **Contextual Navigation**: Navigation that understands both administrative and student contexts

#### Backend Architecture
- **Flexible Enrollment System**: Enrollment system that works for all user roles
- **Role-Aware Services**: Services that handle both administrative and student operations
- **Enhanced Progress Tracking**: Progress tracking that works across all user types
- **Unified API Endpoints**: API endpoints that serve both administrative and student needs

#### Frontend Components
- **UniversalEnrollmentButton**: New component that adapts based on user role and enrollment status
- **UniversalStudentDashboard**: New component that provides student experience for all roles
- **Enhanced CourseDetailsPage**: Course management page with student view capabilities
- **Improved StudentLessonViewer**: Lesson viewer with management navigation for elevated roles

### 🐛 Fixed

#### Navigation Issues
- **Student View Navigation**: Fixed navigation to student learning experience for elevated roles
- **Role-Based Routing**: Fixed routing to work correctly for all user roles
- **Button State Management**: Fixed button states to reflect actual enrollment and progress
- **View Switching**: Fixed seamless switching between management and student views

#### Enrollment System
- **Cross-Role Enrollment**: Fixed enrollment system to work for all user roles
- **Progress Tracking**: Fixed progress tracking for elevated roles taking courses
- **Certificate Access**: Fixed certificate viewing for elevated roles
- **Course Completion**: Fixed course completion flow for all user types

### 🔧 Technical Improvements

#### New Components
- **UniversalEnrollmentButton**: Adaptive enrollment button component
- **UniversalStudentDashboard**: Cross-role student dashboard component
- **Enhanced Navigation**: Role-aware navigation system
- **Smart Action Buttons**: Context-aware action buttons

#### API Enhancements
- **Universal Enrollment Endpoints**: New endpoints for cross-role enrollment
- **Enhanced Progress API**: Progress tracking that works for all user types
- **Role-Aware Permissions**: Permission system that supports dual roles
- **Flexible Access Control**: Access control that allows both administrative and student access

#### Database Updates
- **Enhanced Enrollment System**: Updated enrollment system to support all user roles
- **Progress Tracking**: Enhanced progress tracking for dual-role users
- **Permission Updates**: Updated permissions to support dual-role functionality

### 📚 Documentation

#### New Documentation
- **Dual-Role System Guide**: Comprehensive guide for the new dual-role functionality
- **Enhanced User Guides**: Updated user guides to include dual-role features
- **API Documentation**: Updated API documentation for new endpoints
- **Technical Documentation**: Technical documentation for dual-role implementation

## [2.0.0] - 2025-10-18

### 🎉 Major Release - Unified Learning System

This major release introduces a unified approach to learning content, treating lessons and quizzes as equal components in the learning experience. This creates a more consistent and intuitive user experience across all learning materials.

### ✨ Added

#### Unified Progress System
- **Content Progress Table**: New `content_progress` table that handles both lessons and quizzes
- **Unified Completion Flow**: Lessons and quizzes now use the same completion mechanism
- **Consistent Progress Tracking**: Both content types contribute equally to module and course completion
- **Migration System**: Automated migration from legacy progress tables

#### Enhanced Quiz Experience
- **Unified Quiz Interface**: Quizzes now load within the lesson container for consistency
- **Manual Completion**: Quizzes no longer auto-complete; users must explicitly mark them as complete
- **Passing Score Validation**: "Mark as Complete" button only appears when passing score is reached
- **Improved Retake Logic**: Better quiz retake functionality with proper state management

#### Progress Management Improvements
- **Real-time Updates**: Immediate progress updates after content completion
- **Unified Progress Calculation**: Single system for calculating course and module progress
- **Enhanced Progress API**: New unified progress endpoints for better performance
- **Progress Visualization**: Improved progress indicators and completion tracking

#### Database Enhancements
- **Unified Schema**: New database schema supporting unified content model
- **Performance Optimization**: Optimized indexes and queries for better performance
- **Data Migration**: Comprehensive migration from legacy progress system
- **Backup and Recovery**: Enhanced backup procedures for data protection

### 🔄 Changed

#### User Experience
- **Consistent Interface**: Lessons and quizzes now share the same user interface patterns
- **Unified Navigation**: Same navigation controls for all content types
- **Progress Consistency**: Progress tracking works identically for lessons and quizzes
- **Completion Flow**: Same completion flow for all learning content

#### Backend Architecture
- **Unified Services**: Progress service now handles both lessons and quizzes
- **API Consistency**: Consistent API endpoints for all content types
- **Database Queries**: Optimized queries for unified progress tracking
- **Service Integration**: Better integration between different system components

#### Frontend Components
- **StudentLessonViewer**: Enhanced to handle both lessons and quizzes uniformly
- **Progress Components**: Updated to work with unified progress system
- **Quiz Engine**: Improved integration with lesson viewer
- **Navigation**: Consistent navigation across all content types

### 🐛 Fixed

#### Quiz System
- **Retake Functionality**: Fixed quiz retake button not working properly
- **Completion Logic**: Fixed quiz completion not showing results correctly
- **State Management**: Fixed quiz state not updating properly after completion
- **Progress Updates**: Fixed quiz progress not updating in real-time

#### Progress Tracking
- **Progress Calculation**: Fixed progress calculation including both lessons and quizzes
- **Completion Status**: Fixed completion status not updating correctly
- **Data Synchronization**: Fixed progress data not syncing between frontend and backend
- **Module Completion**: Fixed module completion not triggering properly

#### User Interface
- **Celebration Modal**: Fixed modal appearing behind sidebar on all devices
- **Mark as Incomplete**: Fixed incorrect toast message when marking content as incomplete
- **Progress Display**: Fixed progress not showing correctly in various components
- **Responsive Design**: Fixed layout issues on mobile devices

#### Database Issues
- **Foreign Key Constraints**: Fixed constraint violations when inserting quiz progress
- **Data Migration**: Fixed data migration from legacy progress tables
- **Query Performance**: Fixed slow queries in progress calculation
- **Data Integrity**: Fixed data consistency issues in progress tracking

### 🔧 Technical Improvements

#### Database
- **Schema Optimization**: Improved database schema for better performance
- **Index Optimization**: Added strategic indexes for common queries
- **Query Optimization**: Optimized SQL queries for better performance
- **Migration System**: Enhanced migration system for easier updates

#### API
- **Endpoint Optimization**: Optimized API endpoints for better performance
- **Response Format**: Standardized API response format
- **Error Handling**: Improved error handling and response codes
- **Documentation**: Enhanced API documentation

#### Frontend
- **Component Optimization**: Optimized React components for better performance
- **State Management**: Improved state management for better user experience
- **Error Handling**: Enhanced error handling and user feedback
- **Accessibility**: Improved accessibility features

### 📚 Documentation

#### Comprehensive Documentation
- **System Architecture**: Complete system architecture documentation
- **API Reference**: Comprehensive API documentation with examples
- **User Guides**: Detailed guides for students, instructors, and administrators
- **Technical Documentation**: Technical stack and implementation details

#### Migration Documentation
- **Migration Guide**: Complete guide for database and system migrations
- **Deployment Guide**: Comprehensive deployment and setup documentation
- **Troubleshooting Guide**: Detailed troubleshooting for common issues
- **Development Setup**: Complete development environment setup guide

### 🗃️ Database Changes

#### New Tables
- `content_progress`: Unified progress tracking for lessons and quizzes
- Enhanced indexes for better query performance
- Updated constraints for data integrity

#### Migrated Data
- Lesson progress data migrated to unified table
- Quiz completion data migrated to unified table
- Progress calculations updated to use new schema

#### Deprecated Tables
- `lesson_progress`: Deprecated in favor of unified `content_progress` table
- Legacy progress tracking methods deprecated

### 🔒 Security

#### Enhanced Security
- **Data Protection**: Improved data protection and privacy measures
- **Access Control**: Enhanced access control and permission system
- **Audit Logging**: Better audit logging for security events
- **Input Validation**: Enhanced input validation and sanitization

### 📱 Mobile Improvements

#### Mobile Experience
- **Responsive Design**: Improved responsive design for all devices
- **Touch Interface**: Better touch interface for mobile devices
- **Performance**: Optimized performance for mobile browsers
- **Accessibility**: Enhanced accessibility for mobile users

### 🚀 Performance

#### System Performance
- **Database Performance**: Improved database query performance
- **API Performance**: Faster API response times
- **Frontend Performance**: Optimized frontend loading and rendering
- **Caching**: Enhanced caching strategies for better performance

## [1.5.0] - 2025-09-15

### ✨ Added
- User profile separation from users table
- Avatar upload functionality
- Enhanced user preferences system
- Improved user management interface

### 🔄 Changed
- User data structure for better organization
- Profile management workflow
- User interface for profile editing

### 🐛 Fixed
- Profile update issues
- Avatar upload problems
- User data synchronization

## [1.4.0] - 2025-08-15

### ✨ Added
- Quiz system with multiple question types
- Quiz attempt tracking and scoring
- Quiz management interface for instructors
- Basic quiz analytics

### 🔄 Changed
- Course structure to include quizzes
- Progress tracking to include quiz completion
- Module organization for lessons and quizzes

### 🐛 Fixed
- Course progress calculation
- Quiz submission issues
- Progress synchronization

## [1.3.0] - 2025-07-15

### ✨ Added
- Lesson creation and management
- Rich text editor for lesson content
- Lesson progress tracking
- Course module organization

### 🔄 Changed
- Course structure with modules and lessons
- Progress tracking system
- User interface for content creation

### 🐛 Fixed
- Content creation issues
- Progress tracking bugs
- User interface problems

## [1.2.0] - 2025-07-01

### ✨ Added
- Course creation and management
- Course enrollment system
- Basic progress tracking
- Course analytics

### 🔄 Changed
- User dashboard to include courses
- Navigation structure
- User interface layout

### 🐛 Fixed
- Course access issues
- Enrollment problems
- Progress calculation bugs

## [1.1.0] - 2025-06-15

### ✨ Added
- Multi-tenant system
- Tenant management interface
- User role management
- Basic course structure

### 🔄 Changed
- Authentication system for multi-tenancy
- User management for different roles
- Database schema for tenant isolation

### 🐛 Fixed
- Tenant isolation issues
- User permission problems
- Database constraint violations

## [1.0.0] - 2025-05-30

### ✨ Added
- Initial release of SunLMS (formerly UDrive LMS)
- User authentication system
- Basic user management
- Database schema
- Core application structure

### 🔄 Changed
- Initial system architecture
- Basic user interface
- Core functionality implementation

### 🐛 Fixed
- Initial bug fixes and stability improvements

---

## Version History Summary

| Version | Release Date | Major Features |
|---------|--------------|----------------|
| 2.4.0   | 2025-11-06   | Contact Messages System, Public Contact Form, Admin Message Management, Email Notifications |
| 2.3.0   | 2025-11-05   | Active role switcher, certificates UX (modals/notes), verification fixes, RBAC/tenant hardening |
| 2.2.0   | 2025-11-04   | SunLMS brand color system, white-label enhancements, system-wide styling updates |
| 2.1.0   | 2025-10-21   | Dual-Role Learning System, Universal Enrollment, Cross-Role Student Experience |
| 2.0.0   | 2025-10-18   | Unified Learning System, Enhanced Quiz Experience, Comprehensive Documentation |
| 1.5.0   | 2025-09-15   | User Profile Separation, Avatar Upload |
| 1.4.0   | 2025-08-15   | Quiz System, Quiz Management |
| 1.3.0   | 2025-07-15   | Lesson Creation, Rich Text Editor |
| 1.2.0   | 2025-07-01   | Course Management, Enrollment System |
| 1.1.0   | 2025-06-15   | Multi-tenant System, Role Management |
| 1.0.0   | 2025-05-30   | Initial Release (UDrive → SunLMS), Core System |

## Upgrade Notes

### Upgrading to Version 2.0.0

#### Database Migration Required
- Run the unified progress table migration
- Migrate existing lesson and quiz progress data
- Update application code to use new progress system

#### Breaking Changes
- Progress tracking API endpoints have changed
- Quiz completion flow has changed
- Some frontend components have been updated

#### New Features
- Unified progress tracking system
- Enhanced quiz experience
- Comprehensive documentation
- Improved mobile experience

### Upgrading from Version 1.x

#### Prerequisites
- PostgreSQL 15+ required
- Node.js 18+ required
- Updated dependencies

#### Migration Steps
1. Backup existing database
2. Run database migrations
3. Update application code
4. Test all functionality
5. Deploy to production

## Support

For upgrade assistance or technical support:
- Check the documentation in `/docs` folder
- Review the troubleshooting guide
- Contact the development team
- Submit issues on GitHub

---

*This changelog is maintained alongside the codebase and reflects all significant changes to SunLMS.*
