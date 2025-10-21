# Logo Upload Authentication Debug Guide

## ✅ Vercel Blob Status
**Connection:** WORKING ✅  
**Test Result:** All tests passed  
**URL:** https://xpqvifyrcgoboaku.public.blob.vercel-storage.com/

## ❌ Current Issue
**Error:** "Not authenticated" when uploading logo  
**Status Code:** 401 (from backend)  
**Message:** "jwt malformed" OR "Not authenticated"

## 🔍 Debug Information Added

I've added extensive debugging to help identify the issue:

### Frontend Logging (Check Browser Console)
When you upload a logo, you'll see:
```
🔍 Debug - Token exists: true/false
🔍 Debug - Token preview: eyJhbGc...
🔍 Debug - New School ID: uuid-here
🔍 Debug - API URL: http://localhost:5000/api
📤 Uploading to: http://localhost:5000/api/media/tenant-logo/uuid
📥 Response status: 200 or 401
```

### Backend Logging (Check Terminal)
On the server, you'll see:
```
🔍 Backend Debug - Tenant Logo Upload
   User: { id, email, role, ... }
   Tenant ID: uuid-here
   Has file: true/false
```

## 🐛 Troubleshooting Steps

### Step 1: Check Browser Console
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Try to create/edit a school with logo
4. Look for the debug messages above

**What to check:**
- ✅ Token exists: Should be `true`
- ✅ Token preview: Should start with `eyJ`
- ✅ Upload URL: Should be correct
- ❌ Response status: If 401, token issue

### Step 2: Verify Token in Browser
Open Console and run:
```javascript
localStorage.getItem('token')
```

**Expected:** Should return a JWT token like `eyJhbGc...`  
**If null:** You're not logged in properly

### Step 3: Check Network Tab
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Try to upload logo
4. Find the `tenant-logo` request
5. Click on it
6. Check **Request Headers**

**Look for:**
```
Authorization: Bearer eyJhbGc...
```

### Step 4: Test Direct Upload
Try uploading directly using this test script in browser console:
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
console.log('Token length:', token?.length);
console.log('Token starts with:', token?.substring(0, 10));

// If token exists and looks valid, the issue might be in the request
if (token && token.startsWith('eyJ')) {
  console.log('✅ Token looks valid');
} else {
  console.log('❌ Token is invalid or missing');
}
```

## 💡 Possible Causes & Solutions

### Cause 1: Token Not Stored
**Symptom:** `Token exists: false` in console  
**Solution:** Log out and log back in to refresh token

### Cause 2: Token Expired
**Symptom:** Token exists but backend says "expired"  
**Solution:** Log out and log back in

### Cause 3: Token Format Issue
**Symptom:** "jwt malformed" error  
**Solution:** 
- Check token doesn't have extra spaces
- Verify it starts with `eyJ`
- Re-login to get fresh token

### Cause 4: CORS Issue
**Symptom:** Network error in console  
**Solution:** Verify backend CORS settings allow the request

### Cause 5: Wrong API URL
**Symptom:** 404 or network error  
**Solution:** Check `VITE_API_URL` in .env matches server URL

## 🧪 Manual Test

### Test 1: Check Token
```bash
# In browser console:
localStorage.getItem('token')
```

### Test 2: Test Upload Endpoint
```bash
# In browser console (after getting token):
const token = localStorage.getItem('token');
const formData = new FormData();
formData.append('thumbnail', yourFileHere);

fetch('http://localhost:5000/api/media/tenant-logo/YOUR-TENANT-ID', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
}).then(r => r.json()).then(console.log);
```

## 📋 What You Should See

### Successful Upload:
```
🔍 Debug - Token exists: true
🔍 Debug - Token preview: eyJhbGciOiJIUzI1NiIs...
🔍 Debug - School ID: 2d967f3c-8307-4f7e-b888-b0f93ad3c3b0
🔍 Debug - API URL: http://localhost:5000/api
📤 Uploading to: http://localhost:5000/api/media/tenant-logo/2d967f3c-8307...
📥 Response status: 200
✅ Logo uploaded successfully: {success: true, logoUrl: "https://..."}

Backend:
🔍 Backend Debug - Tenant Logo Upload
   User: { id: '...', role: 'super_admin', ... }
   Tenant ID: 2d967f3c-8307-4f7e-b888-b0f93ad3c3b0
   Has file: true
✅ File uploaded successfully: https://...
```

### Failed Upload:
```
🔍 Debug - Token exists: false/true
...
📥 Response status: 401
❌ Logo upload failed: {message: "Not authenticated"}

Backend:
Auth middleware error: JsonWebTokenError: jwt malformed
```

## 🔧 Quick Fixes to Try

### Fix 1: Refresh Your Session
```
1. Log out completely
2. Close all browser tabs
3. Clear localStorage (F12 → Application → Storage → Clear)
4. Log back in
5. Try uploading logo
```

### Fix 2: Check .env File
Verify these are set:
```env
JWT_SECRET=8c3f0d27d574dbf2c3cb9536cdcddb3eab201dd0118d3d503dd781e9e87fefe8076100c9c2fbbc45537cfab0583da9acd5d6e345db1ce036a84a393636bb4e60
VITE_API_URL=http://localhost:5000/api
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xpqVI...
```

### Fix 3: Verify Backend is Running
```bash
# Check server is running on correct port
curl http://localhost:5000/api/health
```

## 📊 Status

- ✅ Vercel Blob: Working
- ✅ Backend endpoint: Created
- ✅ Frontend UI: Complete
- ✅ Debug logging: Added
- ❓ Authentication: Needs investigation

## 🎯 Next Actions

1. **Check browser console** when uploading
2. **Look for debug messages** with 🔍 emoji
3. **Share the console output** if issue persists
4. **Verify token exists and is valid**

---

The upload system is functional, just need to verify the token is being sent correctly!

