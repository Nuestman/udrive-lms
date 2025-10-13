--
-- UDrive LMS - Complete Supabase Migration
-- Schema + Data with INSERT statements
--

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_enrollments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_goals_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lesson_progress_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================
-- DROP EXISTING TABLES (IF ANY)
-- =============================================

DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.media_files CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- TENANTS
CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    subdomain text NOT NULL UNIQUE,
    settings jsonb DEFAULT '{}'::jsonb,
    subscription_tier text DEFAULT 'basic'::text,
    subscription_status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    contact_email text,
    contact_phone text,
    address text,
    is_active boolean DEFAULT true
);

-- USER PROFILES
CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    first_name text,
    last_name text,
    role text NOT NULL CHECK (role = ANY (ARRAY['super_admin'::text, 'school_admin'::text, 'instructor'::text, 'student'::text])),
    avatar_url text,
    phone text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- COURSES
CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
    duration_weeks integer,
    price numeric(10,2) DEFAULT 0,
    created_by uuid REFERENCES public.user_profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- MODULES
CREATE TABLE public.modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    estimated_duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- LESSONS
CREATE TABLE public.lessons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    content jsonb DEFAULT '[]'::jsonb,
    order_index integer NOT NULL,
    estimated_duration_minutes integer,
    status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lesson_type text DEFAULT 'text'::text,
    video_url text,
    document_url text
);

-- ENROLLMENTS
CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'suspended'::text])),
    enrolled_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    progress_percentage integer DEFAULT 0,
    last_accessed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(student_id, course_id)
);

-- LESSON PROGRESS
CREATE TABLE public.lesson_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
    status text DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    time_spent_seconds integer DEFAULT 0,
    last_position text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(student_id, lesson_id)
);

-- GOALS
CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    target_date date,
    status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'cancelled'::text])),
    progress_percentage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- QUIZZES
CREATE TABLE public.quizzes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    passing_score integer DEFAULT 70,
    time_limit_minutes integer,
    max_attempts integer,
    randomize_questions boolean DEFAULT false,
    randomize_answers boolean DEFAULT false,
    show_feedback text DEFAULT 'immediate'::text CHECK (show_feedback = ANY (ARRAY['immediate'::text, 'after_submission'::text, 'after_completion'::text, 'never'::text])),
    status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- QUIZ QUESTIONS
CREATE TABLE public.quiz_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_type text NOT NULL CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'short_answer'::text, 'matching'::text, 'ordering'::text])),
    question_text text NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    points integer DEFAULT 1,
    explanation text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])),
    score integer,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    time_spent_seconds integer,
    answers jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- CERTIFICATES
CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_number text NOT NULL UNIQUE,
    verification_code text NOT NULL UNIQUE,
    issued_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text])),
    pdf_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- ASSIGNMENTS
CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    instructions text,
    due_date timestamp with time zone,
    max_score integer DEFAULT 100,
    submission_types jsonb DEFAULT '["text"]'::jsonb,
    rubric jsonb,
    status text DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ASSIGNMENT SUBMISSIONS
CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content text,
    file_urls jsonb,
    status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'returned'::text])),
    score integer,
    feedback text,
    graded_by uuid REFERENCES public.user_profiles(id),
    graded_at timestamp with time zone,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(assignment_id, student_id)
);

-- MEDIA FILES
CREATE TABLE public.media_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES public.user_profiles(id),
    filename text NOT NULL,
    original_filename text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE public.audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id),
    user_id uuid REFERENCES public.user_profiles(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX idx_courses_tenant_id ON public.courses(tenant_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_created_by ON public.courses(created_by);

CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_modules_order ON public.modules(course_id, order_index);

CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_order ON public.lessons(module_id, order_index);

CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);

CREATE INDEX idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);

CREATE INDEX idx_goals_student_id ON public.goals(student_id);
CREATE INDEX idx_goals_course_id ON public.goals(course_id);

CREATE INDEX idx_quizzes_module_id ON public.quizzes(module_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX idx_certificates_verification_code ON public.certificates(verification_code);

CREATE INDEX idx_assignments_module_id ON public.assignments(module_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);

CREATE INDEX idx_media_files_tenant_id ON public.media_files(tenant_id);
CREATE INDEX idx_media_files_uploaded_by ON public.media_files(uploaded_by);
CREATE INDEX idx_media_files_file_type ON public.media_files(file_type);

CREATE INDEX idx_audit_log_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- =============================================
-- CREATE TRIGGERS
-- =============================================

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER enrollments_updated_at_trigger BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_enrollments_updated_at();
CREATE TRIGGER lesson_progress_updated_at_trigger BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_lesson_progress_updated_at();
CREATE TRIGGER goals_updated_at_trigger BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_goals_updated_at();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INSERT DATA
-- =============================================

-- TENANTS DATA
INSERT INTO public.tenants (id, name, subdomain, settings, subscription_tier, subscription_status, created_at, updated_at, contact_email, contact_phone, address, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Premier Driving Academy', 'premier', '{"theme": "blue", "logo_url": ""}', 'premium', 'active', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07', NULL, NULL, NULL, true),
('36b2ae0d-c53c-47d7-9e80-71c933a1cc2a', 'Downtown Driving Academy', 'downtown-academy', '{}', 'basic', 'active', '2025-10-12 05:51:25.715475-07', '2025-10-12 05:51:25.715475-07', 'info@downtown-academy.com', NULL, NULL, true),
('145d918b-65f1-43c3-a812-ac2f5baa1fdc', 'Uptown Driving School', 'uptown', '{}', 'premium', 'active', '2025-10-12 05:53:27.06998-07', '2025-10-12 06:00:38.238526-07', 'uptown@udrivelms.com', '0546979534', 'Somewhere, Uptown.', true);

-- USER PROFILES DATA
INSERT INTO public.user_profiles (id, tenant_id, email, password_hash, first_name, last_name, role, avatar_url, phone, settings, is_active, last_login, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'instructor@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'John', 'Smith', 'instructor', NULL, '+1234567890', '{}', true, '2025-10-12 08:03:13.69457-07', '2025-10-11 16:45:09.16363-07', '2025-10-12 08:03:13.69457-07'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'student1@example.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Michael', 'Chen', 'student', NULL, NULL, '{}', true, '2025-10-12 08:06:19.327666-07', '2025-10-11 16:45:09.16363-07', '2025-10-12 08:06:19.327666-07'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'schooladmin@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Sarah', 'Johnson', 'school_admin', NULL, NULL, '{}', true, NULL, '2025-10-11 16:45:09.16363-07', '2025-10-12 08:03:12.753423-07'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'student2@example.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Emily', 'Rodriguez', 'student', NULL, NULL, '{}', true, NULL, '2025-10-11 16:45:09.16363-07', '2025-10-12 08:03:12.753423-07'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'student3@example.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'David', 'Kim', 'student', NULL, NULL, '{}', true, NULL, '2025-10-11 16:45:09.16363-07', '2025-10-12 08:03:12.753423-07'),
('d2f92a00-f0dd-4bf1-bdcf-080cd84c4783', '550e8400-e29b-41d4-a716-446655440000', 'studentuser@udrive.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Student', 'User', 'student', NULL, '0206484034', '{}', true, NULL, '2025-10-12 04:36:51.827227-07', '2025-10-12 08:03:12.753423-07'),
('ac5b9b0c-23b0-46dc-9a64-1aa2c24611a3', '145d918b-65f1-43c3-a812-ac2f5baa1fdc', 'test@test.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Test', 'Student', 'student', NULL, '65453216546', '{}', true, NULL, '2025-10-12 07:12:23.438246-07', '2025-10-12 08:03:12.753423-07'),
('67e0428c-44fd-4fc8-b195-ffe33c2366bb', NULL, 'admin@udrivelms.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Numan', 'Usman', 'super_admin', NULL, '0206484034', '{}', true, '2025-10-12 07:27:03.338689-07', '2025-10-12 01:28:13.092253-07', '2025-10-12 08:03:12.753423-07'),
('660e8400-e29b-41d4-a716-446655440001', '145d918b-65f1-43c3-a812-ac2f5baa1fdc', 'admin@uptown.udrive.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Admin', 'User', 'school_admin', NULL, NULL, '{}', true, '2025-10-12 07:53:53.152182-07', '2025-10-11 16:45:09.16363-07', '2025-10-12 08:03:12.753423-07');

-- COURSES DATA
INSERT INTO public.courses (id, tenant_id, title, description, thumbnail_url, status, duration_weeks, price, created_by, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Basic Driving Course', 'Learn the fundamentals of safe driving including traffic laws, vehicle operation, and defensive driving techniques.', NULL, 'published', 6, 499.99, '660e8400-e29b-41d4-a716-446655440003', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Advanced Defensive Driving', 'Master advanced driving techniques for handling challenging road conditions and emergency situations.', NULL, 'published', 4, 699.99, '660e8400-e29b-41d4-a716-446655440003', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Traffic Laws Review', 'Comprehensive review of state traffic laws and regulations for license renewal or knowledge refresh.', NULL, 'published', 2, 199.99, '660e8400-e29b-41d4-a716-446655440003', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('daed5b66-23f9-4563-8d46-5ce6cfda4eee', '550e8400-e29b-41d4-a716-446655440000', 'Test Course', 'Test description', NULL, 'draft', 6, 50.00, '67e0428c-44fd-4fc8-b195-ffe33c2366bb', '2025-10-12 03:32:03.704312-07', '2025-10-12 03:32:03.704312-07'),
('6ca25710-4162-4030-978f-06fd49624640', '145d918b-65f1-43c3-a812-ac2f5baa1fdc', 'Uptown Test', 'Testing uptown', NULL, 'published', 12, 1000.00, '660e8400-e29b-41d4-a716-446655440001', '2025-10-12 06:06:18.71451-07', '2025-10-12 07:54:30.888388-07');

-- MODULES DATA
INSERT INTO public.modules (id, course_id, title, description, order_index, estimated_duration_minutes, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Introduction to vehicle controls and basic operations', 1, 120, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Basic Maneuvers', 'Learn essential driving maneuvers including parking and turns', 2, 180, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'Traffic Navigation', 'Understanding and navigating various traffic situations', 3, 150, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'Hazard Recognition', 'Identifying and responding to potential hazards', 1, 90, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'Emergency Procedures', 'Handling emergency situations safely', 2, 120, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('6d9f81eb-6d80-4962-8c14-a588f3062767', 'daed5b66-23f9-4563-8d46-5ce6cfda4eee', 'Test Module', NULL, 1, NULL, '2025-10-12 04:48:22.986164-07', '2025-10-12 04:48:22.986164-07'),
('9b54daee-8066-4f41-a7c3-8a24b83cd351', '6ca25710-4162-4030-978f-06fd49624640', 'Test Module', NULL, 1, NULL, '2025-10-12 06:07:11.456048-07', '2025-10-12 06:07:11.456048-07');

-- LESSONS DATA
INSERT INTO public.lessons (id, module_id, title, description, content, order_index, estimated_duration_minutes, status, created_at, updated_at, lesson_type, video_url, document_url) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Vehicle Controls', 'Understanding all vehicle controls and their functions', '[{"id": "block-1", "type": "text", "content": {"text": "Welcome to your first lesson on vehicle controls!"}}]', 1, 30, 'published', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07', 'text', NULL, NULL),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Safety Check', 'Pre-driving safety inspection procedures', '[{"id": "block-2", "type": "text", "content": {"text": "Always perform a safety check before driving."}}]', 2, 20, 'published', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07', 'text', NULL, NULL),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', 'Parking Techniques', 'Master parallel and perpendicular parking', '[{"id": "block-3", "type": "text", "content": {"text": "Parking is an essential skill for every driver."}}]', 1, 45, 'published', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07', 'text', NULL, NULL),
('ee078762-eef7-40d3-ba61-608b59e7e098', '9b54daee-8066-4f41-a7c3-8a24b83cd351', 'Test lesson', NULL, '{}', 1, NULL, 'draft', '2025-10-12 06:21:40.883976-07', '2025-10-12 06:21:40.883976-07', 'text', NULL, NULL),
('9c625ac5-d3db-4474-9a01-9e827a923d8f', '9b54daee-8066-4f41-a7c3-8a24b83cd351', 'dsafdafdf', NULL, '{}', 2, NULL, 'draft', '2025-10-12 06:22:01.346373-07', '2025-10-12 06:22:01.346373-07', 'text', NULL, NULL);

-- ENROLLMENTS DATA
INSERT INTO public.enrollments (id, student_id, course_id, status, enrolled_at, completed_at, progress_percentage, last_accessed_at, updated_at, created_at) VALUES
('68203984-1c67-4d31-a900-e3e90705c979', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 'active', '2025-10-11 16:45:09.16363-07', NULL, 45, NULL, '2025-10-12 08:45:26.949687-07', '2025-10-12 08:45:26.949687-07'),
('342e4e9c-697e-4d1f-b38b-64a12a5c47fc', '660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', 'active', '2025-10-11 16:45:09.16363-07', NULL, 30, NULL, '2025-10-12 08:45:26.949687-07', '2025-10-12 08:45:26.949687-07'),
('e6a30b4d-c163-482d-8497-6d7881fc4e94', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'active', '2025-10-11 16:45:09.16363-07', NULL, 67, NULL, '2025-10-12 08:51:49.042241-07', '2025-10-12 08:45:26.949687-07');

-- LESSON PROGRESS DATA
INSERT INTO public.lesson_progress (id, student_id, lesson_id, status, started_at, completed_at, time_spent_seconds, last_position, updated_at, created_at) VALUES
('2616f7e5-46b2-4eb9-b0f2-0e8177b6488b', '660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440001', 'completed', NULL, '2025-10-09 16:45:09.16363-07', 1800, NULL, '2025-10-12 08:17:19.575294-07', '2025-10-12 08:17:19.575294-07'),
('b92649ba-3c1a-48f0-9898-29029e61e09a', '660e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440001', 'completed', NULL, '2025-10-08 16:45:09.16363-07', 2100, NULL, '2025-10-12 08:17:19.575294-07', '2025-10-12 08:17:19.575294-07'),
('a54c84fd-307c-4596-8274-7ed0c29270a4', '660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', 'completed', NULL, '2025-10-12 08:42:08.277304-07', 1200, NULL, '2025-10-12 08:42:08.277304-07', '2025-10-12 08:17:19.575294-07'),
('cd1e6ebf-cabd-4ce5-a2bb-93a7ffbd406e', '660e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440003', 'not_started', NULL, NULL, 0, NULL, '2025-10-12 08:51:49.029764-07', '2025-10-12 08:17:19.575294-07');

-- NOTIFICATIONS DATA
INSERT INTO public.notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES
('732f9de4-a136-415b-860f-0c4fc5476aaf', '660e8400-e29b-41d4-a716-446655440004', 'assignment', 'New Assignment Available', 'A new assignment has been posted in Basic Driving Course', '/student/courses/770e8400-e29b-41d4-a716-446655440001', false, '2025-10-11 16:45:09.16363-07'),
('574af612-d44d-41a1-aec9-6dad2575e4ec', '660e8400-e29b-41d4-a716-446655440004', 'achievement', 'Achievement Unlocked!', 'You have completed your first module!', '/student/progress', false, '2025-10-11 16:45:09.16363-07');

-- QUIZZES DATA
INSERT INTO public.quizzes (id, module_id, title, description, passing_score, time_limit_minutes, max_attempts, randomize_questions, randomize_answers, show_feedback, status, created_at, updated_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Getting Started Quiz', 'Test your knowledge of vehicle controls and basic operations', 70, 10, NULL, false, false, 'immediate', 'published', '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07');

-- QUIZ QUESTIONS DATA
INSERT INTO public.quiz_questions (id, quiz_id, question_type, question_text, options, correct_answer, points, explanation, order_index, created_at, updated_at) VALUES
('abc19118-f61b-4934-bde5-e34ae87b9753', 'aa0e8400-e29b-41d4-a716-446655440001', 'multiple_choice', 'What should you do when approaching a yellow traffic light?', '["Speed up to get through", "Prepare to stop if it is safe to do so", "Always stop immediately", "Ignore it if no other cars are present"]', '"Prepare to stop if it is safe to do so"', 10, 'A yellow light indicates that the signal is about to turn red. You should prepare to stop if you can do so safely.', 1, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('db9334c4-34cb-41b5-b7e9-b8c317dfecd8', 'aa0e8400-e29b-41d4-a716-446655440001', 'true_false', 'In most states, it is legal to turn right on a red light after coming to a complete stop, unless otherwise posted.', 'null', 'true', 5, 'Right turns on red are generally permitted after a complete stop, unless a sign prohibits it.', 2, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07'),
('ef062889-12d1-4ae4-bbc8-19c0740b2aea', 'aa0e8400-e29b-41d4-a716-446655440001', 'multiple_choice', 'What is the proper following distance in good weather conditions?', '["1 second", "2 seconds", "3 seconds", "5 seconds"]', '"3 seconds"', 10, 'The three-second rule provides a safe following distance in good weather conditions.', 3, '2025-10-11 16:45:09.16363-07', '2025-10-11 16:45:09.16363-07');

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Verify data
SELECT 'Tenants' as table_name, COUNT(*) as row_count FROM public.tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM public.user_profiles
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
SELECT 'Notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'Quizzes', COUNT(*) FROM public.quizzes
UNION ALL
SELECT 'Quiz Questions', COUNT(*) FROM public.quiz_questions;

