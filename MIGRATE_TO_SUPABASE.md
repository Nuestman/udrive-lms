# 🔄 Migrate Local Database to Supabase

Complete guide to migrate your local PostgreSQL database (with all data) to Supabase.

---

## 📋 Overview

Your situation:
- ✅ Local PostgreSQL with full schema
- ✅ Additional tables beyond seed data
- ✅ Real data you've been working with
- 🎯 Goal: Move everything to Supabase

---

## 🛠️ Method 1: Using pg_dump (Recommended)

### Step 1: Export Your Local Database

```bash
# Export entire database (schema + data)
pg_dump -U postgres -d udrive-from-bolt -F c -f udrive_backup.dump

# Or export as SQL file (more readable)
pg_dump -U postgres -d udrive-from-bolt --clean --if-exists -f udrive_migration.sql
```

**What this does:**
- Exports complete database structure
- Includes all data
- Creates a backup file

### Step 2: Get Supabase Connection String

Go to Supabase Dashboard → Project Settings → Database

**Direct Connection URL (for migration):**
```
postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres
```

⚠️ **Important:** Use the **direct connection** (not pooler) for migration!

### Step 3: Import to Supabase

#### Option A: Using .dump file
```bash
pg_restore -U postgres -h db.zrwrdfkntrfqarbidtou.supabase.co -d postgres -p 5432 udrive_backup.dump
# Enter your Supabase password when prompted
```

#### Option B: Using .sql file
```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -f udrive_migration.sql
```

---

## 🛠️ Method 2: Step-by-Step Migration (More Control)

### Step 1: Export Schema Only

```bash
# Export just the schema
pg_dump -U postgres -d udrive-from-bolt --schema-only -f schema_only.sql
```

### Step 2: Export Data Only

```bash
# Export just the data
pg_dump -U postgres -d udrive-from-bolt --data-only --disable-triggers -f data_only.sql
```

### Step 3: Import Schema to Supabase

```bash
# Import schema first
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -f schema_only.sql
```

### Step 4: Import Data to Supabase

```bash
# Import data
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -f data_only.sql
```

---

## 🛠️ Method 3: Using Supabase CLI (Modern Approach)

### Install Supabase CLI

```bash
# Windows (using npm)
npm install -g supabase

# Verify installation
supabase --version
```

### Link to Your Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref zrwrdfkntrfqarbidtou
```

### Push Database

```bash
# This will sync your local structure to Supabase
supabase db push
```

---

## 🛠️ Method 4: Table-by-Table Migration (Most Control)

If you want to migrate specific tables or have control over the process:

### Step 1: Export Individual Tables

```bash
# Export specific table
pg_dump -U postgres -d udrive-from-bolt -t user_profiles -f user_profiles.sql
pg_dump -U postgres -d udrive-from-bolt -t courses -f courses.sql
pg_dump -U postgres -d udrive-from-bolt -t modules -f modules.sql
# ... repeat for all tables
```

### Step 2: Import to Supabase

```bash
# Import each table
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -f user_profiles.sql
```

---

## 🎯 Quick Migration Script

Save this as `migrate-to-supabase.sh` (Linux/Mac) or `migrate-to-supabase.ps1` (Windows):

### Windows PowerShell Script

```powershell
# migrate-to-supabase.ps1

# Configuration
$LOCAL_DB = "udrive-from-bolt"
$LOCAL_USER = "postgres"
$SUPABASE_URL = "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres"

Write-Host "🚀 Starting database migration..." -ForegroundColor Green

# Step 1: Export local database
Write-Host "📦 Exporting local database..." -ForegroundColor Yellow
pg_dump -U $LOCAL_USER -d $LOCAL_DB --clean --if-exists -f migration_backup.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Export successful!" -ForegroundColor Green
    
    # Step 2: Import to Supabase
    Write-Host "📤 Importing to Supabase..." -ForegroundColor Yellow
    psql $SUPABASE_URL -f migration_backup.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration complete!" -ForegroundColor Green
        Write-Host "🎉 Your database is now on Supabase!" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Import failed. Check error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "❌ Export failed. Check your local database connection." -ForegroundColor Red
}
```

### Run the Script

```bash
# Windows PowerShell
.\migrate-to-supabase.ps1

# Or run commands manually
```

---

## 🔍 Verification Steps

After migration, verify everything:

### 1. Check Tables Exist

```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- user_profiles
- courses
- modules
- lessons
- enrollments
- lesson_progress
- schools
- quiz_questions
- quiz_attempts
- certificates
- And any additional tables you created

### 2. Count Records

```sql
-- Check record counts
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'modules', COUNT(*) FROM modules
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'lesson_progress', COUNT(*) FROM lesson_progress
ORDER BY table_name;
```

Compare with local:
```bash
# Run locally
psql -U postgres -d udrive-from-bolt -c "
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'modules', COUNT(*) FROM modules;
"
```

### 3. Test Queries

```sql
-- Test a complex query
SELECT 
    c.title as course,
    COUNT(e.id) as enrollments,
    COUNT(DISTINCT m.id) as modules,
    COUNT(DISTINCT l.id) as lessons
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN modules m ON c.id = m.course_id
LEFT JOIN lessons l ON m.id = l.module_id
GROUP BY c.id, c.title;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Permission Denied

**Error:** `permission denied for schema public`

**Solution:**
```sql
-- Run in Supabase SQL Editor
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Issue 2: Table Already Exists

**Error:** `relation "table_name" already exists`

**Solution:** Use `--clean` flag in pg_dump:
```bash
pg_dump -U postgres -d udrive-from-bolt --clean --if-exists -f migration.sql
```

### Issue 3: Foreign Key Violations

**Error:** `violates foreign key constraint`

**Solution:** Disable triggers during import:
```bash
pg_dump -U postgres -d udrive-from-bolt --disable-triggers -f migration.sql
```

### Issue 4: Password Authentication Failed

**Error:** `password authentication failed`

**Solution:**
1. Get password from Supabase Dashboard → Settings → Database
2. Or reset database password in Supabase Dashboard

### Issue 5: Connection Timeout

**Error:** `connection timed out`

**Solution:**
- Use direct connection (not pooler) for migration
- Check your internet connection
- Verify Supabase project is active

---

## 📊 Migration Checklist

### Before Migration

- [ ] Backup your local database
- [ ] Get Supabase direct connection URL
- [ ] Get Supabase database password
- [ ] Test connection to Supabase
- [ ] Stop any applications using local database

### During Migration

- [ ] Export local database successfully
- [ ] Check export file size (should have data)
- [ ] Import to Supabase without errors
- [ ] Verify all tables created
- [ ] Verify data imported

### After Migration

- [ ] Count records match
- [ ] Test sample queries
- [ ] Update `.env` with `DATABASE_URL`
- [ ] Test application locally with Supabase
- [ ] Deploy to Vercel
- [ ] Test production application

---

## 🎯 Complete Migration Commands

### Quick Copy-Paste (Update password!)

```bash
# 1. Export local database
pg_dump -U postgres -d udrive-from-bolt --clean --if-exists -f migration.sql

# 2. Import to Supabase (replace [YOUR_PASSWORD])
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -f migration.sql

# 3. Verify
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -c "\dt"

# 4. Count records
psql "postgresql://postgres:[YOUR_PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM user_profiles;"
```

---

## 🔒 Security Notes

### Database Password

**Get from Supabase:**
1. Go to Settings → Database
2. Click "Reset database password" if you forgot it
3. Save the new password securely

**Never commit password to git!**

### After Migration

Update your `.env`:
```env
# Remove these (local)
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=udrive-from-bolt
# DATABASE_USER=postgres
# DATABASE_PASSWORD=453241945

# Add this (Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 🧪 Test Migration Locally First

Before deploying:

```bash
# 1. Update .env to use Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.zrwrdfkntrfqarbidtou.supabase.co:5432/postgres"

# 2. Test connection
npm run db:test:supabase

# 3. Run application
npm run dev

# 4. Test all features
# - Login
# - View courses
# - Create course
# - Enroll student
# - Complete lesson
# - Check progress
```

---

## 📞 Need Help?

If migration fails:

1. **Check logs** - Import shows detailed errors
2. **Verify password** - Most common issue
3. **Use direct connection** - Not pooler for migration
4. **Check file size** - Export should have data
5. **Try table-by-table** - If full migration fails

---

## ✅ Success Indicators

Migration is successful when:
- ✅ All tables exist in Supabase
- ✅ Record counts match local database
- ✅ Application works with Supabase connection
- ✅ No foreign key errors
- ✅ Can login and use all features

---

## 🎉 After Successful Migration

1. **Update Vercel Environment Variables:**
   ```env
   DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **Deploy to Vercel**
   - Vercel will auto-deploy from GitHub
   - Or manually trigger deployment

3. **Test Production**
   - Visit your Vercel URL
   - Test login
   - Verify all features work

4. **Celebrate! 🎉**
   - Your app is now fully cloud-hosted
   - No local dependencies
   - Production ready!

---

**Ready to migrate? Start with Method 1 (pg_dump) - it's the easiest!**

