-- Reviews & Feedback System Overhaul Migration
-- Adds visibility metadata to reviews, introduces platform feedback & testimonials,
-- and configures course review prompt settings.

-- =============================================
-- REVIEWS TABLE ENHANCEMENTS
-- =============================================
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS visibility TEXT;

UPDATE reviews
SET visibility = 'private'
WHERE visibility IS NULL;

ALTER TABLE reviews
    ALTER COLUMN visibility SET NOT NULL,
    ALTER COLUMN visibility SET DEFAULT 'private';

DO $$
BEGIN
    ALTER TABLE reviews
        ADD CONSTRAINT chk_reviews_visibility CHECK (visibility IN ('private', 'public'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS metadata JSONB;

UPDATE reviews
SET metadata = '{}'::JSONB
WHERE metadata IS NULL;

ALTER TABLE reviews
    ALTER COLUMN metadata SET NOT NULL,
    ALTER COLUMN metadata SET DEFAULT '{}'::JSONB;

-- =============================================
-- PLATFORM FEEDBACK
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_platform_feedback_user_id ON platform_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_tenant_id ON platform_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_created_at ON platform_feedback(created_at DESC);

-- =============================================
-- TESTIMONIALS
-- =============================================
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

DO $$
BEGIN
    ALTER TABLE testimonials
        ADD CONSTRAINT chk_testimonials_source
        CHECK (
            (review_id IS NOT NULL)::INT
            + (feedback_id IS NOT NULL)::INT
            + (body IS NOT NULL)::INT >= 1
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);

-- =============================================
-- COURSE REVIEW PROMPT SETTINGS
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_course_review_prompt_history_course ON course_review_prompt_history(course_id);
CREATE INDEX IF NOT EXISTS idx_course_review_prompt_history_user ON course_review_prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_course_review_prompt_history_status ON course_review_prompt_history(status);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
    CREATE TRIGGER update_testimonials_updated_at
        BEFORE UPDATE ON testimonials
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_function THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_course_review_settings_updated_at ON course_review_settings;
    CREATE TRIGGER update_course_review_settings_updated_at
        BEFORE UPDATE ON course_review_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_function THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_course_review_prompt_history_updated_at ON course_review_prompt_history;
    CREATE TRIGGER update_course_review_prompt_history_updated_at
        BEFORE UPDATE ON course_review_prompt_history
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_function THEN
        NULL;
END $$;


