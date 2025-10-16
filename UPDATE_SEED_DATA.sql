-- Update Seed Data for Tenant Isolation Compliance
-- This script ensures all seeded data complies with new tenant isolation rules

-- 1. Verify super admin user (should NOT have tenant_id or can have special tenant)
-- Option A: Super admin with NO tenant (recommended for true global access)
UPDATE users 
SET tenant_id = NULL 
WHERE role = 'super_admin' AND email = 'admin@udrivelms.com';

-- Option B: Keep super admin in a tenant but they bypass filters (current setup)
-- No change needed - middleware handles this

-- 2. Ensure all other users have valid tenant_id
-- Check for orphaned users
SELECT id, email, role, tenant_id 
FROM users 
WHERE role != 'super_admin' AND tenant_id IS NULL;
-- If any found, assign them to default tenant

-- 3. Ensure all courses have valid tenant_id
SELECT id, title, tenant_id 
FROM courses 
WHERE tenant_id IS NULL;
-- Should be empty

-- 4. Create a second test school for multi-tenant testing (optional)
-- NOTE: First run QUICK_FIX_SCHEMA.sql to add missing columns!
-- Then uncomment and run this:

INSERT INTO tenants (name, subdomain, contact_email, is_active)
VALUES (
  'Downtown Driving Academy',
  'downtown-academy',
  'info@downtown-academy.com',
  true
)
ON CONFLICT (subdomain) DO NOTHING;


-- 5. Verify all enrollments link to courses with valid tenant_id
SELECT e.id, e.student_id, e.course_id, c.tenant_id
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
WHERE c.id IS NULL OR c.tenant_id IS NULL;
-- Should be empty

-- 6. Summary query - Verify data integrity
SELECT 
  'Tenants' as entity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM tenants
UNION ALL
SELECT 
  'Users' as entity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM users
UNION ALL
SELECT 
  'Courses' as entity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'published') as active
FROM courses
UNION ALL
SELECT 
  'Enrollments' as entity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active
FROM enrollments;

-- 7. Tenant isolation check - Ensure no orphaned data
SELECT 
  'Users without tenant (non-super admin)' as check_name,
  COUNT(*) as count
FROM users
WHERE role != 'super_admin' AND tenant_id IS NULL

UNION ALL

SELECT 
  'Courses without tenant' as check_name,
  COUNT(*) as count
FROM courses
WHERE tenant_id IS NULL

UNION ALL

SELECT 
  'Enrollments with invalid courses' as check_name,
  COUNT(*) as count
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
WHERE c.id IS NULL;

-- Expected result: All counts should be 0

