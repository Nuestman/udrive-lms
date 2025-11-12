-- Review Comments Migration
-- Allows staff to respond to learner reviews.

CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author_id ON review_comments(author_id);

CREATE OR REPLACE FUNCTION update_review_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_comments_updated_at
    BEFORE UPDATE ON review_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_review_comments_updated_at();

