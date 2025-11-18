# Vercel Deployment Guide

This guide covers deploying SunLMS to Vercel and configuring environment variables for production.

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub repository connected to Vercel
- Supabase database configured for production

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the project settings

### 2. Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Vite
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Configure Environment Variables

Go to **Project Settings → Environment Variables** and add the following:

#### Required Variables

```bash
# Database (Supabase Production)
DATABASE_URL=postgresql://postgres.zrwrdfkntrfqarbidtou:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres

# Environment
NODE_ENV=production

# Server Configuration
PORT=5000
FRONTEND_URL=https://your-domain.vercel.app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
VITE_API_URL=https://your-api-domain.vercel.app/api

# Supabase (Frontend)
VITE_SUPABASE_URL=https://zrwrdfkntrfqarbidtou.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# TinyMCE
VITE_TINYMCE_API_KEY=your-tinymce-api-key

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

#### Optional Variables

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL=your-email@gmail.com
EMAIL_FROM="SunLMS <noreply@yourdomain.com>"

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### 4. Environment Variable Scopes

Set each variable for the appropriate environments:
- **Production**: Production deployments
- **Preview**: Preview deployments (pull requests, branches)
- **Development**: Local development (optional, usually handled by `.env`)

**Important**: 
- Use Supabase production database for **Production** environment
- You can use a separate Supabase project or local database for **Preview** environments

### 5. Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Vercel Configuration File

You can also create a `vercel.json` in your project root for advanced configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Database Considerations

### Production Database (Supabase)

- **Always use Supabase** for production deployments
- Set `DATABASE_URL` in Vercel environment variables
- The app automatically detects `DATABASE_URL` and uses Supabase mode
- SSL connections are automatically enabled

### Preview/Development

- For preview deployments, you can use:
  - A separate Supabase project (recommended)
  - Local database (not recommended for Vercel)
  - Same production database (not recommended, may cause data conflicts)

## API Routes

If you have API routes in `server/`, Vercel will automatically:
- Detect Node.js serverless functions
- Route `/api/*` requests to your server
- Handle CORS and environment variables

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (set in `package.json` or Vercel settings)

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check Supabase connection pooler settings
3. Ensure SSL is enabled (handled automatically)
4. Verify database credentials are correct

### Environment Variables Not Working

1. Ensure variables are set for the correct environment (Production/Preview)
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)
4. Frontend variables must start with `VITE_`

### CORS Issues

1. Set `FRONTEND_URL` to your Vercel deployment URL
2. Update CORS settings in `server/index.js` if needed
3. Check browser console for specific CORS errors

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

To disable auto-deployment:
1. Go to Project Settings → Git
2. Configure deployment settings

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` environment variable

## Monitoring

- **Logs**: View in Vercel Dashboard → Deployments → [Deployment] → Functions
- **Analytics**: Enable in Project Settings → Analytics
- **Error Tracking**: Integrate with Sentry or similar service

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (generate with `openssl rand -base64 32`)
3. **Rotate secrets regularly** in production
4. **Use different databases** for production and preview
5. **Enable Vercel's security features** (DDoS protection, etc.)
6. **Review environment variables** regularly

## Next Steps

After deployment:
1. Test all functionality in production
2. Set up monitoring and error tracking
3. Configure custom domain (if needed)
4. Set up CI/CD workflows
5. Review and optimize performance

---

For more information, see:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [SunLMS Development Setup](development-setup.md)

