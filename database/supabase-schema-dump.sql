-- =============================================
-- SunLMS Database Schema
-- Dumped from Supabase: 2025-11-13T19:59:06.766Z
-- PostgreSQL Version: PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLE: tenants
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    logo_url TEXT,
    white_label_settings JSONB DEFAULT '{}',
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: courses
-- =============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft',
    duration_weeks INTEGER,
    price NUMERIC DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    slug TEXT,
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: modules
-- =============================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    course_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: lessons
-- =============================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    module_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '[]',
    lesson_type TEXT DEFAULT 'text',
    video_url TEXT,
    document_url TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: quizzes
-- =============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    module_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER,
    max_attempts INTEGER,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_answers BOOLEAN DEFAULT false,
    show_feedback TEXT DEFAULT 'immediate',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: announcements
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    author_id UUID,
    author_role TEXT NOT NULL,
    audience_scope TEXT DEFAULT 'tenant' NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    body_html TEXT NOT NULL,
    body_json JSONB,
    context_type TEXT DEFAULT 'general' NOT NULL,
    course_id UUID,
    module_id UUID,
    lesson_id UUID,
    quiz_id UUID,
    target_roles TEXT[] DEFAULT ARRAY['student'] NOT NULL,
    status TEXT DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: announcement_media
-- =============================================
CREATE TABLE IF NOT EXISTS announcement_media (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    announcement_id UUID NOT NULL,
    media_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    alt_text TEXT,
    mime_type TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: announcement_reads
-- =============================================
CREATE TABLE IF NOT EXISTS announcement_reads (
    announcement_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (announcement_id, user_id)
);

-- =============================================
-- TABLE: assignments
-- =============================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    module_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    submission_types JSONB DEFAULT '["text"]',
    rubric JSONB,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: assignment_submissions
-- =============================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    assignment_id UUID,
    student_id UUID,
    content TEXT,
    file_urls JSONB,
    status TEXT DEFAULT 'draft',
    score INTEGER,
    feedback TEXT,
    graded_by UUID,
    graded_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: audit_log
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: enrollments
-- =============================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    course_id UUID,
    status TEXT DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: certificates
-- =============================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    course_id UUID,
    certificate_number TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    enrollment_id UUID,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    school_name TEXT,
    instructor_name TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID,
    template_id TEXT DEFAULT 'default',
    design_data JSONB DEFAULT '{}',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    revoked_by UUID,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: contact_messages
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    is_read BOOLEAN DEFAULT false,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: contact_message_replies
-- =============================================
CREATE TABLE IF NOT EXISTS contact_message_replies (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    contact_message_id UUID NOT NULL,
    replied_by UUID NOT NULL,
    reply_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: content_progress
-- =============================================
CREATE TABLE IF NOT EXISTS content_progress (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    status TEXT DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT,
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: reviews
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    reviewable_type TEXT NOT NULL,
    reviewable_id UUID,
    rating INTEGER,
    title TEXT,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    visibility TEXT DEFAULT 'private' NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    metadata JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: course_review_prompt_history
-- =============================================
CREATE TABLE IF NOT EXISTS course_review_prompt_history (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    course_id UUID NOT NULL,
    user_id UUID NOT NULL,
    last_prompted_at TIMESTAMP WITH TIME ZONE,
    last_review_id UUID,
    prompt_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: course_review_settings
-- =============================================
CREATE TABLE IF NOT EXISTS course_review_settings (
    course_id UUID NOT NULL,
    trigger_type TEXT DEFAULT 'percentage' NOT NULL,
    trigger_value INTEGER DEFAULT 20,
    cooldown_days INTEGER DEFAULT 30,
    allow_multiple BOOLEAN DEFAULT false,
    manual_trigger_enabled BOOLEAN DEFAULT false,
    prompt_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (course_id)
);

-- =============================================
-- TABLE: course_support_questions
-- =============================================
CREATE TABLE IF NOT EXISTS course_support_questions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    course_id UUID NOT NULL,
    student_id UUID NOT NULL,
    lesson_id UUID,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: course_support_replies
-- =============================================
CREATE TABLE IF NOT EXISTS course_support_replies (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    question_id UUID NOT NULL,
    user_id UUID NOT NULL,
    body TEXT NOT NULL,
    is_answer BOOLEAN DEFAULT false,
    is_instructor_reply BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: course_support_attachments
-- =============================================
CREATE TABLE IF NOT EXISTS course_support_attachments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    question_id UUID,
    reply_id UUID,
    file_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: goals
-- =============================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    course_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'in_progress',
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: lesson_progress
-- =============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    lesson_id UUID,
    status TEXT DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: media_files
-- =============================================
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    uploaded_by UUID,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data JSONB,
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: platform_feedback
-- =============================================
CREATE TABLE IF NOT EXISTS platform_feedback (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    tenant_id UUID,
    onboarding_score INT2,
    usability_score INT2,
    ui_score INT2,
    navigation_score INT2,
    support_score INT2,
    role_context TEXT,
    additional_context JSONB DEFAULT '{}',
    comments TEXT,
    submitted_from TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: quiz_attempts
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    student_id UUID,
    quiz_id UUID,
    status TEXT DEFAULT 'in_progress',
    score INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: quiz_questions
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    quiz_id UUID,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    points INTEGER DEFAULT 1,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: review_comments
-- =============================================
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    review_id UUID NOT NULL,
    author_id UUID NOT NULL,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: system_settings
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT NOT NULL,
    value JSONB DEFAULT '{}' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (key)
);

-- =============================================
-- TABLE: testimonials
-- =============================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    review_id UUID,
    feedback_id UUID,
    headline TEXT,
    body TEXT,
    attribution_name TEXT,
    attribution_title TEXT,
    attribution_organization TEXT,
    placement TEXT,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- TABLE: user_profiles
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    date_of_birth DATE,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    emergency_contact_email TEXT,
    guardian_name TEXT,
    guardian_email TEXT,
    guardian_phone TEXT,
    guardian_relationship TEXT,
    guardian_address TEXT,
    nationality TEXT,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    profile_preferences JSONB DEFAULT '{}',
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- CONSTRAINTS (Foreign Keys, Checks, Unique)
-- =============================================

ALTER TABLE tenants ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);
ALTER TABLE users ADD CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'school_admin'::text, 'instructor'::text, 'student'::text])));
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE courses ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE courses ADD CONSTRAINT courses_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE courses ADD CONSTRAINT courses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE modules ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check CHECK ((lesson_type = ANY (ARRAY['text'::text, 'video'::text, 'document'::text, 'quiz'::text])));
ALTER TABLE lessons ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])));
ALTER TABLE quizzes ADD CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE quizzes ADD CONSTRAINT quizzes_show_feedback_check CHECK ((show_feedback = ANY (ARRAY['immediate'::text, 'after_submission'::text, 'after_completion'::text, 'never'::text])));
ALTER TABLE quizzes ADD CONSTRAINT quizzes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE announcements ADD CONSTRAINT announcements_audience_scope_check CHECK ((audience_scope = ANY (ARRAY['global'::text, 'tenant'::text, 'course'::text, 'module'::text, 'lesson'::text, 'quiz'::text])));
ALTER TABLE announcements ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_author_role_check CHECK ((author_role = ANY (ARRAY['super_admin'::text, 'school_admin'::text, 'instructor'::text])));
ALTER TABLE announcements ADD CONSTRAINT announcements_context_type_check CHECK ((context_type = ANY (ARRAY['general'::text, 'course'::text, 'module'::text, 'lesson'::text, 'quiz'::text])));
ALTER TABLE announcements ADD CONSTRAINT announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text])));
ALTER TABLE announcements ADD CONSTRAINT announcements_target_roles_check CHECK ((target_roles <@ ARRAY['student'::text, 'instructor'::text, 'school_admin'::text, 'super_admin'::text]));
ALTER TABLE announcements ADD CONSTRAINT announcements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE announcement_media ADD CONSTRAINT announcement_media_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
ALTER TABLE announcement_media ADD CONSTRAINT announcement_media_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text, 'embed'::text])));
ALTER TABLE announcement_reads ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
ALTER TABLE announcement_reads ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT assignments_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'returned'::text])));
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'suspended'::text])));
ALTER TABLE enrollments ADD CONSTRAINT enrollments_student_id_course_id_key UNIQUE (student_id, course_id);
ALTER TABLE enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE certificates ADD CONSTRAINT certificates_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE certificates ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);
ALTER TABLE certificates ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE certificates ADD CONSTRAINT certificates_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE;
ALTER TABLE certificates ADD CONSTRAINT certificates_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES users(id);
ALTER TABLE certificates ADD CONSTRAINT certificates_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text])));
ALTER TABLE certificates ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE certificates ADD CONSTRAINT certificates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE certificates ADD CONSTRAINT certificates_verification_code_key UNIQUE (verification_code);
ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'archived'::text])));
ALTER TABLE contact_message_replies ADD CONSTRAINT contact_message_replies_contact_message_id_fkey FOREIGN KEY (contact_message_id) REFERENCES contact_messages(id) ON DELETE CASCADE;
ALTER TABLE contact_message_replies ADD CONSTRAINT contact_message_replies_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES users(id);
ALTER TABLE content_progress ADD CONSTRAINT content_progress_content_type_check CHECK ((content_type = ANY (ARRAY['lesson'::text, 'quiz'::text])));
ALTER TABLE content_progress ADD CONSTRAINT content_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])));
ALTER TABLE content_progress ADD CONSTRAINT content_progress_student_id_content_id_content_type_key UNIQUE (student_id, content_id, content_type);
ALTER TABLE content_progress ADD CONSTRAINT content_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_reviewable_id CHECK ((((reviewable_type = 'platform'::text) AND (reviewable_id IS NULL)) OR ((reviewable_type = ANY (ARRAY['course'::text, 'school'::text])) AND (reviewable_id IS NOT NULL))));
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_visibility CHECK ((visibility = ANY (ARRAY['private'::text, 'public'::text])));
ALTER TABLE reviews ADD CONSTRAINT reviews_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewable_type_check CHECK ((reviewable_type = ANY (ARRAY['platform'::text, 'course'::text, 'school'::text])));
ALTER TABLE reviews ADD CONSTRAINT reviews_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'public'::text])));
ALTER TABLE course_review_prompt_history ADD CONSTRAINT course_review_prompt_history_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE course_review_prompt_history ADD CONSTRAINT course_review_prompt_history_course_id_user_id_key UNIQUE (course_id, user_id);
ALTER TABLE course_review_prompt_history ADD CONSTRAINT course_review_prompt_history_last_review_id_fkey FOREIGN KEY (last_review_id) REFERENCES reviews(id) ON DELETE SET NULL;
ALTER TABLE course_review_prompt_history ADD CONSTRAINT course_review_prompt_history_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'dismissed'::text, 'completed'::text])));
ALTER TABLE course_review_prompt_history ADD CONSTRAINT course_review_prompt_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE course_review_settings ADD CONSTRAINT course_review_settings_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE course_review_settings ADD CONSTRAINT course_review_settings_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['percentage'::text, 'lesson_count'::text, 'manual'::text])));
ALTER TABLE course_support_questions ADD CONSTRAINT course_support_questions_category_check CHECK ((category = ANY (ARRAY['course_content'::text, 'certificates'::text, 'resources'::text, 'technical'::text, 'other'::text])));
ALTER TABLE course_support_questions ADD CONSTRAINT course_support_questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE course_support_questions ADD CONSTRAINT course_support_questions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL;
ALTER TABLE course_support_questions ADD CONSTRAINT course_support_questions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'answered'::text, 'resolved'::text, 'closed'::text])));
ALTER TABLE course_support_questions ADD CONSTRAINT course_support_questions_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE course_support_replies ADD CONSTRAINT course_support_replies_question_id_fkey FOREIGN KEY (question_id) REFERENCES course_support_questions(id) ON DELETE CASCADE;
ALTER TABLE course_support_replies ADD CONSTRAINT course_support_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE course_support_attachments ADD CONSTRAINT check_attachment_reference CHECK ((((question_id IS NOT NULL) AND (reply_id IS NULL)) OR ((question_id IS NULL) AND (reply_id IS NOT NULL))));
ALTER TABLE course_support_attachments ADD CONSTRAINT course_support_attachments_question_id_fkey FOREIGN KEY (question_id) REFERENCES course_support_questions(id) ON DELETE CASCADE;
ALTER TABLE course_support_attachments ADD CONSTRAINT course_support_attachments_reply_id_fkey FOREIGN KEY (reply_id) REFERENCES course_support_replies(id) ON DELETE CASCADE;
ALTER TABLE goals ADD CONSTRAINT goals_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'cancelled'::text])));
ALTER TABLE goals ADD CONSTRAINT goals_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])));
ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);
ALTER TABLE media_files ADD CONSTRAINT media_files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE media_files ADD CONSTRAINT media_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_navigation_score_check CHECK (((navigation_score >= 1) AND (navigation_score <= 5)));
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_onboarding_score_check CHECK (((onboarding_score >= 1) AND (onboarding_score <= 5)));
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_support_score_check CHECK (((support_score >= 1) AND (support_score <= 5)));
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_ui_score_check CHECK (((ui_score >= 1) AND (ui_score <= 5)));
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_usability_score_check CHECK (((usability_score >= 1) AND (usability_score <= 5)));
ALTER TABLE platform_feedback ADD CONSTRAINT platform_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'abandoned'::text])));
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_question_type_check CHECK ((question_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'short_answer'::text, 'matching'::text, 'ordering'::text])));
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
ALTER TABLE review_comments ADD CONSTRAINT review_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE review_comments ADD CONSTRAINT review_comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
ALTER TABLE testimonials ADD CONSTRAINT chk_testimonials_source CHECK ((((((review_id IS NOT NULL))::integer + ((feedback_id IS NOT NULL))::integer) + ((body IS NOT NULL))::integer) >= 1));
ALTER TABLE testimonials ADD CONSTRAINT testimonials_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES platform_feedback(id) ON DELETE SET NULL;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_review_id_fkey FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE SET NULL;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX users_tenant_id_idx ON public.users USING btree (tenant_id);
CREATE INDEX users_email_idx ON public.users USING btree (email);
CREATE INDEX users_role_idx ON public.users USING btree (role);
CREATE INDEX idx_courses_tenant_id ON public.courses USING btree (tenant_id);
CREATE INDEX idx_courses_status ON public.courses USING btree (status);
CREATE INDEX idx_courses_created_by ON public.courses USING btree (created_by);
CREATE UNIQUE INDEX uniq_courses_tenant_slug ON public.courses USING btree (tenant_id, slug) WHERE (slug IS NOT NULL);
CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);
CREATE INDEX idx_modules_order ON public.modules USING btree (course_id, order_index);
CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);
CREATE INDEX idx_lessons_order ON public.lessons USING btree (module_id, order_index);
CREATE INDEX idx_quizzes_module_id ON public.quizzes USING btree (module_id);
CREATE INDEX idx_announcements_tenant_status ON public.announcements USING btree (tenant_id, status);
CREATE INDEX idx_announcements_published ON public.announcements USING btree (status, published_at DESC NULLS LAST);
CREATE INDEX idx_announcements_course ON public.announcements USING btree (course_id);
CREATE INDEX idx_announcements_module ON public.announcements USING btree (module_id);
CREATE INDEX idx_announcements_lesson ON public.announcements USING btree (lesson_id);
CREATE INDEX idx_announcements_quiz ON public.announcements USING btree (quiz_id);
CREATE INDEX idx_announcement_media_announcement_id ON public.announcement_media USING btree (announcement_id);
CREATE INDEX idx_announcement_reads_user ON public.announcement_reads USING btree (user_id, read_at DESC);
CREATE INDEX idx_assignments_module_id ON public.assignments USING btree (module_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions USING btree (assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions USING btree (student_id);
CREATE INDEX idx_audit_log_tenant_id ON public.audit_log USING btree (tenant_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at);
CREATE INDEX idx_enrollments_student_id ON public.enrollments USING btree (student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);
CREATE INDEX idx_certificates_student_id ON public.certificates USING btree (student_id);
CREATE INDEX idx_certificates_course_id ON public.certificates USING btree (course_id);
CREATE INDEX idx_certificates_verification_code ON public.certificates USING btree (verification_code);
CREATE INDEX idx_certificates_enrollment_id ON public.certificates USING btree (enrollment_id);
CREATE INDEX idx_certificates_tenant_id ON public.certificates USING btree (tenant_id);
CREATE INDEX idx_certificates_tenant_student ON public.certificates USING btree (tenant_id, student_id);
CREATE INDEX idx_certificates_tenant_course ON public.certificates USING btree (tenant_id, course_id);
CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages USING btree (is_read);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);
CREATE INDEX idx_contact_messages_email ON public.contact_messages USING btree (email);
CREATE INDEX idx_contact_message_replies_message_id ON public.contact_message_replies USING btree (contact_message_id);
CREATE INDEX idx_contact_message_replies_created_at ON public.contact_message_replies USING btree (created_at DESC);
CREATE INDEX idx_content_progress_student_id ON public.content_progress USING btree (student_id);
CREATE INDEX idx_content_progress_content_id ON public.content_progress USING btree (content_id);
CREATE INDEX idx_content_progress_content_type ON public.content_progress USING btree (content_type);
CREATE UNIQUE INDEX idx_reviews_unique_active ON public.reviews USING btree (user_id, reviewable_type, COALESCE(reviewable_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE (status = ANY (ARRAY['pending'::text, 'approved'::text]));
CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);
CREATE INDEX idx_reviews_reviewable_type ON public.reviews USING btree (reviewable_type);
CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);
CREATE INDEX idx_course_review_prompt_history_course ON public.course_review_prompt_history USING btree (course_id);
CREATE INDEX idx_course_review_prompt_history_user ON public.course_review_prompt_history USING btree (user_id);
CREATE INDEX idx_course_review_prompt_history_status ON public.course_review_prompt_history USING btree (status);
CREATE INDEX idx_support_questions_course_id ON public.course_support_questions USING btree (course_id);
CREATE INDEX idx_support_questions_student_id ON public.course_support_questions USING btree (student_id);
CREATE INDEX idx_support_questions_lesson_id ON public.course_support_questions USING btree (lesson_id);
CREATE INDEX idx_support_questions_status ON public.course_support_questions USING btree (status);
CREATE INDEX idx_support_questions_category ON public.course_support_questions USING btree (category);
CREATE INDEX idx_support_questions_created_at ON public.course_support_questions USING btree (created_at DESC);
CREATE INDEX idx_support_questions_last_reply_at ON public.course_support_questions USING btree (last_reply_at DESC NULLS LAST);
CREATE INDEX idx_support_replies_question_id ON public.course_support_replies USING btree (question_id);
CREATE INDEX idx_support_replies_user_id ON public.course_support_replies USING btree (user_id);
CREATE INDEX idx_support_replies_created_at ON public.course_support_replies USING btree (created_at DESC);
CREATE INDEX idx_support_replies_is_answer ON public.course_support_replies USING btree (is_answer) WHERE (is_answer = true);
CREATE INDEX idx_support_attachments_question_id ON public.course_support_attachments USING btree (question_id);
CREATE INDEX idx_support_attachments_reply_id ON public.course_support_attachments USING btree (reply_id);
CREATE INDEX idx_goals_student_id ON public.goals USING btree (student_id);
CREATE INDEX idx_goals_course_id ON public.goals USING btree (course_id);
CREATE INDEX idx_lesson_progress_student_id ON public.lesson_progress USING btree (student_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);
CREATE INDEX idx_media_files_tenant_id ON public.media_files USING btree (tenant_id);
CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);
CREATE INDEX idx_media_files_file_type ON public.media_files USING btree (file_type);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_platform_feedback_user_id ON public.platform_feedback USING btree (user_id);
CREATE INDEX idx_platform_feedback_tenant_id ON public.platform_feedback USING btree (tenant_id);
CREATE INDEX idx_platform_feedback_created_at ON public.platform_feedback USING btree (created_at DESC);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts USING btree (student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts USING btree (quiz_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions USING btree (quiz_id);
CREATE INDEX idx_review_comments_review_id ON public.review_comments USING btree (review_id);
CREATE INDEX idx_review_comments_author_id ON public.review_comments USING btree (author_id);
CREATE INDEX idx_testimonials_status ON public.testimonials USING btree (status);
CREATE INDEX idx_testimonials_display_order ON public.testimonials USING btree (display_order);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);
CREATE INDEX idx_user_profiles_last_name ON public.user_profiles USING btree (last_name);
CREATE INDEX idx_user_profiles_date_of_birth ON public.user_profiles USING btree (date_of_birth);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.create_user_with_profile(p_tenant_id uuid, p_email text, p_password_hash text, p_role text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_avatar_url text DEFAULT NULL::text)
 RETURNS TABLE(user_id uuid, profile_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    -- Insert user
    INSERT INTO users (tenant_id, email, password_hash, role)
    VALUES (p_tenant_id, p_email, p_password_hash, p_role)
    RETURNING id INTO v_user_id;
    
    -- Insert profile
    INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url)
    VALUES (v_user_id, p_first_name, p_last_name, p_phone, p_avatar_url)
    RETURNING id INTO v_profile_id;
    
    RETURN QUERY SELECT v_user_id, v_profile_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_reviewable_exists()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.reviewable_type = 'course' THEN
        PERFORM 1 FROM public.courses WHERE id = NEW.reviewable_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course with id % does not exist', NEW.reviewable_id;
        END IF;
    ELSIF NEW.reviewable_type = 'school' THEN
        PERFORM 1 FROM public.tenants WHERE id = NEW.reviewable_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'School (tenant) with id % does not exist', NEW.reviewable_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_question_view_count(question_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.course_support_questions
    SET view_count = view_count + 1
    WHERE id = question_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_question_reply_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.course_support_questions
    SET 
        reply_count = (
            SELECT COUNT(*) 
            FROM public.course_support_replies 
            WHERE question_id = NEW.question_id
        ),
        last_reply_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.question_id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_question_status_on_answer()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.is_answer = true THEN
        UPDATE public.course_support_questions
        SET 
            status = 'answered',
            updated_at = NOW()
        WHERE id = NEW.question_id AND status = 'open';
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_review_comments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_certificate(verification_code_param text)
 RETURNS TABLE(id uuid, certificate_number text, student_name text, course_name text, school_name text, issued_at timestamp with time zone, status text, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.certificate_number,
        c.student_name,
        c.course_name,
        c.school_name,
        c.issued_at,
        c.status,
        (c.status = 'active') as is_valid
    FROM certificates c
    WHERE c.verification_code = verification_code_param;
END;
$function$
;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trg_ensure_reviewable_exists BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION ensure_reviewable_exists();

CREATE TRIGGER trg_review_comments_updated_at BEFORE UPDATE ON public.review_comments FOR EACH ROW EXECUTE FUNCTION update_review_comments_updated_at();

CREATE TRIGGER trg_update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

CREATE TRIGGER trigger_update_question_reply_stats AFTER INSERT ON public.course_support_replies FOR EACH ROW EXECUTE FUNCTION update_question_reply_stats();

CREATE TRIGGER trigger_update_question_status_on_answer AFTER UPDATE OF is_answer ON public.course_support_replies FOR EACH ROW WHEN (((new.is_answer = true) AND (old.is_answer = false))) EXECUTE FUNCTION update_question_status_on_answer();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION update_contact_messages_updated_at();

CREATE TRIGGER update_course_review_prompt_history_updated_at BEFORE UPDATE ON public.course_review_prompt_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_review_settings_updated_at BEFORE UPDATE ON public.course_review_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

