# ✅ Add Lesson Fixed!

## Issue:
`invalid input syntax for type json` - The `content` field was being passed as empty string `''` instead of valid JSON.

## Fix Applied:
Changed `content || ''` to `content || '[]'` in the INSERT query.

The lessons table has a `content JSONB` column that expects JSON array (for block editor), not an empty string.

---

## What Changed:

### Before (caused error):
```javascript
[module_id, title, content || '', lesson_type || 'text', ...]
//                        ^^  Empty string breaks JSONB!
```

### After (fixed):
```javascript
[module_id, title, content || '[]', lesson_type || 'text', video_url || null, ...]
//                        ^^^^  Valid JSON array
//                                                    ^^^^  null instead of undefined
```

---

## Test Now:

1. Refresh browser (Ctrl+R)
2. Go to Course Details
3. Expand a module
4. Click "+ Add Lesson"
5. Type lesson name
6. Click "Add"
7. Should work! ✅

---

## Backend Will Show:
```
POST /api/lessons
🔒 Tenant Isolation: {tenant_id}
Executed query { INSERT INTO lessons... }
rows: 1
✅ Success!
```

---

## If Still Failing:

Check if you ran the schema updates in pgAdmin:
```sql
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
```

---

**Lesson creation should work perfectly now!** 🎉

Try adding a lesson - it will work!

