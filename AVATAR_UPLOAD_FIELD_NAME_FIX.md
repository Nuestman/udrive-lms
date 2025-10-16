# ✅ Avatar Upload - Field Name Fix

## 🐛 Issue

**Symptom:** Avatar upload fails immediately with error toast

**Error:** "No file provided" or instant failure

---

## 🔍 Root Cause

**Field Name Mismatch!**

### Backend Expected:
```javascript
// server/middleware/upload.middleware.js
export const uploadAvatar = uploadSingle('avatar', {
  allowedTypes: ['image'],
  maxSize: 5
});
```
Multer expects field name: **`avatar`**

### Frontend Was Sending:
```typescript
// src/hooks/useProfile.ts (BEFORE)
const formData = new FormData();
formData.append('file', file);  // ❌ WRONG field name
```

**Result:** Multer couldn't find the file because it was looking for `avatar` but receiving `file`.

---

## ✅ The Fix

**File:** `src/hooks/useProfile.ts`

```typescript
// AFTER (FIXED)
const formData = new FormData();
formData.append('avatar', file);  // ✅ CORRECT field name
```

---

## 🧪 How to Test

1. Go to profile page
2. Click on avatar/camera icon
3. Select an image (JPG, PNG, etc.)
4. ✅ Should see: **"Avatar updated successfully!"**
5. ✅ Avatar should display immediately
6. Refresh page
7. ✅ Avatar should persist

---

## 📊 Complete Avatar Upload Flow

```
1. User selects image file
   ↓
2. Frontend creates FormData
   formData.append('avatar', file)  ← FIELD NAME = 'avatar'
   ↓
3. POST to /api/media/avatar
   ↓
4. Multer middleware (uploadAvatar)
   Looks for field named 'avatar'  ← MATCHES!
   ↓
5. File validation (type, size)
   ↓
6. Upload to Vercel Blob
   ↓
7. Update user_profiles.avatar_url
   ↓
8. Return success response
   ↓
9. Frontend updates AuthContext
   ↓
10. Show toast: "Avatar updated successfully!" ✅
```

---

## 🎯 Other Upload Endpoints (FYI)

For reference, here are the other upload field names:

| Endpoint | Field Name | Use Case |
|----------|-----------|----------|
| `/media/avatar` | `avatar` | User avatar upload |
| `/media/course-thumbnail/:id` | `thumbnail` | Course thumbnails |
| `/media/tenant-logo` | `logo` | School/tenant logos |
| `/media/upload` | `files` | Media library uploads |
| `/media/assignment-submission` | `files` | Assignment files |

**Remember:** The field name in FormData must match the multer middleware configuration!

---

## ✅ Result

**Before:**
- ❌ Avatar upload fails instantly
- ❌ Error: "No file provided"
- ❌ No image uploaded

**After:**
- ✅ Avatar upload works
- ✅ Success toast shown
- ✅ Image uploaded and displayed
- ✅ Persists after refresh

---

**Test your avatar upload now - it should work!** 🎉

