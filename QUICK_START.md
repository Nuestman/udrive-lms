# Quick Start - Database Setup

## You're Here → Database Ready! 🎯

Your system now has:
- ✅ All dependencies installed
- ✅ Database schema ready
- ✅ Seed data ready
- ✅ Connection layer built

## Do These 3 Things Now:

### 1. Create .env File

Create `.env` in project root:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=PUT_YOUR_PASSWORD_HERE

JWT_SECRET=udrive_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

Replace `PUT_YOUR_PASSWORD_HERE` with your actual PostgreSQL password!

### 2. Run Database Setup

```bash
npm run db:setup
```

This will:
- Create all 17 tables
- Insert test data
- Give you login credentials

### 3. Verify in pgAdmin

- Refresh your database
- Check Tables folder
- Should see 17 tables with data

## Test Credentials (After Setup)

```
Email: schooladmin@premier.com
Password: password123

Email: student1@example.com  
Password: password123
```

## What You'll See

```bash
$ npm run db:setup

> db:schema

🔧 Reading schema.sql...
📊 Connecting to database...
⚡ Executing schema...
✅ Schema created successfully!

📋 Created tables:
  - tenants
  - users
  - courses
  - modules
  - lessons
  - quizzes
  - ...

> db:seed

🌱 Reading seed.sql...
🔐 Generating password hashes...
✅ Seed data inserted successfully!

👥 Created users:
  - admin@udrive.com (super_admin)
  - schooladmin@premier.com (school_admin)
  - instructor@premier.com (instructor)
  - student1@example.com (student)
  ...

📚 Created courses:
  - Basic Driving Course [published]
  - Advanced Defensive Driving [published]
  - Traffic Laws Review [published]

🎉 Database seeding complete!
```

## Troubleshooting

**Error: "Cannot find module 'dotenv'"**
→ Already fixed! Dependencies are installed.

**Error: "password authentication failed"**
→ Check your password in `.env` file

**Error: "database does not exist"**
→ You're good! You already created it in pgAdmin.

## What's Next?

After database setup, we'll:
1. Replace Supabase Auth with JWT Authentication
2. Connect login page to real database
3. Make courses load from database
4. Get first CRUD operations working

## Files Created

```
project-root/
├── .env (you create this)
├── ENV_SETUP_INSTRUCTIONS.md
├── DATABASE_SETUP_GUIDE.md
├── WEEK1_PROGRESS.md
├── QUICK_START.md (this file)
│
├── database/
│   ├── schema.sql (all tables)
│   ├── seed.sql (test data)
│   ├── run-schema.js (setup script)
│   └── run-seed.js (seed script)
│
└── src/
    └── lib/
        └── db.ts (connection layer)
```

## Ready? Let's Go!

1. Create `.env` with your password
2. Run `npm run db:setup`
3. Tell me when it's done!

Then we'll build the authentication system and start connecting components to real data!

---

**Current Status:** 🟢 Week 1, Day 2 Complete  
**Next Up:** Authentication & First Real Data Connection

