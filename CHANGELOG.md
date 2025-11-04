# Changelog

All notable changes to SunLMS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
