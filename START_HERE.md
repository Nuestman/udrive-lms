# 🚀 Start UDrive LMS - Quick Guide

## You're Ready to Test! 

Your database is set up with test data. Now let's start the application and test authentication.

---

## Step 1: Start Both Frontend and Backend

Run this single command to start everything:

```bash
npm run dev:all
```

This starts:
- ✅ **Backend API** on http://localhost:3000
- ✅ **Frontend React App** on http://localhost:5173

You should see output like:
```
[0] 🚀 Server running on http://localhost:3000
[0] 📡 API available at http://localhost:3000/api
[0] 🔐 Auth endpoints at http://localhost:3000/api/auth
[1] 
[1]   VITE v5.4.2  ready in 500 ms
[1] 
[1]   ➜  Local:   http://localhost:5173/
```

---

## Step 2: Open the App

Open your browser to:
```
http://localhost:5173
```

---

## Step 3: Test Login

Click "Sign In" and use these test credentials:

### School Admin
```
Email: schooladmin@premier.com
Password: password123
```

### Instructor
```
Email: instructor@premier.com
Password: password123
```

### Student
```
Email: student1@example.com
Password: password123
```

---

## What Should Happen

1. ✅ Login page loads
2. ✅ Enter credentials
3. ✅ Click "Sign In"
4. ✅ Backend authenticates against database
5. ✅ JWT token is generated and stored
6. ✅ User is redirected to role-appropriate dashboard
7. ✅ User profile shows real data from database

---

## Troubleshooting

### Frontend Can't Connect to Backend
**Error:** `Failed to fetch` or `Network Error`

**Fix:** Make sure both are running:
```bash
npm run dev:all
```

### Login Fails
**Error:** `Invalid email or password`

**Check:**
1. Is the backend running? (Check terminal)
2. Is the database running? (Check pgAdmin)
3. Did you use the correct email? (Must be exact)
4. Did you use `password123`?

### Backend Crashes
**Error:** Database connection errors

**Fix:** Check your `.env` file:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=udrive-from-bolt
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password
```

### Port Already in Use
**Error:** `Port 3000 is already in use`

**Fix:** Kill the process or change port in `.env`:
```env
PORT=3001
```

---

## Verify It's Working

### Test API Directly

Open your browser to:
```
http://localhost:3000/api/health
```

Should see:
```json
{"status":"ok","timestamp":"2025-10-12T..."}
```

### Test Authentication Flow

1. Open browser DevTools (F12)
2. Go to Console tab
3. Login
4. Watch the logs:
```
[AUTH-INFO] Sign in attempt
[AUTH-INFO] Sign in successful
```

5. Check Network tab:
- Should see `POST /api/auth/login` with Status 200
- Response should include user data

### Verify Database Connection

In terminal where backend is running, you should see:
```
✅ Connected to PostgreSQL database: udrive-from-bolt
POST /api/auth/login
Executed query { text: 'SELECT * FROM user_profiles...', duration: 15, rows: 1 }
```

---

## What You Can Test Now

### ✅ Authentication Works
- [x] Login with real database users
- [x] JWT token generation
- [x] Protected routes
- [x] Role-based redirection
- [x] Logout functionality

### ⚠️ Still Mock Data
- [ ] Courses page (still hardcoded)
- [ ] Students page (still hardcoded)
- [ ] Dashboard stats (still hardcoded)
- [ ] Quiz submissions (still hardcoded)

**Next:** We'll connect these components to real data!

---

## Stop the Application

Press `Ctrl+C` in the terminal to stop both frontend and backend.

---

## Run Separately (If Needed)

### Start Backend Only
```bash
npm run dev:server
```

### Start Frontend Only
```bash
npm run dev
```

---

## Success Criteria

✅ Backend starts without errors  
✅ Frontend starts without errors  
✅ Can access login page  
✅ Can login with test credentials  
✅ Redirect to dashboard after login  
✅ User profile shows from database  
✅ Can logout  

---

## Next Steps

After verifying authentication works:

1. ✅ Authentication working
2. 🔜 Connect CoursesPage to database
3. 🔜 Connect StudentManagement to database
4. 🔜 Build CRUD operations
5. 🔜 Test full workflows

See `NEXT_STEPS_ACTION_PLAN.md` for the complete roadmap!

---

## Quick Commands Reference

```bash
# Start everything
npm run dev:all

# Database commands
npm run db:setup     # Create schema + seed data
npm run db:schema    # Create tables only
npm run db:seed      # Insert test data only

# Test connection
node database/test-connection.js
```

---

## 🎉 You're Now Running a Real LMS!

The transformation is complete:
- ❌ Before: Mock data, no persistence, no auth
- ✅ Now: Real database, JWT auth, data persistence

**Ready?** Run `npm run dev:all` and test your login! 🚀





