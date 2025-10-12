-- Fix lesson_progress table - Add missing updated_at column

ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add created_at if missing too
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at
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

SELECT '✅ lesson_progress table fixed!' as status;

