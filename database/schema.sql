-- UDrive LMS Database Schema
-- PostgreSQL 12+

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TENANTS (Multi-tenant support)
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USERS (Authentication & Authorization)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'instructor', 'student')),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- USER PROFILES (Personal & Profile Data)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Profile Information
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    date_of_birth DATE,
    
    -- Address Information
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Emergency Contact Information
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    emergency_contact_email TEXT,
    
    -- Guardian Information (for minor students)
    guardian_name TEXT,
    guardian_email TEXT,
    guardian_phone TEXT,
    guardian_relationship TEXT,
    guardian_address TEXT,
    
    -- Additional Profile Data
    nationality TEXT,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    
    -- User-editable preferences (non-system settings)
    profile_preferences JSONB DEFAULT '{}',
    
    -- Social/Professional Links
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_last_name ON user_profiles(last_name);
CREATE INDEX idx_user_profiles_date_of_birth ON user_profiles(date_of_birth);

-- =============================================
-- COURSES
-- =============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    slug TEXT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    duration_weeks INTEGER,
    price DECIMAL(10,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_courses_tenant_slug ON courses(tenant_id, slug) WHERE slug IS NOT NULL;

-- =============================================
-- MODULES
-- =============================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- =============================================
-- LESSONS
-- =============================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '[]', -- Block editor content
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);

-- =============================================
-- QUIZZES
-- =============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_answers BOOLEAN DEFAULT false,
    show_feedback TEXT DEFAULT 'immediate' CHECK (show_feedback IN ('immediate', 'after_submission', 'after_completion', 'never')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);

-- =============================================
-- QUIZ QUESTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'matching', 'ordering')),
    question_text TEXT NOT NULL,
    options JSONB, -- Array of options for multiple choice
    correct_answer JSONB NOT NULL, -- Correct answer(s)
    points INTEGER DEFAULT 1,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- =============================================
-- ENROLLMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'suspended')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- =============================================
-- LESSON PROGRESS
-- =============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT, -- For tracking position in lesson
    UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- =============================================
-- QUIZ ATTEMPTS
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    score INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    answers JSONB, -- Student's answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- =============================================
-- CERTIFICATES
-- =============================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);

-- =============================================
-- ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    submission_types JSONB DEFAULT '["text"]', -- ['text', 'file', 'url']
    rubric JSONB, -- Grading rubric
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_module_id ON assignments(module_id);

-- =============================================
-- ASSIGNMENT SUBMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_urls JSONB, -- Array of uploaded file URLs
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    score INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);

-- =============================================
-- MEDIA LIBRARY
-- =============================================
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- REVIEWS & FEEDBACK
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewable_type TEXT NOT NULL CHECK (reviewable_type IN ('platform', 'course', 'school')),
    reviewable_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reviews
    ADD CONSTRAINT chk_reviews_reviewable_id
    CHECK (
        (reviewable_type = 'platform' AND reviewable_id IS NULL)
        OR (reviewable_type IN ('course', 'school') AND reviewable_id IS NOT NULL)
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_active
    ON reviews (
        user_id,
        reviewable_type,
        COALESCE(reviewable_id, '00000000-0000-0000-0000-000000000000'::UUID)
    )
    WHERE status IN ('pending', 'approved');

CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_reviewable_type ON reviews(reviewable_type);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

CREATE TABLE IF NOT EXISTS platform_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    onboarding_score SMALLINT CHECK (onboarding_score BETWEEN 1 AND 5),
    usability_score SMALLINT CHECK (usability_score BETWEEN 1 AND 5),
    ui_score SMALLINT CHECK (ui_score BETWEEN 1 AND 5),
    navigation_score SMALLINT CHECK (navigation_score BETWEEN 1 AND 5),
    support_score SMALLINT CHECK (support_score BETWEEN 1 AND 5),
    role_context TEXT,
    additional_context JSONB DEFAULT '{}',
    comments TEXT,
    submitted_from TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_feedback_user_id ON platform_feedback(user_id);
CREATE INDEX idx_platform_feedback_tenant_id ON platform_feedback(tenant_id);
CREATE INDEX idx_platform_feedback_created_at ON platform_feedback(created_at DESC);

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    feedback_id UUID REFERENCES platform_feedback(id) ON DELETE SET NULL,
    headline TEXT,
    body TEXT,
    attribution_name TEXT,
    attribution_title TEXT,
    attribution_organization TEXT,
    placement TEXT,
    display_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE testimonials
    ADD CONSTRAINT chk_testimonials_source
    CHECK (
        (review_id IS NOT NULL)::int
        + (feedback_id IS NOT NULL)::int
        + (body IS NOT NULL)::int >= 1
    );

CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_display_order ON testimonials(display_order);

CREATE TABLE IF NOT EXISTS course_review_settings (
    course_id UUID PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL DEFAULT 'percentage' CHECK (trigger_type IN ('percentage', 'lesson_count', 'manual')),
    trigger_value INTEGER DEFAULT 20,
    cooldown_days INTEGER DEFAULT 30,
    allow_multiple BOOLEAN DEFAULT false,
    manual_trigger_enabled BOOLEAN DEFAULT false,
    prompt_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_review_prompt_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_prompted_at TIMESTAMP WITH TIME ZONE,
    last_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    prompt_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'completed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

CREATE INDEX idx_course_review_prompt_history_course ON course_review_prompt_history(course_id);
CREATE INDEX idx_course_review_prompt_history_user ON course_review_prompt_history(user_id);
CREATE INDEX idx_course_review_prompt_history_status ON course_review_prompt_history(status);

-- =============================================
-- AUDIT LOG
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_review_settings_updated_at BEFORE UPDATE ON course_review_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_review_prompt_history_updated_at BEFORE UPDATE ON course_review_prompt_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

