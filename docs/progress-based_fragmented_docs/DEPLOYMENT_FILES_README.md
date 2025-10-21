# 📚 Deployment Files Guide

This document explains the essential deployment files in this repository.

## 🎯 Core Deployment Files

### 1. **PRODUCTION_DEPLOYMENT.md**
**Purpose:** Complete guide for deploying to production with Supabase  
**Use:** Main reference for deployment process, troubleshooting, and configuration

### 2. **VERCEL_ENV_FINAL.txt**
**Purpose:** Vercel environment variables (production)  
**Use:** Copy/paste these into Vercel Dashboard → Settings → Environment Variables

**Critical variables:**
- `DATABASE_URL` - Supabase connection (EU West 2, Transaction Pooler)
- `VITE_API_URL` - Your Vercel API URL
- `FRONTEND_URL` - Your Vercel frontend URL
- `JWT_SECRET` - Authentication secret

### 3. **COPY_THIS_TO_ENV.txt**
**Purpose:** Local development environment template  
**Use:** Copy to `.env` file for local development with Supabase

**Key settings:**
- Points to Supabase (EU West 2)
- Uses development mode
- Local URLs (localhost:5000, localhost:5173)

### 4. **QUICK_SUPABASE_DATA_INSERT.sql**
**Purpose:** Essential test data for Supabase  
**Use:** Run in Supabase SQL Editor to create:
- 2 schools/tenants (Premier, Downtown)
- 6 test users (super admin, school admins, instructors, students)
- Sample course with modules and lessons
- Test enrollments

**All passwords:** `password123`

### 5. **supabase_complete_migration.sql**
**Purpose:** Complete database migration (schema + data)  
**Use:** Full database setup for new Supabase project
- Creates all tables, functions, triggers
- Inserts test data
- Ready-to-use database

## 🔧 Modified Core Files

### **database/test-supabase-connection.js**
**Change:** Fixed to check for `tenants` table instead of old `schools` table  
**Purpose:** Test database connectivity and verify tables exist

## 🚀 Quick Setup Guide

### Local Development
1. Copy `COPY_THIS_TO_ENV.txt` to `.env`
2. Run `npm run db:test:supabase` to verify connection
3. Run `npm run dev` to start

### Production (Vercel)
1. Copy variables from `VERCEL_ENV_FINAL.txt` to Vercel Dashboard
2. Update `VITE_API_URL` and `FRONTEND_URL` with your Vercel URL
3. Redeploy
4. Test with credentials from Supabase

## 📊 Current Database Status

**Connection:** Supabase EU West 2  
**Region:** `aws-0-eu-west-2`  
**Mode:** Transaction Pooler (Port 5432)  
**SSL:** Enabled

**Data:**
- ✅ 17 tables
- ✅ 9 users
- ✅ 3 tenants
- ✅ 5 courses
- ✅ 7 modules
- ✅ 5 lessons
- ✅ 3 enrollments

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@udrivelms.com | password123 |
| School Admin | schooladmin@premier.com | password123 |
| Instructor | instructor@premier.com | password123 |
| Student | student1@premier.com | password123 |

## 📝 Important Notes

1. **`.env` is gitignored** - Never commit it to repository
2. **Supabase password:** `uwykGPTyCQo8jRa9` (already URL-encoded in connection strings)
3. **JWT_SECRET:** Same for local and production (for token compatibility)
4. **Region:** EU West 2 (not US East 1)

## 🔄 Switching to Local PostgreSQL (Future)

When ready to use local PostgreSQL instead of Supabase:

1. Remove/comment out `DATABASE_URL` in `.env`
2. Add individual DB parameters:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=udrive-from-bolt
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_local_password
   ```
3. Run schema migrations on local DB

## ⚠️ Security Reminders

- [ ] Change default passwords before production use with real data
- [ ] Use strong JWT_SECRET (current one is fine for now)
- [ ] Never expose Supabase credentials publicly
- [ ] Keep `.env` file secure and never commit it

---

**All set!** 🚀 Your deployment configuration is clean and ready to use.

