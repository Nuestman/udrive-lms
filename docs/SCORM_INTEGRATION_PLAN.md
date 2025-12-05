# SCORM Integration with Course/Lesson/Completion System

## Problem Statement

SCORM packages are currently playing successfully, but progress tracking is isolated:
- SCORM attempts are stored in `scorm_attempts` table ✅
- But they're **not** synced to the unified `content_progress` system ❌
- SCORM completion doesn't count toward course progress ❌
- Enrollment progress percentage doesn't include SCORM content ❌
- Certificates can't be issued for SCORM course completion ❌

## Current State Analysis

### What Works

1. **SCORM Package Upload & Storage**
   - Packages uploaded, extracted, stored in Vercel Blob ✅
   - Package and SCO metadata stored in database ✅

2. **Content Delivery**
   - Same-origin path-style URLs working ✅
   - Content loads and plays correctly ✅

3. **SCORM Runtime API**
   - Full SCORM 1.2 API implemented ✅
   - Progress tracked in `scorm_attempts` ✅

### What's Missing

1. **Lesson Linking**
   - `lessons.scorm_sco_id` column exists but isn't populated
   - When creating course from SCORM package, lessons aren't created for each SCO
   - No way to map a lesson to a SCO

2. **Progress Integration**
   - `commitScormRuntime()` tries to sync to `lesson_progress` (old table)
   - System now uses unified `content_progress` with `content_type`
   - No sync to `content_progress` currently
   - No call to `updateEnrollmentProgress()`

3. **Frontend Integration**
   - SCORM courses accessed via separate route
   - Not integrated with standard lesson viewer
   - Progress not shown in lesson lists

## Solution Architecture

### Data Flow

```
SCORM Content
  ↓ (LMSCommit)
SCORM Runtime API
  ↓ (POST /api/scorm/runtime/commit)
commitScormRuntime()
  ↓
1. Upsert scorm_attempts ✅
2. Find lesson via scorm_sco_id
3. Upsert content_progress (content_type='lesson') ← NEW
4. Call updateEnrollmentProgress() ← NEW
  ↓
Enrollment progress updated ✅
Course completion tracked ✅
```

### Database Relationships

```
courses
  ↓ (one-to-many)
modules
  ↓ (one-to-many)
lessons
  ↓ (one-to-one, via scorm_sco_id)
scorm_scos
  ↓ (one-to-many)
scorm_attempts
  ↓ (sync to)
content_progress (content_id=lesson.id, content_type='lesson')
  ↓ (used by)
enrollments (progress_percentage calculation)
```

## Implementation Plan

### Phase 1: Lesson Linking (High Priority)

**Goal**: Create lessons for each SCO when course is created from SCORM package.

#### Step 1.1: Modify Course Creation

**File**: `server/services/scorm.service.js`

**Function**: `createCourseFromScormPackage()`

**Current Behavior**:
- Creates course
- Links course to package
- Does NOT create lessons for SCOs

**New Behavior**:
1. Create course (existing)
2. Create a module for the SCORM content (or use existing module)
3. For each SCO in the package:
   - Create a lesson with:
     - `title` = SCO title
     - `module_id` = module ID
     - `scorm_sco_id` = SCO ID
     - `type` = 'scorm' (if type column exists)
     - `content` = null (SCORM content is external)
     - `order` = based on SCO order in manifest
4. Link package to course (existing)

**Code Changes**:

```javascript
// In createCourseFromScormPackage()
// After course creation, before returning:

// Get all SCOs for this package
const scos = await getScosByPackageId(packageId, tenantId, isSuperAdmin);

// Create a module for SCORM content (or use first module if course has modules)
let moduleId;
const existingModules = await query(
  'SELECT id FROM modules WHERE course_id = $1 ORDER BY order_index LIMIT 1',
  [course.id]
);

if (existingModules.rows.length > 0) {
  moduleId = existingModules.rows[0].id;
} else {
  // Create a default module
  const moduleResult = await query(
    `INSERT INTO modules (course_id, title, order_index, created_at)
     VALUES ($1, $2, 0, NOW())
     RETURNING id`,
    [course.id, 'SCORM Content']
  );
  moduleId = moduleResult.rows[0].id;
}

// Create lessons for each SCO
for (let i = 0; i < scos.scos.length; i++) {
  const sco = scos.scos[i];
  await query(
    `INSERT INTO lessons (module_id, title, scorm_sco_id, order_index, type, created_at)
     VALUES ($1, $2, $3, $4, 'scorm', NOW())`,
    [moduleId, sco.title || `SCO ${i + 1}`, sco.id, i]
  );
}
```

#### Step 1.2: Verify Lesson Type Support

**Check**: Does `lessons` table have a `type` column?

**If Yes**: Use `type = 'scorm'` when creating lessons.

**If No**: 
- Option A: Add `type` column (recommended for future extensibility)
- Option B: Use a flag column or detect via `scorm_sco_id IS NOT NULL`

**Action**: Check schema and add migration if needed.

### Phase 2: Progress Sync (High Priority)

**Goal**: Sync SCORM attempts to unified `content_progress` system.

#### Step 2.1: Modify commitScormRuntime()

**File**: `server/services/scorm.service.js`

**Function**: `commitScormRuntime()`

**Current Behavior**:
- Upserts `scorm_attempts` ✅
- Tries to sync to `lesson_progress` (old table) ❌

**New Behavior**:
1. Upsert `scorm_attempts` (existing)
2. Find lesson linked to SCO:
   ```sql
   SELECT id FROM lessons WHERE scorm_sco_id = $1
   ```
3. If lesson found and status is `completed` or `passed`:
   - Upsert `content_progress`:
     ```sql
     INSERT INTO content_progress (content_id, student_id, content_type, status, completed_at, started_at)
     VALUES ($1, $2, 'lesson', 'completed', NOW(), COALESCE((SELECT started_at FROM content_progress WHERE content_id=$1 AND student_id=$2), NOW()))
     ON CONFLICT (content_id, student_id, content_type)
     DO UPDATE SET status='completed', completed_at=NOW()
     ```
4. Call `updateEnrollmentProgress()` to recalculate enrollment progress

**Code Changes**:

```javascript
// In commitScormRuntime(), after scorm_attempts upsert:

// Find lesson linked to this SCO
const lessonResult = await query(
  `SELECT l.id, m.course_id, m.id as module_id
   FROM lessons l
   JOIN modules m ON l.module_id = m.id
   WHERE l.scorm_sco_id = $1`,
  [scoId]
);

if (lessonResult.rows.length > 0 && (lessonStatus === 'completed' || lessonStatus === 'passed')) {
  const { id: lessonId, course_id: courseId, module_id: moduleId } = lessonResult.rows[0];
  
  // Sync to content_progress
  await query(
    `INSERT INTO content_progress (content_id, student_id, content_type, status, completed_at, started_at)
     VALUES ($1, $2, 'lesson', 'completed', NOW(), 
             COALESCE((SELECT started_at FROM content_progress WHERE content_id=$1 AND student_id=$2 AND content_type='lesson'), NOW()))
     ON CONFLICT (content_id, student_id, content_type)
     DO UPDATE SET 
       status = 'completed',
       completed_at = NOW(),
       updated_at = NOW()`,
    [lessonId, userId]
  );
  
  // Update enrollment progress
  const { updateEnrollmentProgress } = await import('./progress.service.js');
  await updateEnrollmentProgress(lessonId, userId, courseId, moduleId);
}
```

#### Step 2.2: Import Progress Service

**File**: `server/services/scorm.service.js`

**Add Import**:
```javascript
import { updateEnrollmentProgress } from './progress.service.js';
```

**Note**: May need to adjust based on actual export from `progress.service.js`.

### Phase 3: Frontend Integration (Medium Priority)

**Goal**: Integrate SCORM into standard lesson flow.

#### Step 3.1: Update StudentLessonViewer

**File**: `src/components/student/StudentLessonViewer.tsx`

**Current Behavior**:
- Renders text/quiz/doc/ppt lessons
- Doesn't handle SCORM lessons

**New Behavior**:
- Check if lesson has `scorm_sco_id` or `type === 'scorm'`
- If SCORM, redirect to SCORM player or render inline
- Show SCORM progress in lesson header

**Code Changes**:

```typescript
// In StudentLessonViewer.tsx
const renderLessonContent = () => {
  if (lesson.scorm_sco_id || lesson.type === 'scorm') {
    // Redirect to SCORM player
    return <Navigate to={`/student/courses/${courseId}/scorm`} replace />;
    // OR render SCORM player inline
    // return <ScormCoursePlayer courseId={courseId} />;
  }
  
  // Existing lesson rendering...
};
```

#### Step 3.2: Update Progress Hooks

**File**: `src/hooks/useProgress.ts`

**Current Behavior**:
- Fetches progress from unified endpoint
- Should automatically include SCORM lessons if they're in `content_progress`

**Action**: Verify SCORM lessons appear in progress data. May need no changes.

### Phase 4: Testing & Validation (High Priority)

#### Test Cases

1. **Lesson Creation**
   - Upload SCORM package
   - Create course from package
   - Verify lessons created for each SCO
   - Verify `scorm_sco_id` populated

2. **Progress Sync**
   - Start SCORM course as student
   - Verify `scorm_attempts` record created
   - Complete SCORM course
   - Verify `content_progress` record created/updated
   - Verify `status = 'completed'`

3. **Enrollment Progress**
   - Enroll student in course with SCORM content
   - Complete SCORM lesson
   - Verify `enrollments.progress_percentage` updated
   - Verify progress includes SCORM lesson

4. **Course Completion**
   - Create course with SCORM + regular lessons
   - Complete all content (including SCORM)
   - Verify `enrollments.status = 'completed'`
   - Verify `enrollments.completed_at` set

5. **Multi-SCO Packages**
   - Upload package with multiple SCOs
   - Complete each SCO
   - Verify each creates separate `content_progress` record
   - Verify all count toward course progress

## Implementation Checklist

### Phase 1: Lesson Linking
- [ ] Check if `lessons.type` column exists
- [ ] Add migration if needed
- [ ] Modify `createCourseFromScormPackage()` to create lessons
- [ ] Test: Upload package → Create course → Verify lessons

### Phase 2: Progress Sync
- [ ] Import `updateEnrollmentProgress` in `scorm.service.js`
- [ ] Modify `commitScormRuntime()` to find lesson
- [ ] Add `content_progress` upsert logic
- [ ] Call `updateEnrollmentProgress()` after sync
- [ ] Test: Complete SCORM → Verify `content_progress` → Verify enrollment progress

### Phase 3: Frontend Integration
- [ ] Update `StudentLessonViewer` to detect SCORM lessons
- [ ] Add redirect or inline rendering
- [ ] Verify progress hooks include SCORM data
- [ ] Test: Access SCORM lesson from lesson list

### Phase 4: Testing
- [ ] Run all test cases
- [ ] Fix any issues
- [ ] Document edge cases
- [ ] Update user documentation

## Rollback Plan

If issues arise:

1. **Lesson Creation Issues**:
   - Revert `createCourseFromScormPackage()` changes
   - Manually create lessons if needed

2. **Progress Sync Issues**:
   - Revert `commitScormRuntime()` changes
   - SCORM attempts still stored (no data loss)
   - Can manually sync later

3. **Frontend Issues**:
   - Revert `StudentLessonViewer` changes
   - SCORM still accessible via dedicated route

## Success Criteria

Integration is successful when:

1. ✅ SCORM packages create lessons automatically
2. ✅ SCORM completion syncs to `content_progress`
3. ✅ Enrollment progress includes SCORM content
4. ✅ Course completion works with SCORM
5. ✅ SCORM progress visible in student dashboard
6. ✅ Certificates can be issued for SCORM courses

## Timeline Estimate

- **Phase 1** (Lesson Linking): 2-3 hours
- **Phase 2** (Progress Sync): 2-3 hours
- **Phase 3** (Frontend): 1-2 hours
- **Phase 4** (Testing): 2-3 hours

**Total**: ~8-11 hours of development + testing

## Dependencies

- Unified `content_progress` system must be working ✅
- `updateEnrollmentProgress()` function must exist ✅
- `lessons.scorm_sco_id` column must exist ✅

## Notes

- SCORM attempts are preserved regardless of sync status (no data loss)
- Can implement sync retroactively for existing attempts if needed
- Consider adding admin UI to manually link SCOs to lessons if auto-linking fails

---

*Last Updated: 2025-01-XX*

