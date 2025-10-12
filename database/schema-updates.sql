-- Schema Updates for New Features
-- ⚠️ RUN THIS IN pgAdmin to add missing columns

-- ========================================
-- 1. Add missing columns to tenants table
-- ========================================
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing tenants to be active
UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- ========================================
-- 2. Fix lessons table columns
-- ========================================

-- Add lesson_type column (text, video, document, quiz)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text';

-- Add CHECK constraint for lesson_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lessons_lesson_type_check'
  ) THEN
    ALTER TABLE lessons
    ADD CONSTRAINT lessons_lesson_type_check 
    CHECK (lesson_type IN ('text', 'video', 'document', 'quiz'));
  END IF;
END $$;

-- Add video_url and document_url columns
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Rename duration_minutes to estimated_duration_minutes (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE lessons 
    RENAME COLUMN duration_minutes TO estimated_duration_minutes;
  END IF;
END $$;

-- If column doesn't exist at all, add it
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

-- ========================================
-- 3. Verify the changes
-- ========================================

-- Check tenants table
SELECT 'TENANTS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Check lessons table
SELECT 'LESSONS TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;

-- Summary
SELECT '✅ Schema updates complete!' as status;
