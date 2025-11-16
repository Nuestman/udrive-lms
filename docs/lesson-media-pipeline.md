## Lesson Media Pipeline

This page documents the end-to-end flow for lesson media (documents and videos), from the Lesson Editor UI to storage and database.

### 1) User Flow

- Instructor opens the Lesson Editor and selects “Video” or “Document” type.
- They either paste a streaming URL (for video) or upload a file (video/document).
- The UI shows progress, validates type/size, and displays metadata once complete.

### 2) Frontend Components

- Entry point: `src/components/lessons/LessonEditorModal.tsx`
  - Uses `uploadFileWithProgress(...)` to POST to `/api/media/upload`.
  - Provides lesson/course/tenant context in the form-data (e.g., `lessonTitle`, `lessonSlug`, `courseSlug`, `courseId`, `storageCategory` as `lesson-video` or `lesson-document`).
  - Renames the local file client-side for readability using `renameFileForCourse(...)` (slugified lesson title + original extension).

- Utilities:
  - `src/utils/upload.utils.ts` – XHR upload with progress, validation, accepted types.
  - `src/utils/storagePaths.ts` – Slug helpers and course storage context builders.

### 3) API Route

- `POST /api/media/upload`
  - Middleware validates files (type/size) via multer memory storage.
  - Infers or uses `storageCategory` from the request (`lesson-video` / `lesson-document`).
  - Forwards contextual fields to the media service (tenant, user, course, module, lesson, audience scope, tags).
  - Logs request context and chosen storage category.

### 4) Service Layer

- `server/services/media.service.js`
  - Resolves human-friendly names (tenant, course, module, lesson) from provided IDs if necessary.
  - Uploads the file via `uploadFile(...)` from `server/utils/storage.js`.
  - Persists a `media_files` row with file metadata and contextual JSON (`metadata` column).

### 5) Storage Organization

- Path resolver: `server/utils/storage.js` → `buildStoragePath(...)`
  - Lesson media stored at:

```
tenants/{tenant}/courses/{course}/lessons
```

### 6) Filename Generation

- Filename builder: `server/utils/storage.js` → `generateFilename(...)`
  - Base: `{tenant}-{category}-{timestamp}-{shortId}` and the original file extension.
  - Lesson augmentation: When lesson context is present, the filename appends `_{lesson-slug}` just before the extension.
  - Example:

```
uptown-learners_lesson_2025-11-16_09-13-12-913_8692b58a-safe-driving-101-RANDOM.mp4
```

Notes:
- A random suffix may be appended by storage to guarantee uniqueness.
- Augmented naming is a temporary measure to aid discoverability; a broader naming review is planned.

### 7) Validation & Limits

- Frontend and backend both validate types and sizes.
- See `server/middleware/upload.middleware.js` for backend constraints.

### 8) Logging

- Route logs include audience scope, selected storage category, and context IDs.
- Filename generator logs the computed lesson slug and the final upload path.

### 9) Error Handling

- Clear client feedback for validation failures and network errors.
- Server returns structured error JSON; upload middleware catches multer errors (size/count).

### 10) Future Work

- Finalize filename conventions and optional per-lesson subfolders if desired.
- Support signed URLs and private access scopes.


