-- =====================================================
-- RESTORE FOREIGN KEYS AFTER MIGRATION
-- =====================================================
-- These foreign keys were dropped when we dropped the old user_profiles table
-- Now we recreate them pointing to the correct table: users.id
-- =====================================================

BEGIN;

-- Courses: created_by should reference users
ALTER TABLE courses 
ADD CONSTRAINT courses_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Enrollments: student_id should reference users
ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Lesson Progress: student_id should reference users
ALTER TABLE lesson_progress 
ADD CONSTRAINT lesson_progress_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Goals: student_id should reference users
ALTER TABLE goals 
ADD CONSTRAINT goals_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Quiz Attempts: student_id should reference users
ALTER TABLE quiz_attempts 
ADD CONSTRAINT quiz_attempts_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Certificates: student_id should reference users
ALTER TABLE certificates 
ADD CONSTRAINT certificates_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Assignment Submissions: student_id and graded_by should reference users
ALTER TABLE assignment_submissions 
ADD CONSTRAINT assignment_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE assignment_submissions 
ADD CONSTRAINT assignment_submissions_graded_by_fkey 
FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Media Files: uploaded_by should reference users
ALTER TABLE media_files 
ADD CONSTRAINT media_files_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Notifications: user_id should reference users
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Audit Log: user_id should reference users
ALTER TABLE audit_log 
ADD CONSTRAINT audit_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that all foreign keys are restored
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
ORDER BY tc.table_name, tc.constraint_name;

