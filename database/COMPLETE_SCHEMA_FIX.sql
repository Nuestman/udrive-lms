-- ============================================
-- COMPLETE SCHEMA FIX - All Missing Columns
-- Run this once to fix all table issues
-- ============================================

-- 1. Fix tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- 2. Fix lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Handle duration column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE lessons RENAME COLUMN duration_minutes TO estimated_duration_minutes;
  ELSE
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
  END IF;
END $$;

-- 3. Fix lesson_progress table
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Fix enrollments table (CRITICAL!)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Create goals table if not exists
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_student_id ON goals(student_id);
CREATE INDEX IF NOT EXISTS idx_goals_course_id ON goals(course_id);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Trigger for lesson_progress.updated_at
CREATE OR REPLACE FUNCTION update_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_progress_updated_at_trigger ON lesson_progress;

CREATE TRIGGER lesson_progress_updated_at_trigger
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_progress_updated_at();

-- Trigger for enrollments.updated_at
CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollments_updated_at_trigger ON enrollments;

CREATE TRIGGER enrollments_updated_at_trigger
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollments_updated_at();

-- Trigger for goals.updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goals_updated_at_trigger ON goals;

CREATE TRIGGER goals_updated_at_trigger
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goals_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all tables have required columns
SELECT 
  'tenants' as table_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='updated_at') as has_updated_at,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='is_active') as has_is_active
UNION ALL
SELECT 
  'lessons',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='updated_at'),
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='lesson_type')
UNION ALL
SELECT 
  'lesson_progress',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lesson_progress' AND column_name='updated_at'),
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lesson_progress' AND column_name='created_at')
UNION ALL
SELECT 
  'enrollments',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='updated_at'),
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='created_at')
UNION ALL
SELECT 
  'goals',
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='goals'),
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='updated_at');

SELECT '🎉 ALL SCHEMA FIXES COMPLETE!' as status;

