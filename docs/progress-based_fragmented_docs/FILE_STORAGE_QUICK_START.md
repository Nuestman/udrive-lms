# File Storage System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your Vercel Blob Token

1. Go to https://vercel.com/dashboard
2. Select your project (or create one)
3. Navigate to **Storage** → **Blob**
4. Click **Create Store** (if you haven't already)
5. Copy your `BLOB_READ_WRITE_TOKEN`

### Step 2: Add Token to .env

Add this line to your `.env` file:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxx
```

### Step 3: Restart Your Servers

```bash
# Stop current servers (Ctrl+C)
# Then restart:
npm run dev
```

That's it! The file storage system is now ready to use.

## ✅ Test It Works

### Test 1: Upload an Avatar

1. Log in to your application
2. Go to your profile settings
3. Click on your avatar/profile picture
4. Select an image file
5. Watch it upload with progress bar
6. ✅ Avatar should update immediately

### Test 2: Upload Course Thumbnail

1. Go to Courses page
2. Create or edit a course
3. Click on the thumbnail upload area
4. Select an image
5. ✅ Thumbnail should appear in course card

### Test 3: Media Library

1. Go to any lesson editor
2. Click "Media Library" or "Insert Image"
3. Click "Upload" button
4. Select one or more files
5. ✅ Files should appear in the media library

### Test 4: Assignment Submission

1. As a student, go to an assignment
2. Click "Choose Files" to upload
3. Select files to submit
4. ✅ Files should upload with progress

## 📁 Where Files Go

All files are automatically organized like this:

```
vercel-blob/
└── tenants/
    └── {your-school-id}/
        ├── avatars/              → Profile pictures
        ├── courses/
        │   ├── thumbnails/       → Course images
        │   └── {course-id}/      → Course files
        ├── lessons/
        │   └── {lesson-id}/      → Lesson media
        ├── assignments/
        │   └── {assignment-id}/  → Student work
        └── media-library/        → General files
            ├── images/
            ├── videos/
            ├── audio/
            └── documents/
```

## 🎯 What's Implemented

### ✅ Backend (Server)

- **Storage Utilities** (`server/utils/storage.js`)
  - Intelligent file organization
  - Automatic sanitization
  - Human-readable timestamps
  - Context-aware naming

- **Upload Middleware** (`server/middleware/upload.middleware.js`)
  - File type validation
  - Size limit enforcement
  - Multi-file support
  - Error handling

- **Media Service** (`server/services/media.service.js`)
  - Upload operations
  - File management
  - Database integration
  - Statistics tracking

- **API Routes** (`server/routes/media.js`)
  - `/api/media/avatar` - Upload avatars
  - `/api/media/course-thumbnail/:id` - Course images
  - `/api/media/upload` - General uploads
  - `/api/media/assignment-submission/:id` - Assignments
  - `/api/media` - List/search files
  - `/api/media/:id` - Get/update/delete file
  - `/api/media/stats` - Storage statistics

### ✅ Frontend (Client)

- **Upload Utilities** (`src/utils/upload.utils.ts`)
  - File validation
  - Size formatting
  - Progress tracking
  - Image compression

- **Hooks** (`src/hooks/`)
  - `useFileUpload` - Single file uploads
  - `useMultipleFileUpload` - Multiple files
  - `useMedia` - Media library management
  - `useAvatarUpload` - Avatar handling
  - `useCourseThumbnailUpload` - Course images
  - `useAssignmentUpload` - Assignment files

- **Components**
  - `AvatarUpload` - Drag-drop avatar uploader
  - `MediaLibrary` - Full media management
  - Ready for integration

## 🔒 Security Features

- ✅ JWT Authentication required
- ✅ Tenant isolation enforced
- ✅ File type restrictions
- ✅ Size limits per category
- ✅ Sanitized filenames
- ✅ Secure URLs from Vercel

## 📊 File Limits

| Category | Max Size | Allowed Types |
|----------|----------|---------------|
| Avatar | 5 MB | JPG, PNG, WebP |
| Thumbnail | 5 MB | JPG, PNG, WebP |
| Image | 10 MB | JPG, PNG, GIF, WebP, SVG |
| Video | 100 MB | MP4, MPEG, MOV, AVI, WebM |
| Audio | 50 MB | MP3, WAV, OGG, WebM |
| Document | 20 MB | PDF, DOC, DOCX, XLS, XLSX, etc. |

## 🎨 Example Usage

### Upload Avatar

```typescript
import { useAvatarUpload } from '../hooks/useMedia';

const { uploadAvatar, uploading } = useAvatarUpload();

const handleUpload = async (file: File) => {
  const result = await uploadAvatar(file);
  console.log('Avatar URL:', result.avatarUrl);
};
```

### Upload to Media Library

```typescript
import { useMediaOperations } from '../hooks/useMedia';

const { uploadFiles } = useMediaOperations();

const handleUpload = async (files: File[]) => {
  await uploadFiles(files, 'image', ['lesson', 'demo']);
};
```

### Use Avatar Component

```typescript
import { AvatarUpload } from '../components/common/AvatarUpload';

<AvatarUpload
  currentAvatarUrl={user.avatar_url}
  onUploadSuccess={(url) => updateUserAvatar(url)}
  size="lg"
/>
```

## 🐛 Troubleshooting

### Error: "Failed to upload file"

**Solution:**
1. Check your `BLOB_READ_WRITE_TOKEN` is correct
2. Verify token has write permissions
3. Ensure file size doesn't exceed limits

### Error: "File type not allowed"

**Solution:**
- Check file extension matches allowed types
- For avatars: only images allowed
- For documents: check supported formats

### Files upload but don't appear

**Solution:**
1. Check browser console for errors
2. Verify database connection
3. Check API endpoint returns success
4. Refresh the file list

### Slow upload speeds

**Solution:**
- Compress images before upload (automatic for avatars)
- Check network connection
- Consider smaller file sizes
- Upload fewer files at once

## 📖 Full Documentation

For complete documentation, see: `FILE_STORAGE_SYSTEM.md`

## 🎉 You're All Set!

The file storage system is production-ready and includes:

- ✅ Secure, scalable storage
- ✅ Intelligent organization
- ✅ Beautiful UI components
- ✅ Real-time progress tracking
- ✅ Comprehensive validation
- ✅ Multi-tenant isolation
- ✅ Full CRUD operations

Start uploading files and enjoy a professional file management experience! 🚀

---

Need help? Check the main documentation or review the code examples above.

