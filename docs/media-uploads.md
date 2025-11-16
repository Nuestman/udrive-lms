## Media Uploads - Overview

This document describes how media uploads are handled across the platform, including storage organization, filename rules, and server APIs.

### Storage Backend

- Vercel Blob is used for object storage.
- Public, cacheable URLs are returned after upload.
- Access is controlled via application auth; files themselves are public for simplicity (can be tightened later).

### Directory Structure

Files are organized per tenant and course.

```
tenants/{tenant}/
  avatars/
  logos/
  courses/
    {course}/
      thumbnails/         # Course thumbnails (per course)
      lessons/            # Lesson media (documents and videos)
      announcements/
      support/
  assignments/
  certificates/
  media-library/
    images/
    videos/
    audio/
    documents/
```

Notes:
- Lesson media and thumbnails are siloed inside each course folder for clear boundaries.
- If a category is unmapped, files fall back to `misc/` and a warning is logged.

### Filename Scheme

Baseline format:

```
{tenant}-{category}-{timestamp}-{shortId}[-{randomSuffix}].ext
```

Context-based augmentations (temporary, pending a broader review):
- Lesson media: `_{lesson-slug}` is appended before the extension when lesson context is available.
- Course thumbnails: `_{course-slug}` is appended before the extension when uploading a course thumbnail.

Examples:

- Lesson video:
  `uptown-learners_lesson_2025-11-16_09-13-12-913_8692b58a-safe-driving-101-RANDOM.mp4`

- Course thumbnail:
  `uptown-learners_thumbnail_2025-11-16_09-13-12-913_8692b58a-pro-eating-RANDOM.png`

Implementation points:
- Filenames are built in `server/utils/storage.js` via `generateFilename(...)`.
- The raw category, course/lesson name/slug are passed down from upload routes/services.

### Server Entry Points

- Media upload (generic): `POST /api/media/upload`
  - Multipart field: `files` (one or more)
  - Body (subset): `storageCategory`, `audienceScope`, `courseId`, `courseSlug`, `moduleId`, `lessonId`, `lessonTitle`, `lessonSlug`, `tags`
  - Category inference is supported via `audienceScope` when `storageCategory` is not provided.

- Course thumbnail: `POST /api/media/course-thumbnail/:courseId`
  - Multipart field: `thumbnail`
  - Persists to `tenants/{tenant}/courses/{course}/thumbnails`
  - Filename augmented with course slug as above.

### Validation

- Multer memory storage used for uploads.
- Category-aware allowed types and size limits enforced (`server/middleware/upload.middleware.js`).
- Additional validation helpers in `server/utils/storage.js`.

### Database Metadata

Upon successful upload, key metadata are persisted in `media_files`:
- `tenant_id`, `uploaded_by`, `filename`, `original_filename`, `file_type`, `file_size`, `mime_type`, `file_url`
- `metadata` JSON includes `pathname`, timestamps, storage category, audience scope, and contextual IDs (course/module/lesson/etc.).

### Logging

- Upload route logs audience scope, selected storage category, and context IDs.
- Storage utilities log the full upload destination and resulting URL.
- When filename augmentation applies, a debug log prints the computed lesson/course slug.

### Frontend Helpers

- File selection and upload are handled via `uploadFileWithProgress` in `src/utils/upload.utils.ts`.
- Lesson editor uses helpers in `src/utils/storagePaths.ts` to normalize course/tenant info.

### Future Enhancements

- Review and finalize filename rules (current augmentation is explicitly temporary).
- Optional private access with signed URLs per-file.
- Versioning / soft-replace mechanics.


