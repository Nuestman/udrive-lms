# Development Setup Guide

## Overview

This guide will help you set up a local development environment for SunLMS. The system requires Node.js, PostgreSQL, and several other tools to run properly. SunLMS is designed as a generic LMS/CMS-as-a-Service platform.

## Prerequisites

### Required Software
- **Node.js 18+** - JavaScript runtime
- **PostgreSQL 15+** - Database system
- **Git** - Version control
- **VS Code** (recommended) - Code editor

### Optional Software
- **pgAdmin** - PostgreSQL administration tool
- **Postman** - API testing
- **Docker** - Containerization (alternative setup)

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/sunlms.git
cd sunlms
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name udrive-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=udrive_lms \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Database Configuration
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sunlms;
CREATE USER sunlms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sunlms TO sunlms_user;

# Exit psql
\q
```

### 5. Environment Configuration
Create environment files:

#### Frontend (.env.local)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=UDrive LMS
VITE_APP_VERSION=2.0.0

# File Storage
VITE_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

#### Backend (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://sunlms_user:your_password@localhost:5432/sunlms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 6. Database Migration
```bash
# Run database migrations
cd database
psql -U udrive_user -d udrive_lms -f schema.sql

# Run additional migrations if needed
psql -U udrive_user -d udrive_lms -f create_unified_progress_table.sql
psql -U udrive_user -d udrive_lms -f user-profiles-migration.sql
```

### 7. Seed Data (Optional)
```bash
# Add sample data for development
psql -U udrive_user -d udrive_lms -f seed.sql
```

## Development Workflow

### Starting the Development Servers

#### Terminal 1: Backend Server
```bash
cd server
npm run dev
```
Server will start on http://localhost:3001

#### Terminal 2: Frontend Development Server
```bash
npm run dev
```
Frontend will start on http://localhost:5173

### Development Commands

#### Frontend Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run type checking
npm run type-check
```

#### Backend Commands
```bash
cd server

# Start development server
npm run dev

# Start production server
npm start

# Run linting
npm run lint

# Run tests (when implemented)
npm test
```

## Project Structure

```
udrive-lms/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── server/                # Backend source code
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   └── utils/             # Server utilities
├── database/              # Database files
│   ├── schema.sql         # Complete database schema
│   ├── migrations/        # Database migrations
│   └── seeds/             # Sample data
├── docs/                  # Documentation
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

## Database Management

### Common Database Operations

#### Connect to Database
```bash
psql -U udrive_user -d udrive_lms
```

#### Backup Database
```bash
pg_dump -U udrive_user -d udrive_lms > backup.sql
```

#### Restore Database
```bash
psql -U udrive_user -d udrive_lms < backup.sql
```

#### Reset Database
```bash
# Drop and recreate database
dropdb -U udrive_user udrive_lms
createdb -U udrive_user udrive_lms
psql -U udrive_user -d udrive_lms -f schema.sql
```

### Database Migrations

#### Creating a New Migration
```bash
# Create migration file
touch database/migrations/YYYY-MM-DD_description.sql

# Add migration content
echo "-- Migration: Description
-- Date: $(date)
-- Author: Your Name

-- Your SQL commands here
" > database/migrations/YYYY-MM-DD_description.sql
```

#### Running Migrations
```bash
# Run specific migration
psql -U udrive_user -d udrive_lms -f database/migrations/YYYY-MM-DD_description.sql

# Run all migrations
for file in database/migrations/*.sql; do
  psql -U udrive_user -d udrive_lms -f "$file"
done
```

## Development Tools

### VS Code Extensions
Recommended extensions for development:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-sql",
    "ms-vscode.vscode-postgresql"
  ]
}
```

### VS Code Settings
Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

### Debugging Configuration
Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Testing Setup

### Frontend Testing (Planned)
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Backend Testing (Planned)
```bash
cd server

# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Testing

### Using Postman
1. Import the API collection (when available)
2. Set up environment variables:
   - `base_url`: http://localhost:3001/api
   - `auth_token`: Your JWT token

### Using curl
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get courses (with token)
curl -X GET http://localhost:3001/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U udrive_user -d udrive_lms -c "SELECT 1;"

# Check database exists
psql -U postgres -c "\l"
```

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 PID

# Or use different port
PORT=3002 npm run dev
```

#### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables Not Loading
- Check file names: `.env.local` for frontend, `.env` for backend
- Restart development servers after changing environment variables
- Check for typos in variable names

### Debug Mode

#### Backend Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific debug namespaces
DEBUG=app:*,database:* npm run dev
```

#### Frontend Debug Mode
```bash
# Enable React DevTools
npm run dev

# Open browser DevTools
# Go to Components tab to inspect React components
```

## Performance Optimization

### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze table statistics
ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Frontend Performance
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for unused dependencies
npx depcheck
```

## Deployment Preparation

### Production Build
```bash
# Build frontend
npm run build

# Build backend (if needed)
cd server
npm run build
```

### Environment Variables for Production
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-secret
BLOB_READ_WRITE_TOKEN=your-production-token
```

## Contributing

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Use TypeScript for type safety
- Write meaningful commit messages

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Create pull request
5. Code review
6. Merge to main

## Getting Help

### Documentation
- Check the `/docs` folder for detailed documentation
- API reference: `docs/api-reference.md`
- Database schema: `docs/database-schema.md`

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Wiki: Community-maintained documentation

### Support
- Check troubleshooting section above
- Review error logs in browser console and server logs
- Search existing issues on GitHub

---

*This development setup guide is maintained alongside the codebase and reflects the current development environment as of October 2025.*
