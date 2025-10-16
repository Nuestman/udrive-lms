-- =====================================================
-- USER PROFILES SEPARATION MIGRATION
-- =====================================================
-- This migration separates authentication (users) from profile data (user_profiles)
-- Following security best practices for data separation
--
-- IMPORTANT: Run this migration AFTER you've already renamed user_profiles to users
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 0: Drop existing user_profiles if it exists (from previous work)
-- =====================================================
-- This is safe because we're migrating data from users table
DROP TABLE IF EXISTS user_profiles CASCADE;

-- =====================================================
-- STEP 1: Create the new user_profiles table
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Profile Information
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    date_of_birth DATE,
    
    -- Address Information
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Emergency Contact Information
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    emergency_contact_email TEXT,
    
    -- Guardian Information (for minor students)
    guardian_name TEXT,
    guardian_email TEXT,
    guardian_phone TEXT,
    guardian_relationship TEXT,
    guardian_address TEXT,
    
    -- Additional Profile Data
    nationality TEXT,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    
    -- User-editable preferences (non-system settings)
    profile_preferences JSONB DEFAULT '{}',
    
    -- Social/Professional Links
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_last_name ON user_profiles(last_name);
CREATE INDEX idx_user_profiles_date_of_birth ON user_profiles(date_of_birth);

-- =====================================================
-- STEP 2: Migrate existing data from users to user_profiles
-- =====================================================
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    avatar_url,
    phone,
    created_at,
    updated_at
)
SELECT 
    id,
    first_name,
    last_name,
    avatar_url,
    phone,
    created_at,
    updated_at
FROM users
ON CONFLICT (user_id) DO NOTHING; -- Skip if already exists

-- =====================================================
-- STEP 3: Remove profile columns from users table
-- =====================================================
-- These columns now live in user_profiles
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- =====================================================
-- STEP 4: Create trigger for updated_at on user_profiles
-- =====================================================
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: Create a view for easy querying (OPTIONAL)
-- =====================================================
-- This view joins users with their profiles for convenient querying
CREATE OR REPLACE VIEW users_with_profiles AS
SELECT 
    u.id,
    u.tenant_id,
    u.email,
    u.role,
    u.is_active,
    u.last_login,
    u.settings,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    
    -- Profile fields
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.phone,
    p.bio,
    p.date_of_birth,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state_province,
    p.postal_code,
    p.country,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.emergency_contact_relationship,
    p.emergency_contact_email,
    p.guardian_name,
    p.guardian_email,
    p.guardian_phone,
    p.guardian_relationship,
    p.guardian_address,
    p.nationality,
    p.preferred_language,
    p.timezone,
    p.profile_preferences,
    p.linkedin_url,
    p.twitter_url,
    p.website_url,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id;

-- =====================================================
-- STEP 6: Create helper function to create user with profile
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_with_profile(
    p_tenant_id UUID,
    p_email TEXT,
    p_password_hash TEXT,
    p_role TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    profile_id UUID
) AS $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    -- Insert user
    INSERT INTO users (tenant_id, email, password_hash, role)
    VALUES (p_tenant_id, p_email, p_password_hash, p_role)
    RETURNING id INTO v_user_id;
    
    -- Insert profile
    INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url)
    VALUES (v_user_id, p_first_name, p_last_name, p_phone, p_avatar_url)
    RETURNING id INTO v_profile_id;
    
    RETURN QUERY SELECT v_user_id, v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify success:

-- Check all users have profiles
-- SELECT COUNT(*) as users_without_profiles 
-- FROM users u 
-- LEFT JOIN user_profiles p ON p.user_id = u.id 
-- WHERE p.id IS NULL;

-- Check data integrity
-- SELECT 
--     (SELECT COUNT(*) FROM users) as total_users,
--     (SELECT COUNT(*) FROM user_profiles) as total_profiles,
--     (SELECT COUNT(*) FROM users_with_profiles) as joined_count;

COMMIT;

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================
-- If something goes wrong, you can rollback by:
-- 1. Adding columns back to users table
-- 2. Copying data from user_profiles back to users
-- 3. Dropping user_profiles table
-- 
-- IMPORTANT: Only use this if migration fails!
-- =====================================================

/*
BEGIN;

-- Add columns back to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Copy data back from user_profiles to users
UPDATE users u
SET 
    first_name = p.first_name,
    last_name = p.last_name,
    avatar_url = p.avatar_url,
    phone = p.phone
FROM user_profiles p
WHERE u.id = p.user_id;

-- Drop the view and function
DROP VIEW IF EXISTS users_with_profiles;
DROP FUNCTION IF EXISTS create_user_with_profile;

-- Drop user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

COMMIT;
*/

