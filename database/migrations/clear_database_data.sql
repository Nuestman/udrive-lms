-- =============================================
-- UDrive LMS - Clear All Data Script
-- This script removes ALL data while preserving the schema
-- =============================================

-- WARNING: This will delete ALL data from the database!
-- Make sure you have a backup if needed.

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all data from tables in reverse dependency order
-- (child tables first, then parent tables)

-- Clear data from tables with foreign keys first
TRUNCATE TABLE public.assignment_submissions CASCADE;
TRUNCATE TABLE public.assignments CASCADE;
TRUNCATE TABLE public.audit_log CASCADE;
TRUNCATE TABLE public.certificates CASCADE;
TRUNCATE TABLE public.quiz_attempts CASCADE;
TRUNCATE TABLE public.quiz_questions CASCADE;
TRUNCATE TABLE public.quizzes CASCADE;
TRUNCATE TABLE public.lesson_progress CASCADE;
TRUNCATE TABLE public.lessons CASCADE;
TRUNCATE TABLE public.modules CASCADE;
TRUNCATE TABLE public.enrollments CASCADE;
TRUNCATE TABLE public.goals CASCADE;
TRUNCATE TABLE public.courses CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.media_files CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.tenants CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences for any auto-incrementing fields (if any exist)
-- Note: UUIDs are used as primary keys, so no sequences to reset

-- Verify all tables are empty
SELECT 'Tenants' as table_name, COUNT(*) as row_count FROM public.tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Courses', COUNT(*) FROM public.courses
UNION ALL
SELECT 'Modules', COUNT(*) FROM public.modules
UNION ALL
SELECT 'Lessons', COUNT(*) FROM public.lessons
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM public.enrollments
UNION ALL
SELECT 'Lesson Progress', COUNT(*) FROM public.lesson_progress
UNION ALL
SELECT 'Quizzes', COUNT(*) FROM public.quizzes
UNION ALL
SELECT 'Quiz Questions', COUNT(*) FROM public.quiz_questions
UNION ALL
SELECT 'Quiz Attempts', COUNT(*) FROM public.quiz_attempts
UNION ALL
SELECT 'Notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'Certificates', COUNT(*) FROM public.certificates
UNION ALL
SELECT 'Assignments', COUNT(*) FROM public.assignments
UNION ALL
SELECT 'Assignment Submissions', COUNT(*) FROM public.assignment_submissions
UNION ALL
SELECT 'Goals', COUNT(*) FROM public.goals
UNION ALL
SELECT 'Media Files', COUNT(*) FROM public.media_files
UNION ALL
SELECT 'Audit Log', COUNT(*) FROM public.audit_log;

-- Success message
SELECT 'Database cleared successfully! All tables are now empty and ready for fresh data.' as status;
