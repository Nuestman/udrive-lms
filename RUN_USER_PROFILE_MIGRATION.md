# Quick Start: User/Profile Separation Migration

## 🚀 Quick Migration Steps

### Step 1: Backup Your Database
```bash
# PostgreSQL backup
pg_dump -U your_username -d your_database > backup_before_migration.sql

# Or using connection string
pg_dump postgresql://postgres.zrwrdfkntrfqarbidtou:uwykGPTyCQo8jRa9@aws-0-eu-west-2.pooler.supabase.com:5432/postgres > backup_before_migration.sql
```

### Step 2: Run the Migration
```bash
# Option A: Using psql
psql -U your_username -d your_database -f database/user-profiles-migration.sql

# Option B: Using connection string
psql postgresql://postgres.zrwrdfkntrfqarbidtou:uwykGPTyCQo8jRa9@aws-0-eu-west-2.pooler.supabase.com:5432/postgres -f database/user-profiles-migration.sql

# Option C: If using Supabase or similar
# Copy the contents of database/user-profiles-migration.sql
# and run in the SQL editor
```

### Step 3: Verify the Migration

```sql
-- Check 1: All users should have profiles
SELECT COUNT(*) as users_without_profiles 
FROM users u 
LEFT JOIN user_profiles p ON p.user_id = u.id 
WHERE p.id IS NULL;
-- Expected result: 0

-- Check 2: Counts should match
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profiles;
-- Expected: Both numbers should be equal

-- Check 3: Sample data check
SELECT 
    u.id,
    u.email,
    u.role,
    p.first_name,
    p.last_name,
    p.phone
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
LIMIT 5;
-- Expected: Should see data from both tables joined correctly

-- Check 4: Verify columns removed from users
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'avatar_url', 'phone');
-- Expected: 0 rows (these columns should not exist in users anymore)

-- Check 5: Verify view exists
SELECT * FROM users_with_profiles LIMIT 5;
-- Expected: Should show joined data
```

### Step 4: Restart Your Application

```bash
# Backend
cd server
npm restart

# Or using nodemon (should auto-restart)
```

### Step 5: Test Authentication

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "password": "your-test-password"
  }'

# Should return a token and user data with profile info
```

### Step 6: Test User Management

```bash
# Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return users with profile data joined
```

## 🔥 If Something Goes Wrong

### Rollback the Migration

```sql
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

-- Drop the view and helper function
DROP VIEW IF EXISTS users_with_profiles;
DROP FUNCTION IF EXISTS create_user_with_profile;

-- Drop user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

COMMIT;
```

### Restore from Backup

```bash
# Drop current database (CAUTION!)
dropdb your_database

# Create new database
createdb your_database

# Restore from backup
psql -U your_username -d your_database < backup_before_migration.sql
```

## ✅ Success Indicators

After migration, you should see:

1. ✅ Login works normally
2. ✅ User list displays with names and avatars
3. ✅ Creating new users works
4. ✅ Updating user profiles works
5. ✅ All existing functionality intact
6. ✅ No errors in server logs
7. ✅ Frontend displays user data correctly

## 📊 Quick Health Check

Run this comprehensive health check query:

```sql
WITH checks AS (
  SELECT 
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM user_profiles) as profile_count,
    (SELECT COUNT(*) FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE p.id IS NULL) as orphaned_users,
    (SELECT COUNT(*) FROM user_profiles p LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL) as orphaned_profiles,
    (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')) as table_exists,
    (SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'users_with_profiles')) as view_exists
)
SELECT 
  *,
  CASE 
    WHEN user_count = profile_count AND orphaned_users = 0 AND orphaned_profiles = 0 AND table_exists AND view_exists 
    THEN '✅ ALL GOOD!'
    ELSE '⚠️ ISSUES DETECTED'
  END as status
FROM checks;
```

Expected output:
```
user_count | profile_count | orphaned_users | orphaned_profiles | table_exists | view_exists | status
-----------|---------------|----------------|-------------------|--------------|-------------|-------------
     15    |      15       |       0        |         0         |     t        |      t      | ✅ ALL GOOD!
```

## 🎯 What Changed?

### Database
- ✅ `users` table cleaned (auth data only)
- ✅ `user_profiles` table created (profile data)
- ✅ `users_with_profiles` view created (convenience)
- ✅ All data migrated and verified

### Backend
- ✅ `users.service.js` updated with JOINs
- ✅ Create/Update operations use transactions
- ✅ All queries updated to join profiles

### Frontend
- ✅ TypeScript types updated
- ✅ Hooks remain backward compatible
- ✅ **No frontend code changes needed!**

## 📞 Common Questions

**Q: Will this break my existing code?**
A: No! All API responses remain the same. The backend handles the JOIN internally.

**Q: Do I need to update frontend code?**
A: No! The changes are backend-only. Frontend continues to work as-is.

**Q: What if I want to add more profile fields?**
A: Just add them to `user_profiles` table. No need to touch `users` table.

**Q: Can I rollback after running in production?**
A: Yes, but you'll lose any profile data created after migration. Always backup first!

**Q: Is tenant isolation maintained?**
A: Yes! `tenant_id` stays in `users` table. Isolation is enforced through JOINs.

**Q: Will performance be affected?**
A: Minimal impact. Indexes are in place. The JOIN is efficient with proper indexes.

## 🎉 You're Done!

If all checks pass, your system now has:
- ✅ Proper separation of concerns
- ✅ Better security architecture
- ✅ More scalable database design
- ✅ Easier to maintain codebase
- ✅ Foundation for future profile features

---

**Need help?** Check `USER_PROFILE_SEPARATION_COMPLETE.md` for detailed documentation.

