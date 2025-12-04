# SCORM 1.2 Implementation Documentation

## Overview

This document describes the SCORM 1.2 integration in SunLMS, including architecture, implementation details, current status, and the plan for full integration with the course/lesson/completion tracking system.

## Table of Contents

1. [Architecture](#architecture)
2. [Data Model](#data-model)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Content Delivery](#content-delivery)
6. [SCORM Runtime API](#scorm-runtime-api)
7. [Current Status](#current-status)
8. [Integration Plan](#integration-plan)
9. [Known Issues & Limitations](#known-issues--limitations)
10. [Testing](#testing)

---

## Architecture

### High-Level Flow

```
1. Admin uploads SCORM package (.zip)
   ↓
2. Backend extracts zip, parses imsmanifest.xml
   ↓
3. Files uploaded to Vercel Blob storage
   ↓
4. Package metadata & SCOs stored in PostgreSQL
   ↓
5. Course created/linked to SCORM package
   ↓
6. Student accesses SCORM course
   ↓
7. Frontend loads ScormCoursePlayer component
   ↓
8. SCORM content served via same-origin proxy
   ↓
9. SCORM Runtime API (window.API) exposed to content
   ↓
10. Content communicates via SCORM API
   ↓
11. Progress tracked in scorm_attempts table
   ↓
12. (TODO) Sync to unified content_progress system
```

### Key Components

- **Backend Routes** (`server/routes/scorm.js`): Package upload, SCO listing, runtime commit
- **Backend Services** (`server/services/scorm.service.js`): Business logic for SCORM operations
- **Content Streaming** (`server/index.js`): Same-origin content delivery via path-style URLs
- **Frontend Player** (`src/components/scorm/ScormCoursePlayer.tsx`): React component for playing SCORM content
- **SCORM Runtime API**: JavaScript API exposed to SCORM content for progress tracking

---

## Data Model

### Database Tables

#### `scorm_packages`
Stores SCORM package metadata.

```sql
- id (UUID, PK)
- title (TEXT)
- version (ENUM: 'SCORM_1_2', 'SCORM_2004')
- tenant_id (UUID, FK → tenants)
- course_id (UUID, FK → courses, nullable)
- owner_id (UUID, FK → users)
- original_zip_url (TEXT) - Vercel Blob URL of uploaded zip
- content_base_path (TEXT) - Base URL for extracted content in Vercel Blob
- created_at, updated_at (TIMESTAMP)
```

#### `scorm_scos`
Stores individual Sharable Content Objects (SCOs) from the package.

```sql
- id (UUID, PK)
- package_id (UUID, FK → scorm_packages)
- identifier (TEXT) - SCO identifier from manifest
- title (TEXT)
- launch_path (TEXT) - Relative path to SCO entry point (e.g., "Playing/Playing.html")
- is_entry_point (BOOLEAN) - Whether this is the default entry SCO
- created_at (TIMESTAMP)
```

#### `scorm_attempts`
Tracks learner progress per SCO per attempt.

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- sco_id (UUID, FK → scorm_scos)
- attempt_no (INTEGER)
- lesson_status (TEXT) - 'not attempted', 'incomplete', 'completed', 'passed', 'failed', 'browsed'
- score_raw (DECIMAL) - Raw score (0-100)
- lesson_location (TEXT) - Bookmark/position
- suspend_data (TEXT) - State data for resuming
- total_time_seconds (INTEGER) - Cumulative time spent
- session_time_seconds (INTEGER) - Time in current session
- started_at, finished_at, last_commit_at (TIMESTAMP)
- cmi_data (JSONB) - Full CMI data snapshot for debugging
- created_at, updated_at (TIMESTAMP)
- UNIQUE(user_id, sco_id, attempt_no)
```

### Relationships

- `scorm_packages` → `courses` (one-to-one, optional)
- `scorm_packages` → `scorm_scos` (one-to-many)
- `scorm_scos` → `scorm_attempts` (one-to-many)
- `lessons` → `scorm_scos` (one-to-one, via `scorm_sco_id`)

---

## Backend Implementation

### Package Upload (`POST /api/scorm/upload`)

**Location**: `server/routes/scorm.js`

**Process**:
1. Accept `.zip` file upload
2. Stream to Vercel Blob storage
3. Extract zip to temporary local directory
4. Parse `imsmanifest.xml` to identify SCOs
5. Upload all extracted files to Vercel Blob under `tenants/{tenantName}/scorm/content/{packageName-{shortId}}/`
6. Insert package and SCO records into database
7. Clean up temporary directory

**Key Functions**:
- `createScormPackageFromUpload()` in `server/services/scorm.service.js`

### Content Streaming (`GET /api/scorm/content/:packageId/*`)

**Location**: `server/index.js` (app.use middleware)

**URL Format**: Path-style URLs
- `/api/scorm/content/<packageId>/Playing/Playing.html`
- `/api/scorm/content/<packageId>/static/js/main.js`
- `/api/scorm/content/<packageId>/content/snapshots/s.json`

**Process**:
1. Parse path to extract `packageId` and file path
2. Look up `content_base_path` from database
3. Stream file from Vercel Blob to browser
4. Set headers: `X-Frame-Options: SAMEORIGIN`, `Cache-Control: no-cache`

**Why Path-Style?**
- Allows relative URLs in SCORM content to resolve naturally
- Browser automatically resolves `playing.jpg` → `/api/scorm/content/<packageId>/Playing/playing.jpg`
- No HTML rewriting needed

### Runtime Commit (`POST /api/scorm/runtime/commit`)

**Location**: `server/routes/scorm.js`

**Payload**:
```json
{
  "scoId": "uuid",
  "attemptNo": 1,
  "cmi": {
    "lesson_status": "completed",
    "score_raw": 85,
    "lesson_location": "page_3",
    "suspend_data": "...",
    "total_time_seconds": 1200,
    "session_time_seconds": 300
  }
}
```

**Process**:
1. Upsert `scorm_attempts` record
2. Update `finished_at` if status is `completed`/`passed`/`failed`
3. Store full CMI data in `cmi_data` JSONB column

**Current Limitation**: 
- Attempts to sync to `lesson_progress` table, but system now uses unified `content_progress`
- Integration with unified progress system is pending (see [Integration Plan](#integration-plan))

---

## Frontend Implementation

### SCORM Course Player Component

**Location**: `src/components/scorm/ScormCoursePlayer.tsx`

**Features**:
- Fetches course and SCORM package/SCO information
- Constructs launch URL: `/api/scorm/content/<packageId>/<launchPath>`
- Implements SCORM 1.2 Runtime API (`window.API`)
- Renders SCORM content in iframe
- Provides fullscreen toggle
- Shows loading/error states
- Handles SCO navigation (for multi-SCO packages)

### Launch URL Construction

```typescript
const buildLaunchUrl = (pkg: ScormPackage, sco: ScormSco): string => {
  const launchPath = sco.launch_path
    .replace(/^\/+/, '')
    .replace(/\.\./g, '')
    .replace(/\0/g, '');
  
  return `/api/scorm/content/${pkg.id}/${encodeURI(launchPath)}`;
};
```

### SCORM Runtime API

The component exposes a SCORM 1.2 Runtime API on `window.API` and `window.top.API`:

**Required Functions**:
- `LMSInitialize()` - Initialize SCORM session
- `LMSFinish()` - End SCORM session
- `LMSGetValue(element)` - Get CMI data element value
- `LMSSetValue(element, value)` - Set CMI data element value
- `LMSCommit()` - Save current state to backend
- `LMSGetLastError()` - Get last error code
- `LMSGetErrorString(errorCode)` - Get error description
- `LMSGetDiagnostic(errorCode)` - Get diagnostic info

**Implementation**:
- Maintains in-memory CMI data model
- On `LMSCommit()`, POSTs to `/api/scorm/runtime/commit`
- Handles error codes per SCORM 1.2 spec

---

## Content Delivery

### Storage Architecture

**Vercel Blob Storage Structure**:
```
tenants/
  {tenant-name}/
    scorm/
      content/
        {package-name-{shortId}}/
          index.html (or launch file)
          static/
            js/
              main.{hash}.chunk.js
              ...
            css/
              main.{hash}.chunk.css
              ...
          content/
            snapshots/
              s.json
          Playing/
            Playing.html
            playing.jpg
          ...
```

### Same-Origin Requirement

**Why?**
- SCORM content must access `window.parent.API` to communicate with LMS
- Browser same-origin policy blocks cross-origin access
- Content and API must be on same domain/port

**Solution**:
- Serve SCORM content through our backend (`/api/scorm/content/...`)
- Content appears to be on same origin as LMS
- SCORM API accessible via `window.parent.API`

### Path Resolution

**Example**:
- Main HTML: `/api/scorm/content/abc123/index.html`
- Relative image: `images/logo.png`
- Resolves to: `/api/scorm/content/abc123/images/logo.png` ✅

**Absolute paths** (e.g., `/shared/style.css`):
- These won't resolve correctly unless they exist in the package
- Some packages may have hardcoded absolute paths that don't match our structure

---

## SCORM Runtime API

### CMI Data Model

The Runtime API maintains a CMI (Course Management Interoperability) data model:

**Core Elements**:
- `cmi.core.student_id` - Learner identifier
- `cmi.core.student_name` - Learner name
- `cmi.core.lesson_status` - Completion status
- `cmi.core.score.raw` - Numeric score (0-100)
- `cmi.core.lesson_location` - Bookmark/position
- `cmi.suspend_data` - State data for resuming
- `cmi.core.total_time` - Cumulative time spent
- `cmi.core.session_time` - Time in current session
- `cmi.core.exit` - Exit status ('time-out', 'suspend', 'logout', 'normal')

### Status Values

- `not attempted` - Learner hasn't started
- `incomplete` - Learner has started but not completed
- `completed` - Learner completed (may or may not have passed)
- `passed` - Learner passed (typically score >= passing threshold)
- `failed` - Learner failed (score < passing threshold)
- `browsed` - Learner viewed but didn't engage

### Commit Flow

1. SCORM content calls `LMSSetValue('cmi.core.lesson_status', 'completed')`
2. Content calls `LMSCommit()`
3. Frontend Runtime API POSTs to `/api/scorm/runtime/commit`
4. Backend upserts `scorm_attempts` record
5. Backend returns success/error to Runtime API
6. Runtime API returns error code to content

---

## Current Status

### ✅ Completed

1. **Package Upload & Extraction**
   - Zip upload to Vercel Blob
   - Local extraction and re-upload of individual files
   - Manifest parsing (`imsmanifest.xml`)
   - Database storage of packages and SCOs

2. **Content Delivery**
   - Same-origin path-style content streaming
   - Proper CORS and iframe headers
   - Path sanitization and security

3. **SCORM Runtime API**
   - Full SCORM 1.2 Runtime API implementation
   - CMI data model management
   - Backend commit endpoint
   - Progress tracking in `scorm_attempts`

4. **Frontend Player**
   - Dedicated SCORM course player component
   - Iframe rendering with proper sandbox attributes
   - Fullscreen toggle
   - Loading/error states
   - SCO navigation (for multi-SCO packages)

5. **Database Schema**
   - All required tables created
   - Proper relationships and constraints
   - Tenant isolation

### ⚠️ Partial / Needs Work

1. **Progress Integration**
   - SCORM attempts stored in `scorm_attempts` ✅
   - Sync to unified `content_progress` system ❌
   - Enrollment progress calculation ❌
   - Course completion tracking ❌

2. **Lesson Linking**
   - SCORM packages can be linked to courses ✅
   - Individual SCOs not yet linked to lessons ❌
   - Need to map SCOs to lessons for proper tracking

3. **Error Handling**
   - Basic error handling in place ✅
   - Missing files show 404 (expected) ✅
   - Some packages may have hardcoded paths that don't exist ❌

### ❌ Not Started

1. **SCORM 2004 Support**
   - Schema supports version enum
   - No implementation yet

2. **Advanced Features**
   - Sequencing and navigation (SCORM 2004)
   - Multiple attempts per SCO
   - Detailed analytics/reporting

---

## Integration Plan

### Goal

Integrate SCORM progress tracking with the unified course/lesson/completion system so that:
- SCORM course completion counts toward course progress
- SCORM lessons appear in student progress dashboards
- Enrollment progress percentage includes SCORM content
- Certificates can be issued for SCORM course completion

### Current Progress System

The system uses a **unified `content_progress` table**:

```sql
content_progress:
  - content_id (UUID) - ID of lesson or quiz
  - content_type (TEXT) - 'lesson' or 'quiz'
  - student_id (UUID)
  - status (TEXT) - 'in_progress', 'completed'
  - completed_at (TIMESTAMP)
  - started_at (TIMESTAMP)
```

**Progress Calculation**:
- `updateEnrollmentProgress()` counts completed lessons + quizzes
- Calculates percentage: `(completed / total) * 100`
- Updates `enrollments.progress_percentage`
- Marks enrollment as `completed` when progress = 100%

### Integration Steps

#### Step 1: Link SCOs to Lessons

**Current State**: 
- `lessons` table has `scorm_sco_id` column (nullable)
- But SCOs aren't being linked when courses are created from SCORM packages

**Action Required**:
1. When creating a course from SCORM package, create lessons for each SCO
2. Set `lessons.scorm_sco_id` to the corresponding SCO ID
3. Set `lessons.type` to `'scorm'` (if type column exists) or use a flag

**Files to Modify**:
- `server/services/scorm.service.js` - `createCourseFromScormPackage()`
- `server/services/lessons.service.js` - Lesson creation logic

#### Step 2: Sync SCORM Attempts to content_progress

**Current State**:
- `commitScormRuntime()` tries to sync to `lesson_progress` table
- But system now uses `content_progress` with `content_type`

**Action Required**:
1. Modify `commitScormRuntime()` to:
   - Find lesson linked to SCO (`lessons.scorm_sco_id = scoId`)
   - Upsert `content_progress` with `content_type = 'lesson'`
   - Set `status = 'completed'` when SCORM status is `completed` or `passed`
2. Call `updateEnrollmentProgress()` after syncing

**Files to Modify**:
- `server/services/scorm.service.js` - `commitScormRuntime()`
- Import `updateEnrollmentProgress` from `progress.service.js`

#### Step 3: Update Progress Queries

**Current State**:
- `getUnifiedCourseProgress()` queries `content_progress` for lessons and quizzes
- Should automatically include SCORM lessons if they're in `content_progress`

**Action Required**:
- Verify that SCORM lessons appear in progress queries
- May need to ensure `lessons.type = 'scorm'` is handled correctly

**Files to Review**:
- `server/services/progress.service.js` - `getUnifiedCourseProgress()`

#### Step 4: Frontend Integration

**Current State**:
- SCORM courses are accessed via dedicated route: `/student/courses/:courseId/scorm`
- Not integrated with standard lesson viewer

**Action Required**:
1. Update `StudentLessonViewer` to detect SCORM lessons
2. Redirect to SCORM player for SCORM lessons
3. Show SCORM progress in lesson lists
4. Update progress hooks to include SCORM data

**Files to Modify**:
- `src/components/student/StudentLessonViewer.tsx`
- `src/hooks/useProgress.ts`
- Progress display components

#### Step 5: Testing & Validation

**Test Cases**:
1. Upload SCORM package → Create course → Verify lessons created
2. Student starts SCORM course → Verify `content_progress` record created
3. Student completes SCORM → Verify `content_progress.status = 'completed'`
4. Verify enrollment progress percentage updates
5. Verify course completion when all content (including SCORM) is done
6. Verify SCORM progress appears in student dashboard

### Implementation Priority

1. **High Priority** (Blocking):
   - Step 1: Link SCOs to lessons
   - Step 2: Sync to `content_progress`

2. **Medium Priority** (Important for UX):
   - Step 4: Frontend integration
   - Step 3: Verify progress queries

3. **Low Priority** (Polish):
   - Step 5: Comprehensive testing
   - Error handling improvements
   - Analytics/reporting

---

## Known Issues & Limitations

### 1. Vercel Blob Storage Limits

**Issue**: Hitting Vercel Blob storage limits during testing.

**Impact**: Cannot test new uploads or verify fixes.

**Solutions**:
- Upgrade Vercel Blob plan
- Implement cleanup of old/unused packages
- Consider alternative storage (AWS S3, Cloudflare R2)

### 2. Hardcoded Paths in Some Packages

**Issue**: Some SCORM packages reference absolute paths like `/shared/style.css` that don't exist in our Blob structure.

**Impact**: Missing CSS/JS files, broken styling, JavaScript errors.

**Solutions**:
- HTML rewriting to fix absolute paths (complex, error-prone)
- Accept that some packages may need to be repackaged
- Document package requirements for admins

### 3. Missing "Shared" Assets

**Issue**: Golf course references `/shared/scormfunctions.js` and `/shared/contentfunctions.js` that aren't in the uploaded package.

**Impact**: `AddLicenseInfo is not defined` errors, missing functionality.

**Solutions**:
- Verify package completeness before upload
- Provide admin guidance on package requirements
- Consider injecting common SCORM wrapper scripts

### 4. Progress Not Synced to Unified System

**Issue**: SCORM attempts stored in `scorm_attempts` but not synced to `content_progress`.

**Impact**: SCORM completion doesn't count toward course progress, enrollment completion, certificates.

**Solution**: Implement integration plan Step 2.

### 5. No Lesson Linking

**Issue**: SCOs aren't linked to lessons when courses are created.

**Impact**: Can't track which lesson corresponds to which SCO, can't show SCORM in lesson lists.

**Solution**: Implement integration plan Step 1.

### 6. SCORM 2004 Not Supported

**Issue**: Only SCORM 1.2 is implemented.

**Impact**: SCORM 2004 packages won't work.

**Solution**: Future enhancement (lower priority).

---

## Testing

### Manual Testing Checklist

#### Package Upload
- [ ] Upload valid SCORM 1.2 package
- [ ] Verify package appears in admin SCORM packages list
- [ ] Verify SCOs are parsed correctly
- [ ] Verify files uploaded to Vercel Blob
- [ ] Verify `content_base_path` stored correctly

#### Content Delivery
- [ ] Launch SCORM course as student
- [ ] Verify main HTML loads
- [ ] Verify CSS files load (check Network tab)
- [ ] Verify JavaScript files load
- [ ] Verify images load
- [ ] Verify no CORS errors
- [ ] Verify no 404s for expected files

#### SCORM Runtime API
- [ ] Verify `window.API` is accessible in SCORM content
- [ ] Verify `LMSInitialize()` succeeds
- [ ] Verify `LMSSetValue()` works
- [ ] Verify `LMSGetValue()` returns correct values
- [ ] Verify `LMSCommit()` saves to backend
- [ ] Verify `LMSFinish()` cleans up

#### Progress Tracking
- [ ] Start SCORM course → Verify attempt created
- [ ] Complete SCORM course → Verify status = 'completed'
- [ ] Verify `scorm_attempts` record updated
- [ ] (After integration) Verify `content_progress` synced
- [ ] (After integration) Verify enrollment progress updated

#### Multi-SCO Packages
- [ ] Navigate between SCOs
- [ ] Verify each SCO tracks progress separately
- [ ] Verify navigation controls work

### Automated Testing (Future)

**Unit Tests**:
- Manifest parsing
- Path sanitization
- CMI data model updates
- Progress sync logic

**Integration Tests**:
- End-to-end SCORM flow
- Progress tracking integration
- Error handling

---

## File Reference

### Backend Files

- `server/routes/scorm.js` - API routes
- `server/services/scorm.service.js` - Business logic
- `server/index.js` - Content streaming middleware (lines 272-400)
- `server/middleware/auth.middleware.js` - Authentication
- `server/middleware/tenant.middleware.js` - Tenant isolation

### Frontend Files

- `src/components/scorm/ScormCoursePlayer.tsx` - Main player component
- `src/components/student/StudentCoursesPage.tsx` - Course listing
- `src/components/student/StudentDashboardPage.tsx` - Dashboard
- `src/lib/api.ts` - API client (scormApi)

### Database

- `database/migrations/` - Schema migrations for SCORM tables

---

## Resources

- [SCORM 1.2 Specification](https://www.adlnet.gov/scorm/scorm-1-2/)
- [SCORM.com Developer Resources](https://scorm.com/scorm-explained/technical-scorm/)
- [pipwerks SCORM API Wrapper](https://github.com/pipwerks/scorm-api-wrapper) - Reference implementation

---

## Changelog

### 2025-01-XX - Initial Implementation
- ✅ Package upload and extraction
- ✅ Content delivery via same-origin proxy
- ✅ SCORM 1.2 Runtime API
- ✅ Frontend player component
- ⚠️ Progress tracking (stored but not integrated)
- ⚠️ Lesson linking (pending)

---

## Next Steps

1. **Immediate**: Implement integration plan Steps 1 & 2 (lesson linking + progress sync)
2. **Short-term**: Frontend integration (Step 4)
3. **Medium-term**: Comprehensive testing, error handling improvements
4. **Long-term**: SCORM 2004 support, advanced features

---

*Last Updated: 2025-01-XX*

