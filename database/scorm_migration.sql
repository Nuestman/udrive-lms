-- SCORM Migration SQL
-- Run this in your Supabase SQL editor to:
-- 1. Ensure SCORM tables exist
-- 2. Add is_scorm flag to courses table

-- =============================================
-- 1. Create SCORM tables (if they don't exist)
-- =============================================

CREATE TABLE IF NOT EXISTS public.scorm_packages (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    tenant_id UUID,
    course_id UUID,
    title TEXT NOT NULL,
    version TEXT DEFAULT 'SCORM_1_2',
    zip_blob_url TEXT,
    content_base_path TEXT,
    owner_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.scorm_scos (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    package_id UUID NOT NULL,
    identifier TEXT NOT NULL,
    title TEXT,
    launch_path TEXT NOT NULL,
    is_entry_point BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.scorm_attempts (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    sco_id UUID NOT NULL,
    attempt_no INTEGER DEFAULT 1,
    lesson_status TEXT DEFAULT 'not_attempted',
    score_raw NUMERIC,
    score_min NUMERIC,
    score_max NUMERIC,
    lesson_location TEXT,
    suspend_data TEXT,
    total_time_seconds INTEGER DEFAULT 0,
    session_time_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    last_commit_at TIMESTAMPTZ,
    cmi_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================
-- 2. Add is_scorm column to courses table
-- =============================================

ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS is_scorm BOOLEAN DEFAULT false;

-- =============================================
-- 3. Add foreign key constraints (if not exist)
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_packages_tenant_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_packages 
            ADD CONSTRAINT scorm_packages_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_packages_course_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_packages 
            ADD CONSTRAINT scorm_packages_course_id_fkey 
            FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_packages_owner_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_packages 
            ADD CONSTRAINT scorm_packages_owner_id_fkey 
            FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_scos_package_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_scos 
            ADD CONSTRAINT scorm_scos_package_id_fkey 
            FOREIGN KEY (package_id) REFERENCES public.scorm_packages(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_attempts_user_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_attempts 
            ADD CONSTRAINT scorm_attempts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_attempts_sco_id_fkey'
    ) THEN
        ALTER TABLE public.scorm_attempts 
            ADD CONSTRAINT scorm_attempts_sco_id_fkey 
            FOREIGN KEY (sco_id) REFERENCES public.scorm_scos(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lessons_scorm_sco_id_fkey'
    ) THEN
        ALTER TABLE public.lessons 
            ADD CONSTRAINT lessons_scorm_sco_id_fkey 
            FOREIGN KEY (scorm_sco_id) REFERENCES public.scorm_scos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================
-- 4. Add indexes (if not exist)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_scorm_packages_tenant_id ON public.scorm_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scorm_packages_course_id ON public.scorm_packages(course_id);
CREATE INDEX IF NOT EXISTS idx_scorm_scos_package_id ON public.scorm_scos(package_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempts_user_id ON public.scorm_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempts_sco_id ON public.scorm_attempts(sco_id);
CREATE INDEX IF NOT EXISTS idx_scorm_attempts_status ON public.scorm_attempts(lesson_status);
CREATE INDEX IF NOT EXISTS idx_courses_is_scorm ON public.courses(is_scorm);

-- =============================================
-- 5. Add unique constraint for attempts (if not exist)
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scorm_attempts_unique_attempt_per_user'
    ) THEN
        ALTER TABLE public.scorm_attempts 
            ADD CONSTRAINT scorm_attempts_unique_attempt_per_user 
            UNIQUE (user_id, sco_id, attempt_no);
    END IF;
END $$;



