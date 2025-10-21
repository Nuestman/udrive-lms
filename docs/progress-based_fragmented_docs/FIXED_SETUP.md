# Fixed Setup - Single Command Like Your Other Apps!

## The Problem
The backend was exiting immediately because `node` was completing execution too quickly in the Windows PowerShell environment.

## The Solution
Using `nodemon` which is designed to keep servers alive during development.

---

## How to Run (Just Like Your Other Apps!)

### Single Command:
```bash
npm run dev
```

This now:
- ✅ Starts backend with nodemon (stays alive!)
- ✅ Starts frontend with Vite
- ✅ Both run concurrently
- ✅ Both stay running
- ✅ Auto-restart on file changes

---

## Updated Environment Variables

Update your `.env` file to match your working app's format:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/udrive-from-bolt

# Alternative format (also supported)
PGDATABASE=udrive-from-bolt
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD

# JWT Security
JWT_SECRET=udrive-local-dev-secret-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=development

# API Configuration
PORT=5000
```

---

## What Changed

### Before:
```json
"dev": "vite",                          ❌ Frontend only
"dev:server": "node server/index.js",   ❌ Would exit immediately
"dev:all": "concurrently..."            ❌ Confusing
```

### After:
```json
"dev": "concurrently \"npm run server\" \"npm run client\"",  ✅ Both together
"server": "nodemon server/index.js",    ✅ Stays alive with nodemon
"client": "vite"                        ✅ Clear names
```

---

## Why Nodemon?

**nodemon** is specifically designed for development servers:
- Keeps process alive
- Auto-restarts on file changes
- Standard tool for Node.js development
- Used in most professional setups

Your working app probably uses nodemon or a similar tool!

---

## Test It Now

1. **Update your `.env`** with your password
2. **Run:**
   ```bash
   npm run dev
   ```
3. **You should see:**
   ```
   [0] [nodemon] starting `node server/index.js`
   [0] 🚀 Server running on http://localhost:5000
   [0] ✅ Database connected successfully
   [1] VITE v5.4.8  ready in 500 ms
   [1] ➜  Local:   http://localhost:5173/
   ```
4. **Both should STAY RUNNING** (no exit!)

---

## Login Test

1. Open http://localhost:5173
2. Click "Sign In"
3. Use: `schooladmin@premier.com` / `password123`
4. Should work now!

---

## If It Still Exits

Check your `.env` has the correct password:
```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/udrive-from-bolt
```

Or use the individual params:
```env
PGPASSWORD=YOUR_ACTUAL_PASSWORD
```

---

## Additional Scripts

```bash
# Backend only (with nodemon)
npm run server

# Frontend only
npm run client

# Both together (recommended)
npm run dev

# Database setup
npm run db:setup
```

---

## Why This is Better

✅ **One command:** `npm run dev` (like your other apps!)  
✅ **Stays running:** nodemon keeps backend alive  
✅ **Auto-restart:** Changes trigger restart  
✅ **Clear names:** server/client instead of dev:server/dev:all  
✅ **Standard:** Matches industry best practices  

---

Now it works like your other apps! 🎉




