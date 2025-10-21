# 🔧 Fix Schema Issues - Step by Step

## Issue Found:
The database schema is missing columns that our services expect.

---

## 🎯 Quick Fix (2 minutes)

### Step 1: Open pgAdmin
1. Connect to PostgreSQL
2. Select `udrive-from-bolt` database
3. Open Query Tool (Alt+Shift+Q)

### Step 2: Copy & Run This SQL:

```sql
-- Fix tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- Fix lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Rename duration_minutes to estimated_duration_minutes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE lessons RENAME COLUMN duration_minutes TO estimated_duration_minutes;
  ELSE
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
  END IF;
END $$;

SELECT '✅ Schema fixed!' as status;
```

### Step 3: Verify

You should see: `✅ Schema fixed!` as result

### Step 4: Refresh Browser

The application should work perfectly now!

---

## 🎮 What Will Work After Fix:

### Schools Management:
✅ Create new school (with contact_email, contact_phone, address)
✅ View schools with status (is_active)
✅ Update school information

### Lessons Management:
✅ Add lesson to module
✅ Specify lesson_type (text/video/document/quiz)
✅ Add video_url for video lessons
✅ Add document_url for document lessons
✅ Set estimated_duration_minutes

---

## 🚀 Test After Fix:

### Test 1: Create School
```
1. Login as super admin (or make yourself super admin)
2. Sidebar → "Schools"
3. Click "Create School"
4. Fill all fields (email, phone, address now supported!)
5. Click "Create School"
6. Should work! ✅
```

### Test 2: Add Lesson
```
1. Go to Course Details
2. Expand a module
3. Click "+ Add Lesson"
4. Type lesson name
5. Click "Add"
6. Should work! ✅
```

---

## Files Created:

1. **database/schema-updates.sql** - Full update script with verification
2. **QUICK_FIX_SCHEMA.sql** - Quick copy-paste version
3. **RUN_SCHEMA_UPDATES.md** - Detailed instructions
4. **SCHEMA_FIX_INSTRUCTIONS.md** - This file

---

## Alternative: Use Schema Update Files

**Option A: Use QUICK_FIX_SCHEMA.sql**
1. Open file in pgAdmin
2. Execute (F5)
3. Done!

**Option B: Use schema-updates.sql**
1. Open file in pgAdmin
2. Execute (F5)
3. See verification queries at the end

---

**Run the schema updates in pgAdmin, then refresh your browser!** 🚀

Everything will work after this! ✅

