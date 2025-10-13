# 🚨 Production Fix Guide - Supabase Connection & Authentication

## Problem Diagnosis ✅

The error **"Tenant or user not found"** means:
- ✅ Database connection is WORKING
- ❌ Missing tenants and users in the database
- ❌ Password special characters need URL encoding

## Quick Fix Steps

### Step 1: Fix Your Password in DATABASE_URL

Your password is: `:nN9D&GE-%-s5$~M`

This contains special characters that MUST be URL-encoded:

```
Original:  :nN9D&GE-%-s5$~M
Encoded:   %3AnN9D%26GE-%25-s5%24~M
```

**Your correct DATABASE_URL format:**

```bash
# Transaction Pooler (Port 6543 - Recommended for Vercel)
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Direct Connection (Port 5432 - For local testing/migrations)
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Character Encoding Reference:**
- `:` → `%3A`
- `&` → `%26`
- `%` → `%25`
- `$` → `%24`
- `~` → `~` (no encoding needed)
- `-` → `-` (no encoding needed)

### Step 2: Insert Essential Data into Supabase

Your database has the schema but is missing tenants and users. Run this SQL in Supabase SQL Editor:

Go to: **Supabase Dashboard → SQL Editor → New Query**

Copy and paste this complete SQL:

```sql
-- =============================================
-- UDRIVE LMS - ESSENTIAL PRODUCTION DATA
-- Run this in Supabase SQL Editor
-- =============================================

-- Clear existing data (if any)
TRUNCATE TABLE lesson_progress, enrollments, lessons, modules, courses, user_profiles, tenants RESTART IDENTITY CASCADE;

-- =============================================
-- 1. INSERT TENANTS (Schools)
-- =============================================

INSERT INTO tenants (id, name, subdomain, settings, subscription_tier, subscription_status, is_active, contact_email) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Premier Driving Academy', 'premier', '{"theme": "blue"}', 'premium', 'active', true, 'info@premier.com'),
('36b2ae0d-c53c-47d7-9e80-71c933a1cc2a', 'Downtown Driving Academy', 'downtown', '{}', 'basic', 'active', true, 'info@downtown.com');

-- =============================================
-- 2. INSERT USERS (All passwords: password123)
-- =============================================

-- Password hash for "password123"
-- Generated with: bcrypt.hash('password123', 10)
INSERT INTO user_profiles (id, tenant_id, email, password_hash, first_name, last_name, role, is_active) VALUES

-- Super Admin (No tenant - manages everything)
('67e0428c-44fd-4fc8-b195-ffe33c2366bb', NULL, 'admin@udrivelms.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Super', 'Admin', 'super_admin', true),

-- Premier Academy Users
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'schooladmin@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Sarah', 'Johnson', 'school_admin', true),

('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'instructor@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'John', 'Smith', 'instructor', true),

('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'student1@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Michael', 'Chen', 'student', true),

('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'student2@premier.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Emily', 'Rodriguez', 'student', true),

-- Downtown Academy Users
('ac5b9b0c-23b0-46dc-9a64-1aa2c24611a3', '36b2ae0d-c53c-47d7-9e80-71c933a1cc2a', 'admin@downtown.com', '$2b$10$I3E5zmQo9hAzGbyffKMm0OzpDBLZHb73E6G.hf9Lndna81cdeNgYm', 'Alex', 'Downtown', 'school_admin', true);

-- =============================================
-- 3. INSERT SAMPLE COURSE
-- =============================================

INSERT INTO courses (id, tenant_id, title, description, status, duration_weeks, price, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Basic Driving Course', 'Learn the fundamentals of safe driving including traffic laws, vehicle operation, and defensive driving techniques.', 'published', 6, 499.99, '660e8400-e29b-41d4-a716-446655440003');

-- =============================================
-- 4. INSERT SAMPLE MODULE
-- =============================================

INSERT INTO modules (id, course_id, title, description, order_index, estimated_duration_minutes) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Introduction to vehicle controls and basic operations', 1, 120);

-- =============================================
-- 5. INSERT SAMPLE LESSONS
-- =============================================

INSERT INTO lessons (id, module_id, title, description, content, order_index, estimated_duration_minutes, status, lesson_type) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Vehicle Controls', 'Understanding all vehicle controls and their functions', '[]', 1, 30, 'published', 'text'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Safety Check', 'Pre-driving safety inspection procedures', '[]', 2, 20, 'published', 'text');

-- =============================================
-- 6. INSERT SAMPLE ENROLLMENT
-- =============================================

INSERT INTO enrollments (id, student_id, course_id, status, progress_percentage) VALUES
('e6a30b4d-c163-482d-8497-6d7881fc4e94', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'active', 0);

-- =============================================
-- 7. VERIFY DATA
-- =============================================

SELECT 'Tenants:', COUNT(*) FROM tenants;
SELECT 'Users:', COUNT(*) FROM user_profiles;
SELECT 'Courses:', COUNT(*) FROM courses;
SELECT 'Modules:', COUNT(*) FROM modules;
SELECT 'Lessons:', COUNT(*) FROM lessons;
SELECT 'Enrollments:', COUNT(*) FROM enrollments;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT '✅ Data inserted successfully!' AS status;
```

### Step 3: Update Your Local .env File

Create or update `.env` file in your project root:

```env
# ==============================================
# UDrive LMS - Local .env with Supabase
# ==============================================

NODE_ENV=development

# Supabase Connection (with URL-encoded password)
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret (use same in production)
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60
JWT_EXPIRES_IN=7d

# Local development URLs
VITE_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:5173

# TinyMCE (optional)
VITE_TINYMCE_API_KEY=no-api-key
```

### Step 4: Update Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add/update:

```bash
# Critical Variables
NODE_ENV=production
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60
JWT_EXPIRES_IN=7d

# Frontend/API URLs (replace with your actual Vercel URL)
VITE_API_URL=https://your-app.vercel.app/api
FRONTEND_URL=https://your-app.vercel.app

# Optional
VITE_TINYMCE_API_KEY=no-api-key
```

**Important:** After adding variables, click "Redeploy" in Vercel!

## Test Credentials

After running the SQL above, use these to login:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@udrivelms.com | password123 |
| School Admin | schooladmin@premier.com | password123 |
| Instructor | instructor@premier.com | password123 |
| Student | student1@premier.com | password123 |

## Verification Steps

### 1. Test Locally

```bash
# Test database connection
npm run db:test

# Start the app
npm run dev

# Try logging in at http://localhost:5173
```

### 2. Test on Production

After redeploying Vercel:
1. Visit your Vercel URL
2. Try login with any credential above
3. Should see dashboard

## Common Issues & Solutions

### Issue: "password authentication failed"
**Fix:** Your DATABASE_URL password is not URL-encoded correctly.
- Use: `%3AnN9D%26GE-%25-s5%24~M`
- Not: `:nN9D&GE-%-s5$~M`

### Issue: Still says "Tenant or user not found"
**Fix:** SQL insert didn't run successfully.
1. Go to Supabase SQL Editor
2. Run: `SELECT COUNT(*) FROM tenants;`
3. Should return at least 2
4. Run: `SELECT COUNT(*) FROM user_profiles;`
5. Should return at least 6

### Issue: "Connection timeout"
**Fix:** Use Transaction Pooler (port 6543) not Direct Connection (port 5432) for Vercel.

### Issue: "Invalid token"
**Fix:** Make sure JWT_SECRET is the SAME in:
- Your local .env
- Your Vercel environment variables

## URL Encoding Tool

If you need to encode other passwords, use this Node.js command:

```bash
node -e "console.log(encodeURIComponent('your-password-here'))"
```

Or use online tool: https://www.urlencoder.org/

## Success Checklist

- [ ] Password URL-encoded in DATABASE_URL
- [ ] SQL data inserted into Supabase (run the SQL above)
- [ ] Local .env file updated with encoded password
- [ ] Vercel environment variables updated
- [ ] Vercel app redeployed
- [ ] Can login locally with test credentials
- [ ] Can login on production with test credentials

## Next Steps After Fix

Once working:
1. Change default passwords
2. Create your actual schools/tenants
3. Add your real users
4. Configure TinyMCE API key (optional)
5. Set up custom domain (optional)

---

**Need more help?** Check the deployment logs in Vercel Dashboard → Deployments → View Function Logs

