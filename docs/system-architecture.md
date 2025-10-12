# UDrive System Architecture

## Overview

UDrive is a multi-tenant Learning Management System (LMS) and Content Management System (CMS) designed specifically for driving schools. The platform enables driving schools to create, manage, and deliver educational content to their students while tracking progress and generating insights.

## Multi-Tenant Architecture

The system employs a multi-tenant architecture where each driving school represents a tenant with isolated data but shares the same application infrastructure.

### Tenant Isolation Approach

We'll use a hybrid approach:
- Shared database with tenant discriminator columns
- Tenant-specific storage buckets for media content
- Row-level security enforced at the application layer

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  UDrive Platform                │
│                                                 │
└───────────────┬─────────────────┬───────────────┘
                │                 │
    ┌───────────▼──────────┐     ┌▼──────────────────────┐
    │                      │     │                       │
    │  Shared Application  │     │   Shared Database     │
    │                      │     │                       │
    └──────────┬───────────┘     └───────────┬───────────┘
               │                             │
               │                             │
┌──────────────▼─────────────────────────────▼──────────────┐
│                                                            │
│                      Tenant Isolation                      │
│                                                            │
├────────────────┬────────────────┬────────────────┬────────┤
│                │                │                │        │
│   Tenant A     │    Tenant B    │    Tenant C    │   ...  │
│                │                │                │        │
└────────────────┴────────────────┴────────────────┴────────┘
```

## Database Schema

### Core Tables

#### Tenants
```
tenants
├── id (PK)
├── name
├── subdomain
├── created_at
├── updated_at
├── settings (JSON)
├── subscription_tier
├── subscription_status
└── branding (JSON)
```

#### Users
```
users
├── id (PK)
├── tenant_id (FK)
├── email
├── password_hash
├── first_name
├── last_name
├── role (enum: super_admin, school_admin, instructor, student)
├── created_at
├── updated_at
├── last_login
├── profile_image_url
└── settings (JSON)
```

#### Courses
```
courses
├── id (PK)
├── tenant_id (FK)
├── title
├── description
├── status (draft, published, archived)
├── created_at
├── updated_at
├── created_by (FK: users.id)
├── thumbnail_url
├── duration_minutes
└── settings (JSON)
```

#### Modules
```
modules
├── id (PK)
├── course_id (FK)
├── title
├── description
├── order_index
├── status (draft, published, archived)
├── created_at
├── updated_at
└── settings (JSON)
```

#### Lessons
```
lessons
├── id (PK)
├── module_id (FK)
├── title
├── description
├── content (JSON - stores block editor content)
├── order_index
├── duration_minutes
├── status (draft, published, archived)
├── created_at
└── updated_at
```

#### Quizzes
```
quizzes
├── id (PK)
├── module_id (FK)
├── title
├── description
├── passing_score
├── time_limit_minutes
├── status (draft, published, archived)
├── created_at
└── updated_at
```

#### Quiz Questions
```
quiz_questions
├── id (PK)
├── quiz_id (FK)
├── question_type (multiple_choice, true_false, short_answer)
├── question_text
├── options (JSON)
├── correct_answer
├── points
├── order_index
├── created_at
└── updated_at
```

#### Enrollments
```
enrollments
├── id (PK)
├── user_id (FK)
├── course_id (FK)
├── status (enrolled, completed, suspended)
├── enrolled_at
├── completed_at
├── last_accessed_at
└── progress_percentage
```

#### Progress Tracking
```
progress_records
├── id (PK)
├── user_id (FK)
├── lesson_id (FK)
├── status (not_started, in_progress, completed)
├── started_at
├── completed_at
├── time_spent_seconds
└── last_position
```

#### Quiz Attempts
```
quiz_attempts
├── id (PK)
├── user_id (FK)
├── quiz_id (FK)
├── status (in_progress, completed)
├── score
├── started_at
├── completed_at
├── time_spent_seconds
└── answers (JSON)
```

#### Certificates
```
certificates
├── id (PK)
├── user_id (FK)
├── course_id (FK)
├── certificate_template_id (FK)
├── issued_at
├── expires_at
├── certificate_number
├── verification_code
├── status (active, expired, revoked)
└── pdf_url
```

## Authentication & Authorization

### Authentication
- JWT-based authentication
- OAuth integration for social login
- Password hashing with bcrypt
- Password reset functionality
- 2FA for administrative accounts

### Authorization
Role-based access control with the following roles:

#### Super Admin
- Platform-wide administration
- Tenant management
- System settings

#### School Admin
- School-level administration
- User management within their tenant
- Content and curriculum management
- Analytics access

#### Instructor
- Content creation and management
- Student progress monitoring
- Assessment grading
- Limited analytics access

#### Student
- Course access
- Quiz taking
- Progress tracking
- Certificate access

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

### Tenants
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/:id`
- `PUT /api/tenants/:id`
- `DELETE /api/tenants/:id`

### Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/users/:id/progress`

### Courses
- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/:id`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`
- `GET /api/courses/:id/modules`
- `POST /api/courses/:id/modules`

### Modules
- `GET /api/modules/:id`
- `PUT /api/modules/:id`
- `DELETE /api/modules/:id`
- `GET /api/modules/:id/lessons`
- `POST /api/modules/:id/lessons`
- `GET /api/modules/:id/quizzes`
- `POST /api/modules/:id/quizzes`

### Lessons
- `GET /api/lessons/:id`
- `PUT /api/lessons/:id`
- `DELETE /api/lessons/:id`
- `POST /api/lessons/:id/progress`

### Quizzes
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`
- `DELETE /api/quizzes/:id`
- `POST /api/quizzes/:id/attempt`
- `GET /api/quizzes/:id/attempts`
- `GET /api/quizzes/:id/attempts/:attemptId`

### Enrollments
- `GET /api/enrollments`
- `POST /api/enrollments`
- `GET /api/enrollments/:id`
- `PUT /api/enrollments/:id`
- `DELETE /api/enrollments/:id`

### Certificates
- `GET /api/certificates`
- `POST /api/certificates`
- `GET /api/certificates/:id`
- `GET /api/certificates/:id/verify`
- `GET /api/certificates/:id/download`

### Analytics
- `GET /api/analytics/school/:tenantId/dashboard`
- `GET /api/analytics/school/:tenantId/students`
- `GET /api/analytics/school/:tenantId/courses`
- `GET /api/analytics/platform/dashboard`
- `GET /api/analytics/platform/tenants`
- `GET /api/analytics/platform/users`

## Data Flow

1. **Authentication Flow**
   - User submits credentials
   - System validates credentials and issues JWT
   - Token is stored in secure HTTP-only cookie
   - Subsequent requests include token for authorization

2. **Content Creation Flow**
   - Instructor creates/edits content using block editor
   - Content is saved as JSON structure
   - Media is uploaded to tenant-specific storage bucket
   - Content is versioned for audit trail

3. **Learning Flow**
   - Student enrolls in course
   - System tracks progress as student navigates content
   - Quiz attempts are recorded with answers and scores
   - Certificates are generated upon course completion

4. **Analytics Flow**
   - User activity and progress data is collected
   - Data is processed and aggregated
   - Insights are generated and displayed in dashboards
   - Reports can be exported for offline analysis

## Security Measures

- Data encryption at rest and in transit
- Input validation and sanitization
- Protection against common vulnerabilities (XSS, CSRF, SQL Injection)
- Rate limiting to prevent abuse
- Regular security audits and penetration testing
- Compliance with relevant education and data protection regulations