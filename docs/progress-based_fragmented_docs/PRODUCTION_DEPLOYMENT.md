# 🚀 Production Deployment Guide - UDrive LMS

Complete guide for deploying UDrive LMS to production with Supabase PostgreSQL.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Supabase Setup](#supabase-setup)
- [Database Migration](#database-migration)
- [Environment Configuration](#environment-configuration)
- [Local Testing with Supabase](#local-testing-with-supabase)
- [Deployment Options](#deployment-options)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### Required Accounts
- [ ] Supabase account ([signup here](https://supabase.com))
- [ ] Hosting service (Vercel, Railway, Render, or similar)
- [ ] Domain name (optional)

### Local Requirements
- [ ] Node.js 18+
- [ ] Git
- [ ] PostgreSQL client (psql) for migrations

---

## ☁️ Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `udrive-lms-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for project to provision

### 2. Get Connection Details

Go to **Project Settings** → **Database**

#### Connection String (Pooler - Recommended)
```
postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Copy this! Add `?pgbouncer=true` at the end for connection pooling.

#### Direct Connection (For Migrations)
```
postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

### 3. Note Your API Credentials

Go to **Project Settings** → **API**

- **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
- **anon public key**: `eyJhbGciOiJI...` (copy full key)

---

## 🗄 Database Migration

### Option 1: SQL Editor (Recommended)

1. In Supabase Dashboard, go to **SQL Editor**
2. Create **New Query**
3. Copy your entire `database/schema.sql` file
4. Click **Run**
5. Wait for success message
6. Repeat for `database/seed.sql` (if you want test data)

### Option 2: Command Line (psql)

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Run schema
psql $DATABASE_URL -f database/schema.sql

# Run seeds (optional)
psql $DATABASE_URL -f database/seed.sql
```

### Option 3: Node.js Script

Update `database/run-schema.js` with Supabase connection:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rest of script...
```

Then run:
```bash
DATABASE_URL="your-supabase-url" node database/run-schema.js
```

### Verify Database

In Supabase Dashboard → **Table Editor**, you should see:
- ✅ `users`
- ✅ `courses`
- ✅ `modules`
- ✅ `lessons`
- ✅ `enrollments`
- ✅ `lesson_progress`
- ✅ And all other tables...

---

## ⚙️ Environment Configuration

### Development (.env)

Keep your local development config:

```env
NODE_ENV=development

# Local PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=your_local_password

JWT_SECRET=dev_secret_key
VITE_API_URL=http://localhost:5000/api
```

### Production (.env.production)

Create `.env.production` file:

```env
NODE_ENV=production

# Supabase Connection (Pooler)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase API (Frontend)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Security (Generate new!)
JWT_SECRET=your_super_secure_production_secret_key_here

# API URL (Your deployed backend)
VITE_API_URL=https://your-api-domain.com/api

# Frontend URL (Your deployed frontend)
FRONTEND_URL=https://your-frontend-domain.com

# Server
PORT=5000
```

#### Generate Secure JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🧪 Local Testing with Supabase

Before deploying, test locally with Supabase:

```bash
# Use production database locally
export DATABASE_URL="your-supabase-pooler-url"
export NODE_ENV=development

# Start backend
npm run dev

# In another terminal, start frontend
npm run dev:client
```

**Test Checklist:**
- [ ] Can login with existing users
- [ ] Can create courses
- [ ] Can enroll students
- [ ] Progress tracking works
- [ ] All CRUD operations work
- [ ] No connection errors

---

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. Go to [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. **Add Variables**:
   ```
   DATABASE_URL=your-supabase-pooler-url
   NODE_ENV=production
   JWT_SECRET=your-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   PORT=5000
   ```
5. **Start Command**: `npm run dev`
6. **Deploy**
7. Copy your Railway URL: `https://your-app.up.railway.app`

#### Frontend on Vercel

1. Go to [Vercel](https://vercel.com)
2. **New Project** → Import your repository
3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-app.up.railway.app/api
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Deploy**

### Option 2: Render (Full Stack)

1. Go to [Render](https://render.com)
2. Create **Web Service**
3. Connect repository
4. **Environment**: Node
5. **Build Command**: `npm install`
6. **Start Command**: `npm run dev`
7. Add all environment variables
8. **Deploy**

### Option 3: DigitalOcean App Platform

1. Go to [DigitalOcean](https://cloud.digitalocean.com/apps)
2. **Create App** → Choose GitHub
3. Configure both frontend and backend
4. Add environment variables
5. **Deploy**

---

## ✅ Post-Deployment

### 1. Verify Backend Connection

Visit: `https://your-backend-url.com/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 2. Check Database Connection

Look at deployment logs for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database Connected
   Environment: 🚀 PRODUCTION
   Type: ☁️  Supabase
   Database: Supabase PostgreSQL
   SSL: ✅ Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Test API Endpoints

```bash
# Health check
curl https://your-api.com/health

# Login (with seed data)
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@udrive.com","password":"Admin123!"}'
```

### 4. Test Frontend

1. Visit your frontend URL
2. Try logging in
3. Create a course
4. Enroll a student
5. Complete a lesson
6. Check celebrations work 🎉

### 5. Create Your Admin User

Either:
- Use seeded super admin: `superadmin@udrive.com` / `Admin123!`
- Or manually insert into `users` table via Supabase dashboard

### 6. Security Checklist

- [ ] Changed all default passwords
- [ ] Using strong JWT_SECRET
- [ ] CORS configured correctly
- [ ] SSL enabled (Supabase provides this)
- [ ] Environment variables set correctly
- [ ] `.env` files not committed to git
- [ ] API rate limiting enabled (optional)

---

## 🔧 Troubleshooting

### Connection Errors

**Error:** `Connection timeout`
```
Solution: Use pooler connection string, not direct connection
Format: postgres.PROJECT_REF...pooler.supabase.com:6543
```

**Error:** `SSL required`
```
Solution: Add to connection string: ?sslmode=require
Or our db.js already handles this automatically
```

**Error:** `too many connections`
```
Solution: 
1. Use pooler URL with ?pgbouncer=true
2. Reduce max pool size in config
3. Check for connection leaks
```

### Migration Errors

**Error:** `relation already exists`
```
Solution: Drop existing tables first:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
Then run schema.sql again
```

**Error:** `permission denied`
```
Solution: Ensure you're using postgres user
Check password is correct
```

### Authentication Errors

**Error:** `JWT malformed`
```
Solution: 
1. Ensure JWT_SECRET is set in production
2. Same secret on backend and frontend
3. Restart both services
```

**Error:** `CORS error`
```
Solution: Set FRONTEND_URL in backend .env
Should match your actual frontend domain
```

### Performance Issues

**Slow queries:**
1. Check Supabase dashboard → Database → Performance
2. Add indexes if needed
3. Use pooler connection for better performance
4. Consider caching frequent queries

**High connection usage:**
1. Monitor connection pool in logs
2. Ensure connections are properly released
3. Use transactions efficiently

---

## 📊 Monitoring

### Supabase Dashboard

Monitor in real-time:
- **Database → Performance**: Query performance
- **Database → Backups**: Daily backups
- **Database → Connection Pooling**: Active connections
- **Logs**: Real-time logs

### Application Monitoring

Consider adding:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - APM monitoring

---

## 🔄 Updating Production

### Database Schema Changes

```bash
# 1. Create migration file
echo "ALTER TABLE..." > database/migrations/001_add_column.sql

# 2. Apply to Supabase
psql $PRODUCTION_DATABASE_URL -f database/migrations/001_add_column.sql

# 3. Test
# 4. Deploy new backend code
```

### Code Updates

```bash
# 1. Commit changes
git add .
git commit -m "feat: new feature"

# 2. Push to main
git push origin main

# 3. Deployment platforms auto-deploy
# Or manually trigger in dashboard
```

---

## 🎯 Environment Switching

### Automatic (Recommended)

Our `server/lib/db.js` automatically detects:
- `NODE_ENV=production` → Uses production settings
- `DATABASE_URL` set → Uses Supabase with SSL
- `DATABASE_URL` not set → Uses local PostgreSQL

### Manual

```bash
# Development (Local DB)
npm run dev

# Production (Supabase)
DATABASE_URL="supabase-url" NODE_ENV=production npm run dev
```

---

## 📝 Production Checklist

Before going live:

**Database**
- [ ] Schema deployed to Supabase
- [ ] Seed data run (if needed)
- [ ] Backups enabled (auto in Supabase)
- [ ] Connection pooling configured

**Backend**
- [ ] Environment variables set
- [ ] Strong JWT_SECRET
- [ ] CORS configured
- [ ] Error handling tested
- [ ] API endpoints tested

**Frontend**
- [ ] API_URL points to production
- [ ] Supabase credentials set
- [ ] Error boundaries working
- [ ] Loading states working

**Security**
- [ ] All passwords changed
- [ ] No sensitive data in logs
- [ ] Rate limiting configured
- [ ] SSL enabled

**Testing**
- [ ] Login works
- [ ] All features tested
- [ ] Mobile responsive
- [ ] Celebrations work 🎉

---

## 🎉 Success!

Your UDrive LMS is now running in production with:
- ✅ Supabase PostgreSQL (production-ready)
- ✅ Environment-based switching
- ✅ SSL connections
- ✅ Connection pooling
- ✅ Automatic backups
- ✅ Scalable architecture

**Next Steps:**
1. Monitor logs for errors
2. Set up custom domain
3. Configure email notifications
4. Add monitoring/analytics
5. Market your LMS! 🚀

---

## 📞 Support

- **Supabase**: [Discord](https://discord.supabase.com)
- **GitHub Issues**: Your repository
- **Documentation**: README.md

---

**Built with ❤️ for production deployment**

