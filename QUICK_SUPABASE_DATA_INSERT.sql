-- =============================================
-- UDRIVE LMS - ESSENTIAL PRODUCTION DATA
-- Run this in Supabase SQL Editor
-- =============================================
-- This creates minimal data to get your app working
-- All passwords are: password123
-- =============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE lesson_progress, enrollments, lessons, modules, courses, users, tenants RESTART IDENTITY CASCADE;

-- =============================================
-- 1. INSERT TENANTS (Schools)
-- =============================================

INSERT INTO tenants (id, name, subdomain, settings, subscription_tier, subscription_status, is_active, contact_email) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Premier Driving Academy', 'premier', '{"theme": "blue"}', 'premium', 'active', true, 'info@premier.com'),
('36b2ae0d-c53c-47d7-9e80-71c933a1cc2a', 'Downtown Driving Academy', 'downtown', '{}', 'basic', 'active', true, 'info@downtown.com');

-- =============================================
-- 2. INSERT USERS (All passwords: password123)
-- =============================================

-- Password hash for "password123"
-- Generated with: bcrypt.hash('password123', 10)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active) VALUES

-- Super Admin (No tenant - manages everything)
('67e0428c-44fd-4fc8-b195-ffe33c2366bb', NULL, 'admin@udrivelms.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Super', 'Admin', 'super_admin', true),

-- Premier Academy Users
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'schooladmin@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Sarah', 'Johnson', 'school_admin', true),

('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'instructor@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'John', 'Smith', 'instructor', true),

('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'student1@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Michael', 'Chen', 'student', true),

('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'student2@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Emily', 'Rodriguez', 'student', true),

-- Downtown Academy Users
('ac5b9b0c-23b0-46dc-9a64-1aa2c24611a3', '36b2ae0d-c53c-47d7-9e80-71c933a1cc2a', 'admin@downtown.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Alex', 'Downtown', 'school_admin', true);

-- =============================================
-- 3. INSERT SAMPLE COURSE
-- =============================================

INSERT INTO courses (id, tenant_id, title, description, status, duration_weeks, price, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Basic Driving Course', 'Learn the fundamentals of safe driving including traffic laws, vehicle operation, and defensive driving techniques.', 'published', 6, 499.99, '660e8400-e29b-41d4-a716-446655440003');

-- =============================================
-- 4. INSERT SAMPLE MODULE
-- =============================================

INSERT INTO modules (id, course_id, title, description, order_index, estimated_duration_minutes) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Introduction to vehicle controls and basic operations', 1, 120);

-- =============================================
-- 5. INSERT SAMPLE LESSONS
-- =============================================

INSERT INTO lessons (id, module_id, title, description, content, order_index, estimated_duration_minutes, status, lesson_type) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Vehicle Controls', 'Understanding all vehicle controls and their functions', '[]', 1, 30, 'published', 'text'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Safety Check', 'Pre-driving safety inspection procedures', '[]', 2, 20, 'published', 'text');

-- =============================================
-- 6. INSERT SAMPLE ENROLLMENT
-- =============================================

INSERT INTO enrollments (id, student_id, course_id, status, progress_percentage) VALUES
('e6a30b4d-c163-482d-8497-6d7881fc4e94', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'active', 0);

-- =============================================
-- 7. VERIFY DATA INSERTED
-- =============================================

DO $$
DECLARE
    tenant_count INTEGER;
    user_count INTEGER;
    course_count INTEGER;
    module_count INTEGER;
    lesson_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO module_count FROM modules;
    SELECT COUNT(*) INTO lesson_count FROM lessons;
    
    RAISE NOTICE '✅ DATA INSERTED SUCCESSFULLY!';
    RAISE NOTICE 'Tenants: %', tenant_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Courses: %', course_count;
    RAISE NOTICE 'Modules: %', module_count;
    RAISE NOTICE 'Lessons: %', lesson_count;
    RAISE NOTICE '';
    RAISE NOTICE '📧 TEST CREDENTIALS (password: password123):';
    RAISE NOTICE '   Super Admin: admin@udrivelms.com';
    RAISE NOTICE '   School Admin: schooladmin@premier.com';
    RAISE NOTICE '   Instructor: instructor@premier.com';
    RAISE NOTICE '   Student: student1@premier.com';
END $$;

