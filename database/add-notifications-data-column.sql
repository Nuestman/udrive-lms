-- Add data column to notifications table
-- This allows storing additional metadata with notifications

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'data';

