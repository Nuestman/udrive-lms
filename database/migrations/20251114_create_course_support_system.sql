-- Course Support Questions & Replies System
-- Allows students to ask questions and receive answers from instructors and other students

CREATE TABLE IF NOT EXISTS course_support_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('course_content', 'certificates', 'resources', 'technical', 'other')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved', 'closed')),
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_questions_course_id ON course_support_questions(course_id);
CREATE INDEX idx_support_questions_student_id ON course_support_questions(student_id);
CREATE INDEX idx_support_questions_lesson_id ON course_support_questions(lesson_id);
CREATE INDEX idx_support_questions_status ON course_support_questions(status);
CREATE INDEX idx_support_questions_category ON course_support_questions(category);
CREATE INDEX idx_support_questions_created_at ON course_support_questions(created_at DESC);
CREATE INDEX idx_support_questions_last_reply_at ON course_support_questions(last_reply_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS course_support_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES course_support_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_answer BOOLEAN DEFAULT false, -- Marked as the accepted answer
    is_instructor_reply BOOLEAN DEFAULT false, -- Reply from course instructor/admin
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_replies_question_id ON course_support_replies(question_id);
CREATE INDEX idx_support_replies_user_id ON course_support_replies(user_id);
CREATE INDEX idx_support_replies_created_at ON course_support_replies(created_at DESC);
CREATE INDEX idx_support_replies_is_answer ON course_support_replies(is_answer) WHERE is_answer = true;

-- Update question reply_count and last_reply_at when a reply is added
CREATE OR REPLACE FUNCTION update_question_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE course_support_questions
    SET 
        reply_count = (
            SELECT COUNT(*) 
            FROM course_support_replies 
            WHERE question_id = NEW.question_id
        ),
        last_reply_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.question_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_reply_stats
AFTER INSERT ON course_support_replies
FOR EACH ROW
EXECUTE FUNCTION update_question_reply_stats();

-- Update question status when an answer is marked
CREATE OR REPLACE FUNCTION update_question_status_on_answer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_answer = true THEN
        UPDATE course_support_questions
        SET 
            status = 'answered',
            updated_at = NOW()
        WHERE id = NEW.question_id AND status = 'open';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_status_on_answer
AFTER UPDATE OF is_answer ON course_support_replies
FOR EACH ROW
WHEN (NEW.is_answer = true AND OLD.is_answer = false)
EXECUTE FUNCTION update_question_status_on_answer();

-- Update view count function (to be called from application)
CREATE OR REPLACE FUNCTION increment_question_view_count(question_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE course_support_questions
    SET view_count = view_count + 1
    WHERE id = question_uuid;
END;
$$ LANGUAGE plpgsql;

-- Table for question and reply attachments
CREATE TABLE IF NOT EXISTS course_support_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES course_support_questions(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES course_support_replies(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_attachment_reference CHECK (
        (question_id IS NOT NULL AND reply_id IS NULL) OR
        (question_id IS NULL AND reply_id IS NOT NULL)
    )
);

CREATE INDEX idx_support_attachments_question_id ON course_support_attachments(question_id);
CREATE INDEX idx_support_attachments_reply_id ON course_support_attachments(reply_id);

