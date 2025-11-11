-- ================================================================
-- Announcements System (Tenant-aware, Rich Media, Email-ready)
-- ================================================================
-- Provides a dedicated announcements channel separate from notifications.
-- Supports:
--   • Global (super admin) broadcasts
--   • Tenant-wide announcements
--   • Course/module/lesson/quiz scoped updates
--   • Rich media attachments (images, documents, embeds)
--   • Email delivery tracking & read receipts
-- ================================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('super_admin', 'school_admin', 'instructor')),
    audience_scope TEXT NOT NULL DEFAULT 'tenant'
        CHECK (audience_scope IN ('global', 'tenant', 'course', 'module', 'lesson', 'quiz')),
    title TEXT NOT NULL,
    summary TEXT,
    body_html TEXT NOT NULL,
    body_json JSONB,
    context_type TEXT NOT NULL DEFAULT 'general'
        CHECK (context_type IN ('general', 'course', 'module', 'lesson', 'quiz')),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    target_roles TEXT[] NOT NULL DEFAULT ARRAY['student']::TEXT[]
        CHECK (target_roles <@ ARRAY['student', 'instructor', 'school_admin', 'super_admin']),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant_status
    ON announcements (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_announcements_published
    ON announcements (status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_announcements_course
    ON announcements (course_id);

CREATE INDEX IF NOT EXISTS idx_announcements_module
    ON announcements (module_id);

CREATE INDEX IF NOT EXISTS idx_announcements_lesson
    ON announcements (lesson_id);

CREATE INDEX IF NOT EXISTS idx_announcements_quiz
    ON announcements (quiz_id);

CREATE TABLE IF NOT EXISTS announcement_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL
        CHECK (media_type IN ('image', 'video', 'audio', 'document', 'embed')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    alt_text TEXT,
    mime_type TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_media_announcement_id
    ON announcement_media (announcement_id);

CREATE TABLE IF NOT EXISTS announcement_reads (
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
    ON announcement_reads (user_id, read_at DESC);


