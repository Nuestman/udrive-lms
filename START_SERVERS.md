# How to Start UDrive LMS

## Understanding the Architecture

UDrive uses a **client-server architecture**:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Browser       │         │   Backend API   │         │   PostgreSQL    │
│  (React App)    │────────▶│  (Express.js)   │────────▶│   Database      │
│  Port 5173      │  HTTP   │  Port 3000      │  SQL    │   Port 5432     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Why Two Servers?

**Frontend (Vite - Port 5173):**
- Serves your React application
- Provides hot-reload for development
- Runs in the browser
- **Cannot directly access PostgreSQL** (browser security)

**Backend (Express - Port 3000):**
- REST API server
- Handles database operations
- Authenticates users
- Generates JWT tokens
- **Required** for database access

---

## Method 1: Run Both Together (Recommended)

### Single Command:
```bash
npm run dev:all
```

This starts:
- Backend on http://localhost:3000
- Frontend on http://localhost:5173

**Keep this terminal open!**

---

## Method 2: Run Separately (For Debugging)

### Terminal 1 - Backend:
```bash
node server/index.js
```

You should see:
```
🚀 Server running on http://localhost:3000
📡 API available at http://localhost:3000/api
🔐 Auth endpoints at http://localhost:3000/api/auth
✅ Database connected successfully
🎯 Server is ready! Keep this terminal open.
```

**IMPORTANT:** Keep this terminal open! If you close it, the backend stops.

### Terminal 2 - Frontend:
```bash
npm run dev
```

You should see:
```
VITE v5.4.2  ready in 500 ms
➜  Local:   http://localhost:5173/
```

---

## Verify Both Are Running

### Check Backend:
Open: http://localhost:3000/api/health

Should show:
```json
{"status":"ok","timestamp":"2025-10-12T..."}
```

### Check Frontend:
Open: http://localhost:5173

Should show the UDrive landing page.

---

## Common Issues

### Issue 1: Backend Exits Immediately

**Problem:** Terminal shows startup messages then returns to prompt.

**Cause:** Backend crashed or wasn't started properly.

**Fix:**
```bash
# Run backend with error logging
node server/index.js
```

Look for error messages. Common causes:
- Database connection failed
- Port 3000 already in use
- Missing `.env` file

### Issue 2: "NetworkError" in Browser

**Problem:** Login fails with "NetworkError when attempting to fetch resource"

**Cause:** Backend is not running.

**Fix:** Start the backend server (see above).

### Issue 3: "Not found" on Port 3000

**Problem:** Going to http://localhost:3000 shows error.

**Cause:** 
- Accessing root URL instead of API endpoint
- OR backend crashed

**Fix:**
- Use http://localhost:3000/api/health to test
- Check if backend terminal is still running

### Issue 4: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Fix:**
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

Then restart the server.

---

## What Should Be Running?

Check your task manager or terminal:

✅ **PostgreSQL** - Database server (pgAdmin shows it's running)  
✅ **Node.js (Backend)** - API server on port 3000  
✅ **Node.js (Frontend)** - Vite dev server on port 5173  

**3 processes total**

---

## Testing the Setup

### 1. Test Database:
```bash
node database/test-connection.js
```

Should show 6 users and 3 courses.

### 2. Test Backend API:
```bash
curl http://localhost:3000/api/health
```

Should return JSON with status "ok".

### 3. Test Frontend:
Open http://localhost:5173 in browser.

### 4. Test Full Stack:
1. Go to http://localhost:5173
2. Click "Sign In"
3. Use: schooladmin@premier.com / password123
4. Watch backend terminal for logs:
   ```
   POST /api/auth/login
   Executed query...
   ```

---

## Production vs Development

### Development (Now):
- Frontend: Vite dev server (hot reload)
- Backend: Node.js with nodemon
- Two separate ports

### Production (Later):
- Frontend: Built static files served by backend
- Backend: Single Express server
- One port, one deployment

---

## Quick Reference

```bash
# Start everything
npm run dev:all

# Backend only
node server/index.js

# Frontend only
npm run dev

# Test database
node database/test-connection.js

# Stop all Node processes
taskkill /F /IM node.exe
```

---

## Why This Architecture?

**Security:** Browsers can't directly access databases  
**Separation:** Frontend and backend can scale independently  
**Standard:** This is how modern web apps work (MERN, PERN stacks)  
**Flexibility:** Can deploy frontend and backend separately  

---

## Next Steps

Once both servers are running:
1. ✅ Test login works
2. ✅ Verify database connection
3. 🔜 Connect components to real data
4. 🔜 Build CRUD operations

---

**Remember:** Both servers must be running for the app to work!





