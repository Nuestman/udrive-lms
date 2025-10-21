-- QUICK FIX: Add Missing Columns
-- Copy and paste this into pgAdmin Query Tool

-- Fix tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- Fix lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Check if duration_minutes exists, if so rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE lessons RENAME COLUMN duration_minutes TO estimated_duration_minutes;
  ELSE
    -- Add it if it doesn't exist
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
  END IF;
END $$;

-- Verify
SELECT '✅ Schema fixed!' as status, NOW() as timestamp;

