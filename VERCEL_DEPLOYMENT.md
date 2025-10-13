# 🚀 Vercel Deployment Guide - UDrive LMS

## Frontend Deployment to Vercel

Complete guide for deploying the UDrive LMS frontend to Vercel.

---

## 📋 Required Environment Variables for Vercel

### Production Environment Variables

Set these in your Vercel project settings:

```env
# API Configuration
VITE_API_URL=https://your-backend-url.railway.app/api

# Supabase Configuration (Optional - for future features)
VITE_SUPABASE_URL=https://zrwrdfkntrfqarbidtou.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3JkZmtudHJmcWFyYmlkdG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDIyNDgsImV4cCI6MjA2Nzg3ODI0OH0.QlEzPw9vXhNrmNtsVHeIGvxrKAR_NOGAjiZYpeYwsNE

# TinyMCE (Rich Text Editor)
VITE_TINYMCE_API_KEY=your-tinymce-api-key-here
```

---

## ✅ Correct Vercel Environment Variables

Based on your setup, here's what you need:

### Required Variables (Frontend Only)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-backend.railway.app/api` | Your backend API URL |
| `VITE_SUPABASE_URL` | `https://zrwrdfkntrfqarbidtou.supabase.co` | ✅ You have this |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ You have this |
| `VITE_TINYMCE_API_KEY` | Get from tiny.cloud | Optional for now |

### ❌ Don't Include These in Vercel (Backend Only)

These are for your backend server, NOT Vercel frontend:

- ❌ `DATABASE_URL` - Backend only
- ❌ `DATABASE_HOST` - Backend only
- ❌ `DATABASE_PORT` - Backend only
- ❌ `DATABASE_NAME` - Backend only
- ❌ `DATABASE_USER` - Backend only
- ❌ `DATABASE_PASSWORD` - Backend only
- ❌ `JWT_SECRET` - Backend only
- ❌ `NODE_ENV` - Backend only
- ❌ `PORT` - Backend only
- ❌ `FRONTEND_URL` - Backend only

---

## 🎯 Step-by-Step Deployment

### Step 1: Deploy Backend First (Railway)

Before deploying frontend, deploy your backend:

1. Go to [Railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub
3. Select your repository
4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   NODE_ENV=production
   JWT_SECRET=your_secure_jwt_secret_here
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   ```
5. **Build Command**: Leave default
6. **Start Command**: `npm run dev:server` or `node server/index.js`
7. Click **Deploy**
8. Copy your Railway URL: `https://your-app.up.railway.app`

### Step 2: Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com)
2. **New Project**
3. Import your GitHub repository
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`

### Step 3: Set Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables**

Add these:

```
Name: VITE_API_URL
Value: https://your-app.up.railway.app/api
Environment: Production

Name: VITE_SUPABASE_URL
Value: https://zrwrdfkntrfqarbidtou.supabase.co
Environment: Production

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyd3JkZmtudHJmcWFyYmlkdG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDIyNDgsImV4cCI6MjA2Nzg3ODI0OH0.QlEzPw9vXhNrmNtsVHeIGvxrKAR_NOGAjiZYpeYwsNE
Environment: Production
```

**Important:** Make sure variable names start with `VITE_` for Vite to include them in the build!

### Step 4: Deploy

Click **Deploy** and wait for build to complete.

---

## 🔧 Troubleshooting

### Build Fails with "Expected }" Error

**Fixed!** This was a JavaScript syntax error with apostrophes. Already fixed in the code.

### Environment Variables Not Working

**Cause:** Vite only includes variables that start with `VITE_`

**Solution:** 
- ✅ Correct: `VITE_API_URL`
- ❌ Wrong: `API_URL`

### CORS Errors

**Cause:** Backend not allowing your Vercel domain

**Solution:** In Railway, set `FRONTEND_URL`:
```
FRONTEND_URL=https://your-app.vercel.app
```

### API Calls Fail

**Check:**
1. `VITE_API_URL` ends with `/api`
2. Backend is deployed and running
3. Backend URL is accessible (visit `/health`)

### Build Succeeds but App Doesn't Load

**Check Browser Console:**
1. Check for API URL errors
2. Verify environment variables are set
3. Check Network tab for failed requests

---

## 📊 Verification Checklist

After deployment:

### Backend (Railway)
- [ ] Backend is deployed and running
- [ ] Visit: `https://your-backend.railway.app/health`
- [ ] Should return: `{"status":"ok"}`
- [ ] Environment variables are set
- [ ] Database connection works

### Frontend (Vercel)
- [ ] Frontend builds successfully
- [ ] Environment variables are set (check build logs)
- [ ] Site loads at: `https://your-app.vercel.app`
- [ ] Can access login page
- [ ] No console errors

### Integration
- [ ] Can login (test with seed users)
- [ ] Can see courses
- [ ] API calls work
- [ ] No CORS errors
- [ ] Celebrations work 🎉

---

## 🔄 After Deployment

### Update Backend CORS

In your Railway backend, ensure `FRONTEND_URL` matches your Vercel URL:

```env
FRONTEND_URL=https://your-app.vercel.app
```

This allows your frontend to call your backend API.

### Test Login

Try logging in with seed data:
```
Email: superadmin@udrive.com
Password: Admin123!
```

---

## 📝 Environment Variables Reference

### Frontend (Vercel) - VITE_ prefix required

```env
VITE_API_URL              # Backend API endpoint
VITE_SUPABASE_URL         # Supabase project URL
VITE_SUPABASE_ANON_KEY    # Supabase anonymous key
VITE_TINYMCE_API_KEY      # TinyMCE editor (optional)
```

### Backend (Railway) - No prefix needed

```env
DATABASE_URL              # PostgreSQL/Supabase connection
NODE_ENV                  # production
JWT_SECRET                # Secure random string
FRONTEND_URL              # Your Vercel URL
PORT                      # 5000 (default)
```

---

## 🎯 Quick Deploy Commands

### Commit and Push Fixes

```bash
git add .
git commit -m "fix: Remove apostrophe syntax error for Vercel build"
git push origin main
```

Vercel will auto-deploy from GitHub on push!

---

## 🚀 Alternative: Deploy Both to Vercel

You can also deploy both frontend and backend to Vercel:

### Backend as Vercel Serverless Function

**Not recommended for this project** because:
- Express server is not serverless-ready
- Database connections need modification
- More complex setup

**Better approach:**
- Frontend → Vercel (static/fast)
- Backend → Railway/Render (Express/database)

---

## 📞 Support

If deployment fails:

1. Check build logs in Vercel dashboard
2. Verify all environment variables
3. Test backend separately
4. Check browser console for errors

---

## ✅ Success Checklist

- [ ] Backend deployed to Railway
- [ ] Backend health check works
- [ ] Frontend environment variables set in Vercel
- [ ] Frontend builds successfully
- [ ] Frontend deploys to Vercel
- [ ] Can access frontend URL
- [ ] Can login to system
- [ ] API calls work
- [ ] No CORS errors
- [ ] Celebrations work! 🎉

---

**Your UDrive LMS is now LIVE! 🚀**

