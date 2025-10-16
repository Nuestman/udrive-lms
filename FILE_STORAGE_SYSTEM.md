# UDrive LMS - File Storage System Documentation

## Overview

The UDrive LMS uses **Vercel Blob Storage** for scalable, production-ready file storage. This system provides a comprehensive solution for managing all file uploads across the application with intelligent organization, consistent naming, and robust security.

## Architecture

### Storage Structure

```
vercel-blob-storage/
└── tenants/
    └── {tenant_id}/
        ├── avatars/                    # User profile pictures
        ├── courses/
        │   ├── thumbnails/             # Course thumbnail images
        │   └── {course_id}/            # Course-specific files
        ├── lessons/
        │   └── {lesson_id}/            # Lesson-specific files
        ├── assignments/
        │   └── {assignment_id}/        # Student submissions
        ├── certificates/               # Generated certificates
        └── media-library/              # General media files
            ├── images/
            ├── videos/
            ├── audio/
            └── documents/
```

### Key Features

- **Tenant Isolation**: All files are organized by tenant ID for complete data isolation
- **Intelligent Categorization**: Files are automatically organized into logical directories
- **Sanitized Filenames**: All filenames are sanitized and made URL-safe
- **Human-Readable Dates**: Uses `YYYY-MM-DD_HH-MM-SS` format for timestamps
- **Context-Aware Naming**: Files include contextual information (user names, IDs)
- **Secure Access**: All uploads require authentication
- **File Validation**: Type and size validation on both client and server
- **Progress Tracking**: Real-time upload progress for better UX

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### 2. Get Your Vercel Blob Token

1. Go to https://vercel.com/dashboard
2. Select your project
3. Navigate to **Storage** → **Blob**
4. Create a new Blob store (if you haven't already)
5. Copy the `BLOB_READ_WRITE_TOKEN`
6. Paste it into your `.env` file

## Usage

### Backend API Endpoints

#### 1. Upload Avatar

```javascript
POST /api/media/avatar
Content-Type: multipart/form-data

Body:
  avatar: File (image only, max 5MB)

Response:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://..."
}
```

#### 2. Upload Course Thumbnail

```javascript
POST /api/media/course-thumbnail/:courseId
Content-Type: multipart/form-data

Body:
  thumbnail: File (image only, max 5MB)

Response:
{
  "success": true,
  "message": "Course thumbnail uploaded successfully",
  "thumbnailUrl": "https://..."
}
```

#### 3. Upload to Media Library

```javascript
POST /api/media/upload
Content-Type: multipart/form-data

Body:
  files: File[] (multiple files, max 100MB each)
  category: string (image|video|audio|document)
  tags: string (comma-separated)

Response:
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "files": [...]
}
```

#### 4. Upload Assignment Files

```javascript
POST /api/media/assignment-submission/:assignmentId
Content-Type: multipart/form-data

Body:
  files: File[] (max 5 files, 50MB each)

Response:
{
  "success": true,
  "message": "2 file(s) uploaded successfully",
  "files": [...]
}
```

#### 5. Get Media Files

```javascript
GET /api/media?fileType=image&search=test&limit=50&offset=0

Response:
{
  "success": true,
  "files": [...],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### 6. Delete Media File

```javascript
DELETE /api/media/:fileId

Response:
{
  "success": true,
  "message": "Media file deleted successfully"
}
```

#### 7. Delete Multiple Files

```javascript
POST /api/media/delete-multiple

Body:
{
  "fileIds": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
  "success": true,
  "message": "3 file(s) deleted successfully"
}
```

#### 8. Get Storage Statistics

```javascript
GET /api/media/stats

Response:
{
  "success": true,
  "stats": {
    "total_files": 245,
    "total_size": 1573928463,
    "image_count": 102,
    "video_count": 45,
    "audio_count": 23,
    "document_count": 75,
    "image_size": 524288000,
    "video_size": 943718400,
    ...
  }
}
```

### Frontend Hooks

#### 1. useFileUpload - Single File Upload

```typescript
import { useFileUpload } from '../hooks/useFileUpload';

function MyComponent() {
  const { upload, uploading, progress, error, uploadedFile } = useFileUpload({
    endpoint: '/api/media/avatar',
    fieldName: 'avatar',
    category: 'avatar',
    onSuccess: (response) => {
      console.log('Upload successful!', response);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  const handleFileSelect = async (file: File) => {
    await upload(file);
  };

  return (
    <div>
      {uploading && <div>Progress: {progress}%</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

#### 2. useMultipleFileUpload - Multiple Files

```typescript
import { useMultipleFileUpload } from '../hooks/useFileUpload';

function MediaUploader() {
  const { upload, uploading, filesProgress, errors, uploadedFiles } = useMultipleFileUpload({
    endpoint: '/api/media/upload',
    fieldName: 'files',
    category: 'image',
    additionalData: { tags: 'lesson,demo' }
  });

  const handleFilesSelect = async (files: File[]) => {
    await upload(files);
  };

  return (
    <div>
      {uploading && <div>Uploading files...</div>}
      {Object.entries(filesProgress).map(([filename, progress]) => (
        <div key={filename}>{filename}: {progress}%</div>
      ))}
    </div>
  );
}
```

#### 3. useMedia - Media Library Management

```typescript
import { useMedia } from '../hooks/useMedia';

function MediaLibrary() {
  const { files, loading, error, total, refreshFiles } = useMedia({
    fileType: 'image',
    search: 'lesson',
    limit: 50
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Total files: {total}</p>
      {files.map(file => (
        <div key={file.id}>
          <img src={file.file_url} alt={file.original_filename} />
        </div>
      ))}
    </div>
  );
}
```

#### 4. useAvatarUpload - Avatar Upload

```typescript
import { useAvatarUpload } from '../hooks/useMedia';

function ProfileSettings() {
  const { uploadAvatar, uploading, error } = useAvatarUpload();

  const handleAvatarChange = async (file: File) => {
    try {
      const result = await uploadAvatar(file);
      console.log('Avatar URL:', result.avatarUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={(e) => handleAvatarChange(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

#### 5. useCourseThumbnailUpload - Course Thumbnails

```typescript
import { useCourseThumbnailUpload } from '../hooks/useMedia';

function CourseEditor({ courseId }) {
  const { uploadThumbnail, uploading, error } = useCourseThumbnailUpload();

  const handleThumbnailUpload = async (file: File) => {
    try {
      const result = await uploadThumbnail(file, courseId);
      console.log('Thumbnail URL:', result.thumbnailUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={(e) => handleThumbnailUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

#### 6. useAssignmentUpload - Assignment Submissions

```typescript
import { useAssignmentUpload } from '../hooks/useMedia';

function AssignmentSubmission({ assignmentId }) {
  const { uploadFiles, uploading, error, progress } = useAssignmentUpload();

  const handleFilesUpload = async (files: File[]) => {
    try {
      const result = await uploadFiles(files, assignmentId);
      console.log('Files uploaded:', result);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => handleFilesUpload(Array.from(e.target.files))}
        disabled={uploading}
      />
      {uploading && <div>Progress: {progress}%</div>}
    </div>
  );
}
```

### Components

#### 1. AvatarUpload Component

```typescript
import { AvatarUpload } from '../components/common/AvatarUpload';

function UserProfile({ currentAvatarUrl }) {
  const handleAvatarUploaded = (newAvatarUrl: string) => {
    console.log('New avatar:', newAvatarUrl);
    // Update user profile
  };

  return (
    <AvatarUpload
      currentAvatarUrl={currentAvatarUrl}
      onUploadSuccess={handleAvatarUploaded}
      size="lg"
    />
  );
}
```

## File Validation

### File Type Restrictions

```javascript
// Avatar: JPG, PNG, WebP (max 5MB)
// Course Thumbnail: JPG, PNG, WebP (max 5MB)
// Images: JPG, PNG, GIF, WebP, SVG (max 10MB)
// Videos: MP4, MPEG, MOV, AVI, WebM (max 100MB)
// Audio: MP3, WAV, OGG, WebM (max 50MB)
// Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (max 20MB)
```

### Validation Utilities

```typescript
import { 
  validateFile, 
  validateFileType, 
  validateFileSize 
} from '../utils/upload.utils';

// Validate a file
const validation = validateFile(file, 'avatar');
if (!validation.valid) {
  alert(validation.error);
  return;
}

// Check file type only
const isValidType = validateFileType(file, 'image');

// Check file size only
const isValidSize = validateFileSize(file, 'avatar');
```

## Filename Sanitization

The system automatically sanitizes filenames to be:
- **URL-safe**: Removes special characters
- **Lowercase**: Converts to lowercase
- **Hyphenated**: Spaces replaced with hyphens
- **Timestamped**: Includes human-readable timestamp
- **Contextual**: Includes user/course/lesson context

### Example Transformations

```
Original: "My Course Image (Final).jpg"
Result: "my-course-image-final_john-doe_2025-01-15_14-30-45_abc123de.jpg"

Original: "Traffic Rules - Video Lesson.mp4"
Result: "traffic-rules-video-lesson_instructor-smith_2025-01-15_14-30-45_xyz789ab.mp4"
```

## Database Schema

Files are stored in the `media_files` table:

```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    uploaded_by UUID REFERENCES users(id),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security

### Authentication

All upload endpoints require JWT authentication:
```javascript
headers: {
  'Authorization': 'Bearer <your_jwt_token>'
}
```

### Tenant Isolation

- Files are automatically isolated by tenant
- Users can only access files from their tenant
- Super admins can access all tenants

### File Validation

- **Server-side**: All files validated on upload
- **Client-side**: Pre-upload validation for better UX
- **Type checking**: Only allowed file types accepted
- **Size limits**: Enforced per file category
- **Malicious content**: Consider adding virus scanning for production

## Best Practices

### 1. Always Validate Client-Side

```typescript
const validation = validateFile(file, 'image');
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### 2. Show Upload Progress

```typescript
const { progress } = useFileUpload({...});

return (
  <div className="progress-bar">
    <div style={{ width: `${progress}%` }} />
  </div>
);
```

### 3. Handle Errors Gracefully

```typescript
const { error } = useFileUpload({
  onError: (err) => {
    console.error('Upload failed:', err);
    // Show user-friendly message
    showToast('Failed to upload file. Please try again.');
  }
});
```

### 4. Compress Large Images

```typescript
import { compressImage } from '../utils/upload.utils';

if (file.size > 1024 * 1024) { // If > 1MB
  file = await compressImage(file, 1920, 0.85);
}
```

### 5. Clean Up Unused Files

```typescript
// When deleting a course, also delete its media
await deleteMultipleFiles(courseMediaFileIds);

// When user changes avatar, delete old avatar
if (oldAvatarUrl) {
  await deleteFile(oldAvatarFileId);
}
```

## Troubleshooting

### Issue: "Failed to upload file"
- **Check**: Verify BLOB_READ_WRITE_TOKEN is set correctly
- **Check**: File size doesn't exceed limits
- **Check**: File type is allowed for the category

### Issue: "File not found"
- **Check**: File URL is correct
- **Check**: User has access to the tenant
- **Check**: File wasn't deleted

### Issue: "Slow uploads"
- **Solution**: Compress large files before upload
- **Solution**: Use proper image formats (WebP for images)
- **Solution**: Split large batches into smaller chunks

### Issue: "Upload progress stuck"
- **Check**: Network connection
- **Check**: Server is running
- **Check**: No errors in browser console

## Migration from Local Storage

If you're migrating from local file storage:

1. **Export file paths** from database
2. **Upload to Vercel Blob** using migration script
3. **Update database** with new Blob URLs
4. **Verify** all files accessible
5. **Clean up** old local storage

## Performance Tips

1. **Use thumbnails** for image galleries
2. **Lazy load** large media files
3. **Implement pagination** for file lists
4. **Cache** frequently accessed files
5. **Use CDN** (Vercel Blob includes CDN)

## Support

For issues or questions:
- Check Vercel Blob documentation: https://vercel.com/docs/storage/vercel-blob
- Review this documentation
- Check application logs for errors

## Future Enhancements

- [ ] Image auto-optimization (resize, format conversion)
- [ ] Video transcoding
- [ ] Virus scanning integration
- [ ] Advanced search and filtering
- [ ] Bulk file operations
- [ ] File versioning
- [ ] Usage analytics

---

Last updated: January 2025

