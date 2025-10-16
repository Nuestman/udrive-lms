-- Seed Data for UDrive LMS
-- This creates test data for development

-- =============================================
-- CREATE TEST TENANT
-- =============================================
INSERT INTO tenants (id, name, subdomain, settings, subscription_tier, subscription_status)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Premier Driving Academy', 'premier', '{"theme": "blue", "logo_url": ""}', 'premium', 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE TEST USERS
-- Password for all test users: 'password123'
-- Hash generated with bcrypt (10 rounds)
-- =============================================

-- Super Admin
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 
     'admin@udrive.com', '$2a$10$YourBcryptHashHere', 'Admin', 'User', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- School Admin
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 
     'schooladmin@premier.com', '$2a$10$YourBcryptHashHere', 'Sarah', 'Johnson', 'school_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Instructor
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, phone)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 
     'instructor@premier.com', '$2a$10$YourBcryptHashHere', 'John', 'Smith', 'instructor', true, '+1234567890')
ON CONFLICT (email) DO NOTHING;

-- Students
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 
     'student1@example.com', '$2a$10$YourBcryptHashHere', 'Michael', 'Chen', 'student', true),
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 
     'student2@example.com', '$2a$10$YourBcryptHashHere', 'Emily', 'Rodriguez', 'student', true),
    ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 
     'student3@example.com', '$2a$10$YourBcryptHashHere', 'David', 'Kim', 'student', true)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- CREATE TEST COURSES
-- =============================================
INSERT INTO courses (id, tenant_id, title, description, status, duration_weeks, price, created_by)
VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000',
     'Basic Driving Course', 
     'Learn the fundamentals of safe driving including traffic laws, vehicle operation, and defensive driving techniques.',
     'published', 6, 499.99, '660e8400-e29b-41d4-a716-446655440003'),
    
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000',
     'Advanced Defensive Driving',
     'Master advanced driving techniques for handling challenging road conditions and emergency situations.',
     'published', 4, 699.99, '660e8400-e29b-41d4-a716-446655440003'),
    
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000',
     'Traffic Laws Review',
     'Comprehensive review of state traffic laws and regulations for license renewal or knowledge refresh.',
     'published', 2, 199.99, '660e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE MODULES
-- =============================================
INSERT INTO modules (id, course_id, title, description, order_index, estimated_duration_minutes)
VALUES 
    -- Basic Driving Course Modules
    ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001',
     'Getting Started', 'Introduction to vehicle controls and basic operations', 1, 120),
    ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001',
     'Basic Maneuvers', 'Learn essential driving maneuvers including parking and turns', 2, 180),
    ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001',
     'Traffic Navigation', 'Understanding and navigating various traffic situations', 3, 150),
    
    -- Advanced Defensive Driving Modules
    ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002',
     'Hazard Recognition', 'Identifying and responding to potential hazards', 1, 90),
    ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002',
     'Emergency Procedures', 'Handling emergency situations safely', 2, 120)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE LESSONS
-- =============================================
INSERT INTO lessons (id, module_id, title, description, content, order_index, duration_minutes, status)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001',
     'Vehicle Controls', 'Understanding all vehicle controls and their functions', 
     '[{"id": "block-1", "type": "text", "content": {"text": "Welcome to your first lesson on vehicle controls!"}}]',
     1, 30, 'published'),
    
    ('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001',
     'Safety Check', 'Pre-driving safety inspection procedures',
     '[{"id": "block-2", "type": "text", "content": {"text": "Always perform a safety check before driving."}}]',
     2, 20, 'published'),
    
    ('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002',
     'Parking Techniques', 'Master parallel and perpendicular parking',
     '[{"id": "block-3", "type": "text", "content": {"text": "Parking is an essential skill for every driver."}}]',
     1, 45, 'published')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE QUIZZES
-- =============================================
INSERT INTO quizzes (id, module_id, title, description, passing_score, time_limit_minutes, status)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001',
     'Getting Started Quiz', 'Test your knowledge of vehicle controls and basic operations', 70, 10, 'published')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE QUIZ QUESTIONS
-- =============================================
INSERT INTO quiz_questions (quiz_id, question_type, question_text, options, correct_answer, points, explanation, order_index)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440001', 'multiple_choice',
     'What should you do when approaching a yellow traffic light?',
     '["Speed up to get through", "Prepare to stop if it is safe to do so", "Always stop immediately", "Ignore it if no other cars are present"]'::jsonb,
     '"Prepare to stop if it is safe to do so"'::jsonb,
     10, 'A yellow light indicates that the signal is about to turn red. You should prepare to stop if you can do so safely.', 1),
    
    ('aa0e8400-e29b-41d4-a716-446655440001', 'true_false',
     'In most states, it is legal to turn right on a red light after coming to a complete stop, unless otherwise posted.',
     'null'::jsonb,
     'true'::jsonb,
     5, 'Right turns on red are generally permitted after a complete stop, unless a sign prohibits it.', 2),
    
    ('aa0e8400-e29b-41d4-a716-446655440001', 'multiple_choice',
     'What is the proper following distance in good weather conditions?',
     '["1 second", "2 seconds", "3 seconds", "5 seconds"]'::jsonb,
     '"3 seconds"'::jsonb,
     10, 'The three-second rule provides a safe following distance in good weather conditions.', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- CREATE TEST ENROLLMENTS
-- =============================================
INSERT INTO enrollments (student_id, course_id, status, progress_percentage)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'active', 75),
    ('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 'active', 45),
    ('660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', 'active', 30)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- =============================================
-- CREATE LESSON PROGRESS
-- =============================================
INSERT INTO lesson_progress (student_id, lesson_id, status, completed_at, time_spent_seconds)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440001', 'completed', NOW() - INTERVAL '2 days', 1800),
    ('660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', 'completed', NOW() - INTERVAL '1 day', 1200),
    ('660e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440001', 'completed', NOW() - INTERVAL '3 days', 2100)
ON CONFLICT (student_id, lesson_id) DO NOTHING;

-- =============================================
-- CREATE SAMPLE NOTIFICATIONS
-- =============================================
INSERT INTO notifications (user_id, type, title, message, link, is_read)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440004', 'assignment', 'New Assignment Available', 
     'A new assignment has been posted in Basic Driving Course', '/student/courses/770e8400-e29b-41d4-a716-446655440001', false),
    ('660e8400-e29b-41d4-a716-446655440004', 'achievement', 'Achievement Unlocked!', 
     'You have completed your first module!', '/student/progress', false)
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Seed data inserted successfully!' AS message;
SELECT COUNT(*) AS tenant_count FROM tenants;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS course_count FROM courses;
SELECT COUNT(*) AS module_count FROM modules;
SELECT COUNT(*) AS lesson_count FROM lessons;
SELECT COUNT(*) AS enrollment_count FROM enrollments;

