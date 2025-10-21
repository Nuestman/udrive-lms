# Database Setup Guide

## Prerequisites

✅ PostgreSQL installed  
✅ Database `udrive-from-bolt` created in pgAdmin  
✅ npm dependencies installed  

## Step-by-Step Setup

### Step 1: Create .env File

Create a file named `.env` in the project root with your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password_here

JWT_SECRET=udrive_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

**Important:** Replace `your_actual_password_here` with your actual PostgreSQL password!

### Step 2: Run Database Schema

This creates all tables, indexes, and triggers:

```bash
npm run db:schema
```

You should see output like:
```
✅ Schema created successfully!
📋 Created tables:
  - tenants
  - users
  - courses
  - modules
  - lessons
  - ...
```

### Step 3: Run Seed Data

This populates the database with test data:

```bash
npm run db:seed
```

You should see:
```
✅ Seed data inserted successfully!
👥 Created users:
  - admin@udrive.com (super_admin)
  - schooladmin@premier.com (school_admin)
  - instructor@premier.com (instructor)
  - student1@example.com (student)
  ...
```

### Step 4: Verify in pgAdmin

1. Open pgAdmin
2. Navigate to: Servers → PostgreSQL → Databases → udrive-from-bolt → Schemas → public → Tables
3. You should see all 17 tables
4. Right-click `users` → View/Edit Data → All Rows
5. You should see 6 test users

## Test Credentials

After seeding, you can login with these accounts:

### Super Admin
- **Email:** admin@udrive.com
- **Password:** password123
- **Role:** super_admin

### School Admin
- **Email:** schooladmin@premier.com
- **Password:** password123
- **Role:** school_admin

### Instructor
- **Email:** instructor@premier.com
- **Password:** password123
- **Role:** instructor

### Students
- **Email:** student1@example.com
- **Password:** password123
- **Role:** student

More students: student2@example.com, student3@example.com (same password)

## Quick Commands

### Complete Setup (Schema + Seed)
```bash
npm run db:setup
```

### Reset Database (Drop all data and recreate)
```bash
npm run db:reset
```

### Just Schema
```bash
npm run db:schema
```

### Just Seed
```bash
npm run db:seed
```

## Troubleshooting

### Error: "password authentication failed"
- Check your `.env` file has the correct password
- Verify PostgreSQL is running

### Error: "database does not exist"
- Make sure you created the database in pgAdmin
- Check the database name in `.env` matches exactly

### Error: "relation already exists"
- Tables already created. Use `npm run db:reset` to recreate

### Error: "Cannot find module 'pg'"
- Run `npm install` to install dependencies

## Verify Connection

Test your database connection:

```bash
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ host: process.env.DATABASE_HOST, port: process.env.DATABASE_PORT, database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD }); pool.query('SELECT NOW()', (err, res) => { if (err) { console.error('❌ Connection failed:', err.message); } else { console.log('✅ Connected! Server time:', res.rows[0].now); } pool.end(); });"
```

Should output:
```
✅ Connected! Server time: 2025-10-11T...
```

## What Was Created

### Tables (17 total):
1. `tenants` - Multi-tenant organizations
2. `users` - User accounts and profiles
3. `courses` - Course catalog
4. `modules` - Course modules
5. `lessons` - Individual lessons with content
6. `quizzes` - Assessments
7. `quiz_questions` - Quiz questions
8. `quiz_attempts` - Student quiz attempts
9. `enrollments` - Course enrollments
10. `lesson_progress` - Lesson completion tracking
11. `certificates` - Generated certificates
12. `assignments` - Course assignments
13. `assignment_submissions` - Student submissions
14. `media_files` - Media library
15. `notifications` - User notifications
16. `audit_log` - System audit trail

### Sample Data Created:
- 1 Tenant (Premier Driving Academy)
- 6 Users (1 admin, 1 school admin, 1 instructor, 3 students)
- 3 Courses (Basic Driving, Advanced Defensive, Traffic Laws)
- 5 Modules across courses
- 3 Lessons with content
- 1 Quiz with 3 questions
- 3 Enrollments (students in courses)
- 3 Lesson progress records
- 2 Notifications

## Next Steps

After database setup:

1. ✅ Update AuthContext to use local PostgreSQL (not Supabase)
2. ✅ Create authentication service with JWT
3. ✅ Create database service layer
4. ✅ Test login with test credentials
5. ✅ Connect first component to real data

See `NEXT_STEPS_ACTION_PLAN.md` for the full roadmap.

## Database Schema Diagram

```
tenants (1) ──┬─→ (M) users
              ├─→ (M) courses ──┬─→ (M) modules ──┬─→ (M) lessons
              │                  │                  ├─→ (M) quizzes ──→ (M) quiz_questions
              │                  │                  └─→ (M) assignments
              │                  └─→ (M) enrollments
              └─→ (M) media_files

users (1) ──┬─→ (M) enrollments
                    ├─→ (M) lesson_progress
                    ├─→ (M) quiz_attempts
                    ├─→ (M) certificates
                    ├─→ (M) assignment_submissions
                    └─→ (M) notifications
```

## Success! ✅

Once you see "Database setup complete!" you're ready to start connecting the UI to real data!

