# Vercel Environment Variables Setup

## 🚀 Quick Setup Guide

### Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# ============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================

# Node Environment
NODE_ENV=production

# API Configuration (CRITICAL - DO NOT USE LOCALHOST!)
VITE_API_URL=https://udrive-lms.vercel.app/api

# Database - Supabase Connection String
# Get this from: Supabase Dashboard → Settings → Database → Transaction Pooler (Port 6543)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret (GENERATE NEW FOR PRODUCTION!)
# Use the one generated below or run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60

# JWT Expiration
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://udrive-lms.vercel.app

# TinyMCE (Optional - Get free key from: https://www.tiny.cloud/auth/signup/)
VITE_TINYMCE_API_KEY=your-tinymce-api-key-here

# Supabase Frontend (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## 📋 Step-by-Step Instructions

### 1. Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on **udrive-lms** project
3. Navigate to **Settings** → **Environment Variables**

### 2. Get Your Supabase Connection String

**Option A: Transaction Pooler (Recommended for Vercel)**
1. Go to Supabase Dashboard
2. Select your project
3. **Settings** → **Database**
4. Under **Connection string**, choose **Transaction pooler**
5. Select **URI** tab
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password

Example format:
```
postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Option B: Direct Connection (Alternative)**
```
postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 3. Add Each Variable in Vercel

For EACH variable:
1. Click **Add New**
2. Enter **Key** (e.g., `NODE_ENV`)
3. Enter **Value** (e.g., `production`)
4. Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### 4. Critical Variables (Must Have!)

These are REQUIRED for the app to work:

- ✅ `NODE_ENV` = `production`
- ✅ `VITE_API_URL` = `https://udrive-lms.vercel.app/api`
- ✅ `DATABASE_URL` = Your Supabase connection string
- ✅ `JWT_SECRET` = The long random string above
- ✅ `FRONTEND_URL` = `https://udrive-lms.vercel.app`

### 5. Redeploy After Adding Variables

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click **⋮** (three dots) → **Redeploy**
4. ✅ Check **Use existing Build Cache**
5. Click **Redeploy**

---

## 🔍 Verify Setup

After redeployment, check:

1. **Frontend loads**: https://udrive-lms.vercel.app
2. **API responds**: https://udrive-lms.vercel.app/api/health
3. **Login works**: Try logging in with test credentials

### Test Credentials (From Your Database)
- Super Admin: `admin@udrivelms.com` / `password123`
- School Admin: `schooladmin@premier.com` / `password123`
- Instructor: `instructor@premier.com` / `password123`
- Student: `student1@example.com` / `password123`

---

## 🐛 Troubleshooting

### Still Getting Network Errors?

1. **Check Vercel Logs**:
   - Go to **Deployments** → Click on latest deployment
   - Click **Functions** tab
   - Check for errors in server logs

2. **Verify Environment Variables**:
   - Settings → Environment Variables
   - Make sure `VITE_API_URL` does NOT contain "localhost"

3. **Check Database Connection**:
   - Make sure DATABASE_URL is correct
   - Test connection in Supabase SQL Editor

4. **CORS Issues**:
   - The server is configured to accept requests from your frontend
   - Check server/index.js for CORS settings

### Common Issues

**"NetworkError when attempting to fetch resource"**
- ❌ `VITE_API_URL` is not set or still points to localhost
- ✅ Set to: `https://udrive-lms.vercel.app/api`

**"Database connection failed"**
- ❌ `DATABASE_URL` is incorrect or password is wrong
- ✅ Use Transaction Pooler (port 6543) from Supabase

**"Invalid token" or JWT errors**
- ❌ `JWT_SECRET` is missing
- ✅ Add the generated JWT secret

---

## 📝 Notes

- **Environment variables are cached**: After adding/changing variables, you MUST redeploy
- **Build-time vs Runtime**: Variables starting with `VITE_` are embedded at build time
- **Security**: Never commit `.env` file with production secrets to Git
- **Supabase Pooler**: Always use port 6543 (Transaction Pooler) for serverless environments like Vercel

---

## ✅ Checklist

Before going live:

- [ ] All environment variables added in Vercel
- [ ] Database migrated to Supabase (schema + data)
- [ ] Supabase connection string tested
- [ ] App redeployed after adding variables
- [ ] Login/signup tested on production URL
- [ ] All user roles tested (admin, instructor, student)
- [ ] HTTPS working correctly
- [ ] No console errors in browser

---

## 🆘 Need Help?

If still not working:
1. Check Vercel Function logs
2. Check browser console (F12)
3. Verify all environment variables are set
4. Make sure Supabase database is accessible

