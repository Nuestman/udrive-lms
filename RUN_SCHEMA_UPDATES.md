## 🔧 Schema Updates Required

### Issue Found:
The database schema is missing some columns that the services expect.

### Errors:
1. ❌ `column "contact_email" of relation "tenants" does not exist`
2. ❌ `column "lesson_type" of relation "lessons" does not exist`

---

## ✅ How to Fix

### Step 1: Open pgAdmin

### Step 2: Connect to `udrive-from-bolt` database

### Step 3: Run this SQL:

```sql
-- Add missing columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- Add missing columns to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

-- If you have duration_minutes column, rename it
-- (Only run if you have duration_minutes column, otherwise skip)
-- ALTER TABLE lessons RENAME COLUMN duration_minutes TO estimated_duration_minutes;
```

### Step 4: Verify

```sql
-- Check tenants columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Should show: id, name, subdomain, settings, subscription_tier, subscription_status, 
--              created_at, updated_at, contact_email, contact_phone, address, is_active

-- Check lessons columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;

-- Should show: id, module_id, title, description, content, order_index, status,
--              created_at, updated_at, lesson_type, video_url, document_url, 
--              estimated_duration_minutes
```

---

## Alternative: Use the SQL File

I've created `database/schema-updates.sql` with all updates.

**To run:**
1. Open pgAdmin
2. Open Query Tool
3. Open `database/schema-updates.sql`
4. Click Execute (F5)
5. Check results

---

## After Running Schema Updates:

1. Refresh your browser
2. Try creating a school again
3. Try adding a lesson to a module
4. Both should work! ✅

---

**Run the schema updates and let me know when done!**

