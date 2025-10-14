# Configuration Refactoring - TODO

## 🎯 Goal
Separate configuration from infrastructure code following best practices.

## 📋 Tasks

### 1. Create `/server/config` Directory Structure
```
server/config/
├── index.js          # Export all configs
├── database.js       # Database connection settings
├── storage.js        # Vercel Blob storage settings
├── app.js            # General app settings (JWT, ports, etc.)
└── constants.js      # App-wide constants
```

### 2. Extract Database Config
**From:** `server/lib/db.js` (lines ~14-40)  
**To:** `server/config/database.js`

**What to extract:**
- Connection string logic
- SSL settings
- Pool configuration (max, timeouts)
- Supabase-specific settings

**What stays in lib/db.js:**
- Pool instance creation
- Query function
- Connection testing

### 3. Extract Storage Config
**From:** `server/utils/storage.js` (embedded constants)  
**To:** `server/config/storage.js`

**What to extract:**
- Vercel Blob token reference
- Default storage paths
- File size limits
- Allowed file types

### 4. Create App Config
**New file:** `server/config/app.js`

**What to include:**
- JWT_SECRET
- JWT_EXPIRES_IN
- PORT
- FRONTEND_URL
- NODE_ENV checks
- CORS settings

### 5. Update Imports
**Files to update:**
- `server/lib/db.js` → import from `../config/database.js`
- `server/utils/storage.js` → import from `../config/storage.js`
- `server/index.js` → import from `./config/app.js`
- Any service files using direct env vars

### 6. Benefits Gained
- ✅ All settings in one place
- ✅ Easy to find and modify configs
- ✅ Better for environment management
- ✅ Improved testability
- ✅ Clearer separation of concerns

## ⏱️ Estimated Time
**15-20 minutes** for complete refactoring

## 📝 Testing Checklist
After refactoring:
- [ ] Server starts without errors
- [ ] Database connection works
- [ ] File uploads work
- [ ] Authentication works
- [ ] All API endpoints respond correctly

## 🔄 Rollback Plan
If issues occur:
1. Git stash or revert changes
2. Config values are same, just moved
3. Low risk refactoring

---

**Status:** 📌 PLANNED - Execute after Vercel Blob setup complete  
**Priority:** Medium (Good practice, not urgent)  
**Complexity:** Low (Straightforward move operation)

