# Deployment Guide

## Overview

This guide covers deploying SunLMS to production environments. The system is designed to be deployed on Vercel for the frontend and Supabase for the database, with optional backend hosting on Vercel or other platforms. SunLMS will be hosted on sunlms.com as the main platform.

## Deployment Architecture

### Production Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                        │
│  • React Application    • Static Assets    • CDN           │
│  • sunlms.com          • Custom Domains    • Multi-tenant │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ API Calls
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel (Backend API)                       │
│  • Node.js/Express    • Serverless Functions    • API      │
│  • Multi-tenant API   • Industry-specific      • Generic   │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Database)                      │
│  • PostgreSQL        • Real-time Features    • Auth        │
│  • Tenant Isolation  • Multi-tenant Data     • Scalable    │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ File Storage
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Blob (Storage)                      │
│  • File Storage      • Media Management     • CDN          │
│  • Multi-tenant      • Industry-specific    • Scalable     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Accounts
- **Vercel Account** - Frontend and backend hosting
- **Supabase Account** - Database hosting
- **GitHub Account** - Code repository
- **Domain Name** (optional) - Custom domain

### Required Tools
- **Git** - Version control
- **Vercel CLI** - Deployment tool
- **Supabase CLI** - Database management

## Environment Setup

### 1. Vercel Setup

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Login to Vercel
```bash
vercel login
```

#### Link Project
```bash
vercel link
```

### 2. Supabase Setup

#### Install Supabase CLI
```bash
npm install -g supabase
```

#### Login to Supabase
```bash
supabase login
```

#### Initialize Project
```bash
supabase init
```

## Database Deployment

### 1. Supabase Project Setup

#### Create New Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - Name: `udrive-lms-prod`
   - Database Password: Generate strong password
   - Region: Choose closest region

#### Get Connection Details
1. Go to Settings > Database
2. Copy connection string
3. Note the following details:
   - Host
   - Database name
   - Username
   - Password
   - Port

### 2. Database Migration

#### Run Schema Migration
```bash
# Connect to Supabase database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Run schema
\i database/schema.sql

# Run additional migrations
\i database/create_unified_progress_table.sql
\i database/user-profiles-migration.sql
```

#### Alternative: Using Supabase CLI
```bash
# Link to Supabase project
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

### 3. Database Configuration

#### Enable Extensions
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Set Up Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for users table)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## Backend Deployment

### 1. Vercel Backend Setup

#### Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Environment Variables
Set the following environment variables in Vercel dashboard:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Server
NODE_ENV=production
PORT=3001
```

### 2. Deploy Backend

#### Deploy to Vercel
```bash
# Deploy backend
vercel --prod

# Or deploy specific directory
vercel server --prod
```

#### Verify Deployment
```bash
# Test API endpoint
curl https://your-app.vercel.app/api/health

# Expected response
{"success": true, "message": "API is running"}
```

## Frontend Deployment

### 1. Build Configuration

#### Update Environment Variables
Create `.env.production`:
```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend.vercel.app/api
VITE_APP_NAME=UDrive LMS
VITE_APP_VERSION=2.0.0

# File Storage
VITE_BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

#### Build Frontend
```bash
# Build for production
npm run build

# Test build locally
npm run preview
```

### 2. Deploy Frontend

#### Deploy to Vercel
```bash
# Deploy frontend
vercel --prod

# Or deploy from specific directory
vercel public --prod
```

#### Verify Deployment
1. Visit your Vercel URL
2. Check that the application loads
3. Test login functionality
4. Verify API connections

## File Storage Setup

### 1. Vercel Blob Configuration

#### Create Blob Store
1. Go to Vercel Dashboard
2. Navigate to Storage tab
3. Create new Blob store
4. Copy the read/write token

#### Configure Blob Client
```javascript
// server/utils/blob.js
import { put } from '@vercel/blob';

export async function uploadFile(file, filename) {
  const blob = await put(filename, file, {
    access: 'public',
  });
  return blob.url;
}
```

### 2. Test File Upload
```bash
# Test file upload endpoint
curl -X POST https://your-app.vercel.app/api/upload/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@test-image.jpg"
```

## Domain Configuration

### 1. Custom Domain Setup

#### Add Domain to Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Follow DNS configuration instructions

#### DNS Configuration
```bash
# Add CNAME record
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# Add A record for root domain
Type: A
Name: @
Value: 76.76.19.61
```

### 2. SSL Certificate
Vercel automatically provides SSL certificates for custom domains.

## Monitoring and Logging

### 1. Vercel Analytics

#### Enable Analytics
1. Go to Vercel Dashboard
2. Select your project
3. Go to Analytics tab
4. Enable Web Analytics

#### Monitor Performance
- Page load times
- Core Web Vitals
- User engagement
- Error rates

### 2. Database Monitoring

#### Supabase Monitoring
1. Go to Supabase Dashboard
2. Navigate to Reports
3. Monitor:
   - Database performance
   - Query execution times
   - Connection usage
   - Storage usage

### 3. Error Tracking

#### Set Up Error Monitoring
```javascript
// server/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}
```

## Security Configuration

### 1. Environment Security

#### Secure Environment Variables
- Use strong, unique secrets
- Rotate secrets regularly
- Never commit secrets to Git
- Use Vercel's environment variable encryption

#### Database Security
```sql
-- Create application user with limited privileges
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE udrive_lms TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

### 2. API Security

#### Rate Limiting
```javascript
// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

#### CORS Configuration
```javascript
// server/middleware/cors.js
import cors from 'cors';

export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Backup and Recovery

### 1. Database Backup

#### Automated Backups
Supabase provides automated daily backups. For additional security:

```bash
# Manual backup
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup.sql
```

#### Backup Strategy
- Daily automated backups (Supabase)
- Weekly manual backups
- Monthly off-site backups
- Test restore procedures quarterly

### 2. Application Backup

#### Code Backup
- Git repository (primary)
- GitHub/GitLab (remote)
- Local backups (development)

#### Configuration Backup
- Environment variables documentation
- Database schema files
- Deployment configurations

## Performance Optimization

### 1. Frontend Optimization

#### Build Optimization
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
};
```

#### CDN Configuration
Vercel automatically provides global CDN for static assets.

### 2. Backend Optimization

#### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_content_progress_student_id ON content_progress(student_id);
```

#### Caching Strategy
```javascript
// server/middleware/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

export function cacheMiddleware(ttl = 600) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, ttl);
      res.sendResponse(body);
    };
    
    next();
  };
}
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Common fixes
npm ci --production
npm run build
```

#### Database Connection Issues
```bash
# Test database connection
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Check environment variables
vercel env ls
```

#### File Upload Issues
```bash
# Check blob configuration
curl -X POST https://your-app.vercel.app/api/upload/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.txt"
```

### Performance Issues

#### Slow API Responses
1. Check database query performance
2. Review server logs
3. Monitor Vercel function execution time
4. Optimize database indexes

#### Frontend Loading Issues
1. Check bundle size
2. Review network requests
3. Monitor Core Web Vitals
4. Optimize images and assets

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Monitor error logs
- Check database performance
- Review security alerts
- Update dependencies

#### Monthly
- Review and update secrets
- Analyze usage patterns
- Optimize database queries
- Update documentation

#### Quarterly
- Security audit
- Performance review
- Backup testing
- Disaster recovery testing

### Update Procedures

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Deploy to staging
vercel --target staging

# Test staging environment
# Deploy to production
vercel --prod
```

#### Database Updates
```bash
# Create migration
touch database/migrations/YYYY-MM-DD_description.sql

# Test migration on staging
psql staging-db < database/migrations/YYYY-MM-DD_description.sql

# Apply to production
psql production-db < database/migrations/YYYY-MM-DD_description.sql
```

## Implementation Status

### ✅ Fully Implemented
- Vercel frontend deployment
- Supabase database hosting
- Vercel Blob file storage
- Environment configuration
- Basic monitoring

### 🚧 Partially Implemented
- Automated backups (Supabase default)
- Error tracking (basic logging)
- Performance monitoring (manual)
- Security hardening (basic)

### 📋 Planned
- Advanced monitoring (Sentry, DataDog)
- Automated testing in CI/CD
- Blue-green deployments
- Multi-region deployment
- Advanced security features

---

*This deployment guide is maintained alongside the codebase and reflects the current deployment process as of October 2025.*
