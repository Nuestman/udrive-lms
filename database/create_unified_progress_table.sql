-- Create a unified content progress table that can handle both lessons and quizzes
-- This replaces the need to use lesson_progress for quizzes

CREATE TABLE IF NOT EXISTS content_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL, -- Can be either lesson_id or quiz_id
    content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT, -- For tracking position in content
    UNIQUE(student_id, content_id, content_type)
);

CREATE INDEX idx_content_progress_student_id ON content_progress(student_id);
CREATE INDEX idx_content_progress_content_id ON content_progress(content_id);
CREATE INDEX idx_content_progress_content_type ON content_progress(content_type);

-- Migrate existing lesson_progress data to content_progress
INSERT INTO content_progress (student_id, content_id, content_type, status, started_at, completed_at, time_spent_seconds, last_position)
SELECT 
    student_id, 
    lesson_id as content_id, 
    'lesson' as content_type, 
    status, 
    started_at, 
    completed_at, 
    time_spent_seconds, 
    last_position
FROM lesson_progress
ON CONFLICT (student_id, content_id, content_type) DO NOTHING;

-- Migrate existing quiz completion data to content_progress
-- Only include completed quiz attempts
INSERT INTO content_progress (student_id, content_id, content_type, status, started_at, completed_at, time_spent_seconds)
SELECT DISTINCT
    student_id, 
    quiz_id as content_id, 
    'quiz' as content_type, 
    'completed' as status, 
    started_at, 
    completed_at, 
    0 as time_spent_seconds
FROM quiz_attempts
WHERE status = 'completed'
ON CONFLICT (student_id, content_id, content_type) DO NOTHING;
