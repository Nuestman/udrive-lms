-- Reviews Table Migration
-- Supports platform, course, and school reviews with moderation workflow

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewable_type TEXT NOT NULL CHECK (reviewable_type IN ('platform', 'course', 'school')),
    reviewable_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure reviewable_id usage matches the type (NULL for platform, NOT NULL otherwise)
ALTER TABLE reviews
    ADD CONSTRAINT chk_reviews_reviewable_id
    CHECK (
        (reviewable_type = 'platform' AND reviewable_id IS NULL)
        OR (reviewable_type IN ('course', 'school') AND reviewable_id IS NOT NULL)
    );

-- Unique active review per user per target (pending/approved)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_active
    ON reviews (
        user_id,
        reviewable_type,
        COALESCE(reviewable_id, '00000000-0000-0000-0000-000000000000'::UUID)
    )
    WHERE status IN ('pending', 'approved');

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewable_type ON reviews(reviewable_type);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Trigger to maintain updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Trigger to enforce existence of referenced course/school IDs
CREATE OR REPLACE FUNCTION ensure_reviewable_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reviewable_type = 'course' THEN
        PERFORM 1 FROM courses WHERE id = NEW.reviewable_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course with id % does not exist', NEW.reviewable_id;
        END IF;
    ELSIF NEW.reviewable_type = 'school' THEN
        PERFORM 1 FROM tenants WHERE id = NEW.reviewable_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'School (tenant) with id % does not exist', NEW.reviewable_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_reviewable_exists
    BEFORE INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION ensure_reviewable_exists();


