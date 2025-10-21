# Migration Guide

## Overview

This guide covers database migrations, system updates, and data migration procedures for SunLMS. It includes both automated and manual migration processes for the generic LMS/CMS-as-a-Service platform.

## Migration Types

### 1. Database Schema Migrations
- Table structure changes
- Index modifications
- Constraint updates
- Data type changes

### 2. Data Migrations
- Data transformation
- Data cleanup
- Data consolidation
- Legacy system integration

### 3. System Migrations
- Version upgrades
- Platform migrations
- Service migrations
- Configuration updates

## Database Migration Process

### Migration File Structure
```
database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_user_profiles.sql
│   ├── 003_unified_progress_system.sql
│   └── 004_quiz_enhancements.sql
├── schema.sql
├── rollback/
│   ├── 001_rollback_initial_schema.sql
│   └── 002_rollback_user_profiles.sql
└── seeds/
    ├── development.sql
    └── production.sql
```

### Migration Naming Convention
```
YYYY-MM-DD_HHMM_description.sql
```

Examples:
- `2024-12-01_1430_add_content_progress_table.sql`
- `2024-12-01_1500_migrate_lesson_progress_data.sql`

## Current Migration History

### Version 1.0 - Initial Schema
**File**: `001_initial_schema.sql`
**Date**: 2025-05-30
**Changes**:
- Created basic user and tenant tables
- Set up course and module structure
- Basic progress tracking with `lesson_progress` table

### Version 2.0 - User Profile Separation
**File**: `002_user_profiles_migration.sql`
**Date**: 2025-09-15
**Changes**:
- Separated user profiles from users table
- Added avatar support
- Enhanced user preferences

### Version 3.0 - Unified Progress System
**File**: `003_unified_progress_system.sql`
**Date**: 2025-10-18
**Changes**:
- Created `content_progress` table
- Unified lesson and quiz progress tracking
- Migrated existing progress data

## Migration Procedures

### 1. Creating a New Migration

#### Step 1: Create Migration File
```bash
# Create migration file
touch database/migrations/$(date +%Y-%m-%d_%H%M)_description.sql

# Example
touch database/migrations/2024-12-01_1430_add_quiz_analytics.sql
```

#### Step 2: Write Migration SQL
```sql
-- Migration: Add Quiz Analytics
-- Date: 2025-10-18
-- Author: Development Team
-- Description: Add analytics tracking for quiz performance

-- Create quiz_analytics table
CREATE TABLE quiz_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_correctly BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_quiz_analytics_quiz_id ON quiz_analytics(quiz_id);
CREATE INDEX idx_quiz_analytics_student_id ON quiz_analytics(student_id);
CREATE INDEX idx_quiz_analytics_created_at ON quiz_analytics(created_at);

-- Add comment
COMMENT ON TABLE quiz_analytics IS 'Detailed analytics for quiz performance tracking';
```

#### Step 3: Create Rollback File
```sql
-- Rollback: Add Quiz Analytics
-- Date: 2025-10-18
-- Description: Remove quiz analytics table

-- Drop indexes
DROP INDEX IF EXISTS idx_quiz_analytics_created_at;
DROP INDEX IF EXISTS idx_quiz_analytics_student_id;
DROP INDEX IF EXISTS idx_quiz_analytics_quiz_id;

-- Drop table
DROP TABLE IF EXISTS quiz_analytics;
```

### 2. Running Migrations

#### Development Environment
```bash
# Run all pending migrations
for file in database/migrations/*.sql; do
  echo "Running migration: $file"
  psql -U udrive_user -d udrive_lms -f "$file"
done

# Or run specific migration
psql -U udrive_user -d udrive_lms -f database/migrations/2024-12-01_1430_add_quiz_analytics.sql
```

#### Production Environment
```bash
# Backup database first
pg_dump -U postgres -d udrive_lms > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql -U postgres -d udrive_lms -f database/migrations/2024-12-01_1430_add_quiz_analytics.sql

# Verify migration
psql -U postgres -d udrive_lms -c "\dt quiz_analytics"
```

#### Supabase Environment
```bash
# Using Supabase CLI
supabase db push

# Or direct SQL execution
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f database/migrations/2024-12-01_1430_add_quiz_analytics.sql
```

### 3. Data Migration Examples

#### Migrating Lesson Progress to Unified System
```sql
-- Migration: Migrate lesson progress to content_progress
-- Date: 2025-10-18
-- Description: Move lesson progress data to unified content_progress table

-- Insert lesson progress data into content_progress
INSERT INTO content_progress (
    student_id, 
    content_id, 
    content_type, 
    status, 
    started_at, 
    completed_at, 
    time_spent_seconds
)
SELECT 
    student_id,
    lesson_id,
    'lesson',
    status,
    started_at,
    completed_at,
    time_spent_seconds
FROM lesson_progress
WHERE NOT EXISTS (
    SELECT 1 FROM content_progress 
    WHERE content_progress.student_id = lesson_progress.student_id 
    AND content_progress.content_id = lesson_progress.lesson_id
);

-- Verify migration
SELECT 
    'lesson_progress' as source_table,
    COUNT(*) as record_count
FROM lesson_progress
UNION ALL
SELECT 
    'content_progress (lessons)' as source_table,
    COUNT(*) as record_count
FROM content_progress 
WHERE content_type = 'lesson';
```

#### Migrating Quiz Completion Data
```sql
-- Migration: Migrate quiz completion to content_progress
-- Date: 2025-10-18
-- Description: Move quiz completion data to unified content_progress table

-- Insert quiz completion data into content_progress
INSERT INTO content_progress (
    student_id, 
    content_id, 
    content_type, 
    status, 
    completed_at
)
SELECT DISTINCT
    qa.student_id,
    qa.quiz_id,
    'quiz',
    'completed',
    qa.completed_at
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.score >= q.passing_score
AND NOT EXISTS (
    SELECT 1 FROM content_progress 
    WHERE content_progress.student_id = qa.student_id 
    AND content_progress.content_id = qa.quiz_id
);

-- Verify migration
SELECT 
    'quiz_attempts (passed)' as source_table,
    COUNT(DISTINCT CONCAT(student_id, '-', quiz_id)) as unique_completions
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.score >= q.passing_score
UNION ALL
SELECT 
    'content_progress (quizzes)' as source_table,
    COUNT(*) as record_count
FROM content_progress 
WHERE content_type = 'quiz';
```

## Migration Best Practices

### 1. Pre-Migration Checklist
- [ ] Backup database
- [ ] Test migration on development environment
- [ ] Review migration SQL for syntax errors
- [ ] Check for data dependencies
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window (if needed)

### 2. Migration Execution
- [ ] Run migration during low-traffic period
- [ ] Monitor database performance during migration
- [ ] Verify data integrity after migration
- [ ] Update application code if needed
- [ ] Test application functionality
- [ ] Document any issues or changes

### 3. Post-Migration Validation
- [ ] Verify all data migrated correctly
- [ ] Check application functionality
- [ ] Monitor system performance
- [ ] Update documentation
- [ ] Clean up old tables (if applicable)
- [ ] Archive migration files

## Rollback Procedures

### 1. Database Rollback
```bash
# Restore from backup
psql -U postgres -d udrive_lms < backup_20241201_143000.sql

# Or run rollback migration
psql -U postgres -d udrive_lms -f database/rollback/2024-12-01_1430_rollback_quiz_analytics.sql
```

### 2. Application Rollback
```bash
# Revert to previous version
git checkout previous-version-tag

# Redeploy application
vercel --prod
```

### 3. Data Rollback
```sql
-- Example: Rollback content_progress migration
-- Remove migrated data
DELETE FROM content_progress WHERE content_type = 'lesson';

-- Restore from lesson_progress (if still exists)
INSERT INTO content_progress (
    student_id, content_id, content_type, status, 
    started_at, completed_at, time_spent_seconds
)
SELECT 
    student_id, lesson_id, 'lesson', status,
    started_at, completed_at, time_spent_seconds
FROM lesson_progress;
```

## Version-Specific Migrations

### Migration to Version 2.0.0 (Unified System)

#### Overview
This migration implements the unified progress tracking system where lessons and quizzes are treated equally.

#### Steps
1. **Create content_progress table**
2. **Migrate lesson progress data**
3. **Migrate quiz completion data**
4. **Update application code**
5. **Test unified system**
6. **Clean up legacy tables** (optional)

#### Migration Script
```sql
-- Step 1: Create unified progress table
\i database/create_unified_progress_table.sql

-- Step 2: Migrate lesson progress
INSERT INTO content_progress (student_id, content_id, content_type, status, started_at, completed_at, time_spent_seconds)
SELECT student_id, lesson_id, 'lesson', status, started_at, completed_at, time_spent_seconds
FROM lesson_progress;

-- Step 3: Migrate quiz completion
INSERT INTO content_progress (student_id, content_id, content_type, status, completed_at)
SELECT DISTINCT qa.student_id, qa.quiz_id, 'quiz', 'completed', qa.completed_at
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.score >= q.passing_score;

-- Step 4: Verify migration
SELECT 
    content_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_records
FROM content_progress
GROUP BY content_type;
```

## Automated Migration Tools

### 1. Migration Script
```bash
#!/bin/bash
# migrate.sh - Automated migration script

set -e

DB_URL=${DATABASE_URL:-"postgresql://udrive_user:password@localhost:5432/udrive_lms"}
MIGRATION_DIR="database/migrations"

echo "Starting migration process..."

# Backup database
echo "Creating backup..."
pg_dump "$DB_URL" > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Run migrations
echo "Running migrations..."
for file in "$MIGRATION_DIR"/*.sql; do
    if [ -f "$file" ]; then
        echo "Running: $file"
        psql "$DB_URL" -f "$file"
    fi
done

echo "Migration completed successfully!"
```

### 2. Migration Validation
```bash
#!/bin/bash
# validate_migration.sh - Validate migration results

DB_URL=${DATABASE_URL:-"postgresql://udrive_user:password@localhost:5432/udrive_lms"}

echo "Validating migration..."

# Check table existence
psql "$DB_URL" -c "\dt content_progress"

# Check data counts
psql "$DB_URL" -c "
SELECT 
    content_type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM content_progress 
GROUP BY content_type;
"

# Check for orphaned records
psql "$DB_URL" -c "
SELECT 'Orphaned lesson progress' as check_type, COUNT(*) as count
FROM content_progress cp
LEFT JOIN lessons l ON cp.content_id = l.id
WHERE cp.content_type = 'lesson' AND l.id IS NULL
UNION ALL
SELECT 'Orphaned quiz progress' as check_type, COUNT(*) as count
FROM content_progress cp
LEFT JOIN quizzes q ON cp.content_id = q.id
WHERE cp.content_type = 'quiz' AND q.id IS NULL;
"

echo "Validation completed!"
```

## Troubleshooting

### Common Migration Issues

#### 1. Foreign Key Constraint Violations
```sql
-- Check for constraint violations
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

#### 2. Data Type Mismatches
```sql
-- Check data types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'content_progress'
ORDER BY ordinal_position;
```

#### 3. Index Conflicts
```sql
-- Check for index conflicts
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'content_progress';
```

### Recovery Procedures

#### 1. Partial Migration Recovery
```sql
-- If migration partially failed, clean up and retry
DELETE FROM content_progress WHERE created_at > '2024-12-01 14:30:00';

-- Retry migration
\i database/migrations/2024-12-01_1430_unified_progress_migration.sql
```

#### 2. Complete Rollback
```bash
# Restore from backup
psql -U postgres -d udrive_lms < backup_20241201_143000.sql

# Verify restoration
psql -U postgres -d udrive_lms -c "\dt"
```

## Implementation Status

### ✅ Fully Implemented
- Database schema migrations
- Data migration procedures
- Rollback procedures
- Migration validation
- Documentation

### 🚧 Partially Implemented
- Automated migration tools (basic scripts)
- Migration testing framework (manual testing)
- Performance monitoring during migrations

### 📋 Planned
- Automated migration testing
- Migration performance optimization
- Advanced rollback procedures
- Migration monitoring dashboard
- Zero-downtime migrations

---

*This migration guide is maintained alongside the codebase and reflects the current migration procedures as of October 2025.*
