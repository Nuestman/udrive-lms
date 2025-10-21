# Database Schema Documentation

## Overview

The SunLMS database is built on PostgreSQL with a normalized relational design that supports multi-tenancy, comprehensive progress tracking, and scalable content management. The schema is designed for performance, data integrity, and flexibility to serve various industries and use cases.

## Database Design Principles

### Multi-Tenancy
- **Tenant Isolation**: All data is isolated by `tenant_id`
- **Row-Level Security**: Automatic tenant filtering
- **Data Separation**: Complete isolation between organizations

### Data Integrity
- **Foreign Key Constraints**: Referential integrity enforcement
- **Check Constraints**: Data validation at database level
- **Unique Constraints**: Prevent duplicate data
- **NOT NULL Constraints**: Required field enforcement

### Performance Optimization
- **Strategic Indexing**: Optimized indexes for common queries
- **UUID Primary Keys**: Globally unique identifiers
- **JSONB Support**: Flexible JSON data storage
- **Efficient Joins**: Optimized table relationships

## Core Tables

### 1. Tenants
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Represents organizations/schools using the system
**Key Features**: Domain-based identification, customizable settings, logo support

### 2. Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'instructor', 'student')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: User accounts with role-based access control
**Key Features**: Multi-role support, tenant isolation, email verification

### 3. User Profiles
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Extended user information and preferences
**Key Features**: Flexible profile data, avatar support, JSON preferences

### 4. Courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Course containers with tenant isolation
**Key Features**: Status management, thumbnail support, tenant isolation

### 5. Modules
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Course organization units containing lessons and quizzes
**Key Features**: Ordering system, publication control, course hierarchy

### 6. Lessons
```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    estimated_duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Learning content with rich text support
**Key Features**: Rich content storage, duration estimation, ordering

### 7. Quizzes
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 0,
    passing_score INTEGER DEFAULT 70,
    show_feedback VARCHAR(20) DEFAULT 'after_completion' CHECK (show_feedback IN ('never', 'after_completion', 'immediately')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Assessment content with configurable settings
**Key Features**: Time limits, attempt limits, passing scores, feedback control

### 8. Quiz Questions
```sql
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Individual quiz questions with flexible options
**Key Features**: Multiple question types, JSON options, explanations

### 9. Quiz Attempts
```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    score INTEGER,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Student quiz attempts and results
**Key Features**: JSON answer storage, score tracking, time tracking

## Progress Tracking Tables

### 10. Content Progress (Unified)
```sql
CREATE TABLE content_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL, -- Can be lesson_id or quiz_id
    content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT, -- For tracking position in lesson or quiz
    UNIQUE(student_id, content_id)
);
```

**Purpose**: Unified progress tracking for lessons and quizzes
**Key Features**: Content-agnostic design, time tracking, position tracking

### 11. Enrollments
```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, course_id)
);
```

**Purpose**: Student course enrollments with progress tracking
**Key Features**: Progress percentage, status tracking, completion dates

## Legacy Tables (Deprecated)

### 12. Lesson Progress (Legacy)
```sql
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lesson_id, student_id)
);
```

**Status**: Deprecated - Use `content_progress` instead
**Migration**: Data migrated to `content_progress` table

## Indexes

### Performance Indexes
```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- Course indexes
CREATE INDEX idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX idx_courses_status ON courses(status);

-- Module indexes
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- Lesson indexes
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);

-- Quiz indexes
CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);

-- Progress indexes
CREATE INDEX idx_content_progress_student_id ON content_progress(student_id);
CREATE INDEX idx_content_progress_content_id ON content_progress(content_id);
CREATE INDEX idx_content_progress_content_type ON content_progress(content_type);
CREATE INDEX idx_content_progress_status ON content_progress(status);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Quiz attempt indexes
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
```

## Relationships

### Entity Relationship Diagram
```
Tenants (1) ──→ (N) Users
Users (1) ──→ (1) User Profiles
Users (1) ──→ (N) Enrollments
Users (1) ──→ (N) Content Progress
Users (1) ──→ (N) Quiz Attempts

Tenants (1) ──→ (N) Courses
Courses (1) ──→ (N) Modules
Modules (1) ──→ (N) Lessons
Modules (1) ──→ (N) Quizzes
Quizzes (1) ──→ (N) Quiz Questions

Courses (1) ──→ (N) Enrollments
```

### Key Relationships
- **Tenant → Users**: One tenant has many users
- **User → Profile**: One user has one profile
- **Course → Modules**: One course has many modules
- **Module → Lessons/Quizzes**: One module has many lessons and quizzes
- **User → Progress**: One user has progress for many content items
- **User → Enrollments**: One user can enroll in many courses

## Data Types

### UUID Usage
- **Primary Keys**: All tables use UUID primary keys
- **Foreign Keys**: All foreign keys are UUIDs
- **Benefits**: Globally unique, no collision risk, distributed system friendly

### JSONB Usage
- **User Preferences**: Flexible user settings storage
- **Quiz Options**: Dynamic question options
- **Quiz Answers**: Flexible answer storage
- **Tenant Settings**: Configurable tenant settings

### Timestamp Usage
- **Created/Updated**: Automatic timestamp tracking
- **Completion Times**: Progress completion tracking
- **Login Times**: User activity tracking

## Constraints

### Check Constraints
```sql
-- User roles
CHECK (role IN ('super_admin', 'tenant_admin', 'instructor', 'student'))

-- Content types
CHECK (content_type IN ('lesson', 'quiz'))

-- Progress status
CHECK (status IN ('not_started', 'in_progress', 'completed'))

-- Course status
CHECK (status IN ('draft', 'published', 'archived'))

-- Quiz feedback
CHECK (show_feedback IN ('never', 'after_completion', 'immediately'))
```

### Unique Constraints
```sql
-- Prevent duplicate enrollments
UNIQUE(student_id, course_id)

-- Prevent duplicate progress
UNIQUE(student_id, content_id)

-- Unique email addresses
UNIQUE(email)

-- Unique tenant domains
UNIQUE(domain)
```

## Migration History

### Version 1.0 - Initial Schema
- Basic user and course structure
- Simple progress tracking
- Multi-tenant support

### Version 2.0 - Unified Progress System
- Added `content_progress` table
- Unified lesson and quiz progress
- Enhanced progress tracking

### Version 3.0 - Enhanced Features
- User profiles separation
- Quiz system improvements
- Performance optimizations

## Performance Considerations

### Query Optimization
- **Indexed Queries**: All common queries use indexes
- **Efficient Joins**: Optimized table relationships
- **Pagination**: Large result sets are paginated
- **Caching**: Strategic query result caching

### Data Volume Management
- **Archiving**: Old data archiving strategy
- **Partitioning**: Large table partitioning (future)
- **Cleanup**: Automated data cleanup processes
- **Backup**: Regular backup and recovery procedures

## Security Considerations

### Data Protection
- **Tenant Isolation**: Automatic tenant filtering
- **Access Control**: Role-based data access
- **Audit Logging**: Data change tracking
- **Encryption**: Sensitive data encryption

### Backup and Recovery
- **Regular Backups**: Automated daily backups
- **Point-in-Time Recovery**: Transaction log backups
- **Disaster Recovery**: Cross-region backup replication
- **Testing**: Regular backup restoration testing

## Implementation Status

### ✅ Fully Implemented
- Core user and tenant tables
- Course and module structure
- Lesson and quiz tables
- Unified progress tracking
- User profiles
- Quiz system

### 🚧 Partially Implemented
- Advanced indexing (basic indexes in place)
- Performance monitoring (manual only)
- Automated backups (manual process)
- Data archiving (not implemented)

### 📋 Planned
- Advanced analytics tables
- Audit logging tables
- Performance monitoring tables
- Data warehouse tables
- Real-time features tables

---

*This database schema documentation is maintained alongside the codebase and reflects the current database design as of October 2025.*
