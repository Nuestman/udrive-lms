# 🚀 Fix Production NOW - Step by Step

## The Problem

❌ Error: "Tenant or user not found"  
✅ This means connection works but database is empty

## The Solution (5 Minutes)

### Step 1: Update Your Local .env File

Create or update `.env` in your project root with this EXACT content:

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60
JWT_EXPIRES_IN=7d
VITE_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:5173
VITE_TINYMCE_API_KEY=no-api-key
```

**Key Change:** Password is now URL-encoded:
- ❌ Old: `:nN9D&GE-%-s5$~M`
- ✅ New: `%3AnN9D%26GE-%25-s5%24~M`

### Step 2: Insert Data into Supabase

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire file `QUICK_SUPABASE_DATA_INSERT.sql` 
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message

This will create:
- ✅ 2 Schools (tenants)
- ✅ 6 Users (super admin, school admins, instructors, students)
- ✅ 1 Sample course with modules and lessons
- ✅ 1 Sample enrollment

### Step 3: Test Locally

```bash
# Test connection
npm run db:test

# Should now show:
# ✅ DATABASE CONNECTION SUCCESSFUL
# Users: 6
# Courses: 1

# Start the app
npm run dev

# Open http://localhost:5173
# Login with: admin@udrivelms.com / password123
```

### Step 4: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add or update these variables:

| Key | Value |
|-----|-------|
| NODE_ENV | `production` |
| DATABASE_URL | `postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| JWT_SECRET | `8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60` |
| JWT_EXPIRES_IN | `7d` |
| VITE_API_URL | `https://your-app.vercel.app/api` |
| FRONTEND_URL | `https://your-app.vercel.app` |

**Important:** Replace `your-app.vercel.app` with your actual Vercel URL!

### Step 5: Redeploy Vercel

1. Go to **Deployments** tab
2. Find latest deployment
3. Click three dots **⋮** → **Redeploy**
4. Click **Redeploy** button
5. Wait 1-2 minutes

### Step 6: Test Production

1. Visit your Vercel URL
2. Try login with: `admin@udrivelms.com` / `password123`
3. Should work! 🎉

## Test Credentials (All use: password123)

| Role | Email | Tenant |
|------|-------|--------|
| Super Admin | admin@udrivelms.com | (none) |
| School Admin | schooladmin@premier.com | Premier Academy |
| Instructor | instructor@premier.com | Premier Academy |
| Student | student1@premier.com | Premier Academy |
| Student | student2@premier.com | Premier Academy |
| School Admin | admin@downtown.com | Downtown Academy |

## Troubleshooting

### Still getting "Tenant or user not found"?

Check if data was inserted:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Check these tables:
   - `tenants` should have 2 rows
   - `user_profiles` should have 6 rows
   - `courses` should have 1 row

If tables are empty, run the SQL script again.

### "Password authentication failed"?

Your DATABASE_URL password is not encoded correctly. 

**Copy this exact line:**
```
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:%3AnN9D%26GE-%25-s5%24~M@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Can't see environment variables in Vercel?

Make sure to select "All Environments" when adding:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Still not working?

1. Check Vercel function logs:
   - Deployments → Click deployment → Functions tab
2. Check browser console (F12):
   - Look for network errors
3. Verify DATABASE_URL in Vercel matches exactly (with encoded password)

## Success Checklist

- [ ] `.env` file updated with encoded password
- [ ] SQL script run in Supabase (6 users created)
- [ ] Local test successful (`npm run db:test`)
- [ ] Can login locally (http://localhost:5173)
- [ ] Vercel environment variables updated
- [ ] Vercel redeployed
- [ ] Can login on production

## What Changed?

**Problem:** Your password `:nN9D&GE-%-s5$~M` has special characters.

In URLs, special characters must be encoded:
- `:` becomes `%3A`
- `&` becomes `%26`
- `%` becomes `%25`
- `$` becomes `%24`

**Without encoding:** PostgreSQL thinks the password ends at the first special character.

**With encoding:** PostgreSQL gets the full, correct password.

## Next Steps After Fix

1. **Change default passwords** for security
2. **Create your real schools** (tenants)
3. **Add your actual users**
4. **Delete test data** if needed
5. **Configure custom domain** (optional)

---

Need more details? See: `PRODUCTION_FIX_COMPLETE.md`

