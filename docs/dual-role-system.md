## Dual-Role System (Current Implementation)

This document describes the simplified dual-role approach currently implemented in the app. Non-student users can temporarily switch their active role to student to take courses, while preserving their original role and permissions for administration tasks. The design prioritizes clarity, tenant isolation, and RBAC correctness.

### Overview

- Primary role is stored in `users.role` (e.g., `super_admin`, `school_admin`, `instructor`, `student`).
- Active role is stored in `users.settings.active_role` and mirrored on the client via the `X-Active-Role` header.
- Users whose primary role is not `student` may switch their active role to `student` (“Student Mode”) and back.
- All RBAC checks that gate privileged operations use the primary role. Student-specific restrictions use the active role.
- Tenant isolation uses the primary role for super admin checks; a `super_admin` gets global access even when in Student Mode.

### Terminology

- Primary role: The authoritative role stored in `users.role`.
- Active role: The current UI/session role stored in `users.settings.active_role` and sent via `X-Active-Role`.
- Student Mode: When `active_role === 'student'` regardless of primary role.

### Data Model

- Table: `users`
  - `role`: primary role
  - `settings` (JSONB): includes `active_role`
- No schema changes to `users.role`; the active role is fully handled via `settings.active_role`.

### Client Behavior

- AuthContext
  - Tracks `primary_role` and `active_role` in `user/profile`.
  - On sign-in and profile updates, sets the client’s active role via `setActiveRole()` so all requests include `X-Active-Role`.
  - Provides `switchRole(activeRole)` to toggle between primary and `student`.

- Role Switcher (UI)
  - Header component `RoleSwitcher` visible to non-students.
  - Toggles active role and shows an indicator when in Student Mode (badge “(Student Mode)”).

- Routing
  - `App.tsx` and `DashboardLayout.tsx` use `profile.active_role || profile.role` to determine dashboard routing and sidebar state.

### API Contract

- Headers
  - `Authorization: Bearer <token>`
  - `X-Active-Role: student | <primary role>` (optional; if omitted, server falls back to DB `settings.active_role` or `role`).

- Endpoints
  - `PUT /api/auth/switch-role` — body `{ active_role: 'student' | <primary_role> }`
    - Updates `users.settings.active_role` and returns normalized profile `{ primary_role, active_role }`.
  - Enrollments
    - `GET /api/enrollments` — If `activeRole === 'student'`, server restricts results to `req.user.id` regardless of filters.
    - `POST /api/enrollments` — Students self-enroll; admins/instructors may enroll others. Super admin can bypass tenant when `tenantId === null`.
    - `DELETE /api/enrollments/:id` — Students can only unenroll themselves; admins/instructors can unenroll any student.
  - Progress
    - Student mode: can only access their own progress.
    - Admin/instructor access is determined by primary role.
  - Courses/Modules/Lessons
    - Super admin (by primary role) can bypass tenant filters when `tenantId === null`.
  - Certificates
    - `POST /api/certificates/generate` — Generate certificate for completed enrollment (students for own enrollments; admins allowed).
    - `GET /api/certificates/enrollment/:enrollmentId` — List certificates for an enrollment.
    - `GET /api/certificates/:id` — Get certificate details (tenant-aware; super admin bypass when applicable).
    - `PUT /api/certificates/:id/status` — Activate/ revoke with notes.
    - `DELETE /api/certificates/:id` — Soft-delete via revocation.
    - `GET /api/certificates/verify/:verificationCode` — Public verification (no auth).

### Middleware & Server Logic

- Auth (`requireAuth`)
  - Loads `users.settings` and reads `X-Active-Role` header.
  - Effective active role priority: header (if valid) → `settings.active_role` → primary role.
  - Makes `req.user = { ..., primaryRole, activeRole, role: activeRole }` for backward compatibility.

- Tenant Context (`tenantContext`)
  - Uses `primaryRole` to determine super admin behavior.
  - If `primaryRole === 'super_admin'`, sets `req.tenantId = null` and `req.isSuperAdmin = true` (global access), regardless of active role.

### RBAC Rules (Summary)

- Student mode:
  - Can only read/write their own enrollments and progress.
  - Cannot view other students’ data.
- Admin/Instructor (by primary role):
  - Can list students’ enrollments/progress within tenant.
  - Can enroll/unenroll students.
- Super Admin (by primary role):
  - Global read/write across tenants.
  - May take courses in Student Mode while retaining global visibility for admin tasks.

### Enrollment & Progress

- Client explicitly passes `student_id: profile.id` to `useEnrollments` and progress hooks when in Student Mode.
- Server enforces student scoping when `activeRole === 'student'`.
- Fixes implemented to prevent data bleed (cross-user progress/enrollments).

### Unenrollment (Student Self-Service)

- UI buttons on `StudentCoursesPage` and `StudentDashboardPage` for in-progress/ not-started courses only.
- Uses branded `ConfirmationModal` (not `window.confirm`).
- Calls `DELETE /api/enrollments/:id` with server-side permission checks.

### Course Access & Errors

- Removed silent redirects to `/dashboard` on failures.
- Components surface explicit errors via toasts if course/modules/lessons are missing or access is denied.

### Thumbnails & Fallbacks

- Course cards render `img` with `onError` to hide broken images.
- Fallback `BookOpen` icon shows when thumbnail is absent or fails to load.

### Certificates

- Generation
  - Requires enrollment completed; returns certificate with `certificate_number` and `verification_code`.
  - Verification code format: `VERIFY-<timestamp>-<STUDENT8>`.

- Verification (Public)
  - `GET /api/certificates/verify/:verificationCode` returns certificate details and `is_valid`.
  - Route decodes URL; service trims and validates code.

- Admin Management
  - Certificates management page with CRUD actions:
    - View, Download/Print (verification page), Revoke, Activate, Delete (soft).
    - Revocation/Activation modal captures notes; includes quick-select common reasons.
  - Bulk actions (e.g., bulk revoke) with success/error counts and toasts.

### Super Admin Notes

- Enrollment, courses/modules/lessons, and certificates services accept `isSuperAdmin` and bypass tenant filters when `tenantId === null`.
- Super admin may switch to Student Mode and take courses, while still having global administrative access (via primary role checks).

### Error Handling Principles

- Do not mask errors with vague redirects.
- Show actionable messages (toasts or inline error blocks) with specific cause when possible.

### Security Considerations

- Student data isolation enforced by active role on reads and writes.
- Admin privileges always validated using primary role.
- Tenant isolation defaults to tenant-scoped queries; only super admin (by primary role) bypasses tenant filters.

### Key Features (Adapted)

- Role Switching
  - Non-students can switch to Student Mode via `RoleSwitcher` and back to their primary role.
  - Session-aware through `X-Active-Role` and persisted in `users.settings.active_role`.
- Authentic Student Experience
  - Elevated roles in Student Mode get the same course access, progress, and certificate flows as students.
- Strict RBAC & Isolation
  - Student Mode limits scope to the current user’s data; privileged operations validated against primary role.
- Certificate Management
  - Admins can activate/revoke with notes, bulk revoke, and validate via public verification codes.
- Error Transparency
  - No vague redirects; errors are surfaced via toasts or inline messages for fast diagnosis.

### How It Works (Adapted)

- Instructors / School Admins / Super Admins
  1. Use `RoleSwitcher` in the header to enter Student Mode.
  2. Browse courses, enroll, start, and complete courses like a student.
  3. Exit Student Mode to resume administrative tasks.
- Super Admins
  - Retain global visibility (primary role) while taking courses in Student Mode (active role).
  - Bypass tenant filters for read/write when `tenantId === null`.

### User Interface (Adapted)

- Role Switcher
  - Toggle between primary role and Student Mode; shows “(Student Mode)” indicator.
- Student Course Cards
  - Enroll/Start/Continue actions; Unenroll button for eligible statuses; thumbnails with robust fallback.
- Certificates Management
  - Table with actions: View, Download/Print (via verification page), Activate/Revoke (modal with notes presets), Delete (soft via revoke).
- Student Certificate View
  - Generate (if eligible), view status, see verification code and shareable verification link.

### Technical Implementation (Adapted)

- Client
  - `AuthContext`: manages `primary_role`, `active_role`, `switchRole()`; syncs `X-Active-Role`.
  - `RoleSwitcher`: UI control in header.
  - Student pages use `useEnrollments({ student_id: profile.id })` and error-forwarding navigation.
  - Certificates pages/components implement CRUD, verification and download via public route.
- Server
  - `auth.middleware`: determines `activeRole` from header/db; augments `req.user` with `primaryRole` and `activeRole`.
  - `tenant.middleware`: grants global access for primary super admin; logs context.
  - Enrollments/Progress/Courses/Modules/Lessons: enforce tenant and role rules; super admin bypass.
  - Certificates: generation, status updates with notes, verification by code (public).

### Benefits (From Legacy, Still Applicable)

- For Organizations
  - Quality assurance with admin/student parity; flexible training and validation.
- For Users
  - Professional development for instructors/admins; unified experience.
- For System
  - Better end-to-end testing; reliable features validated across roles.

### Use Cases (From Legacy, Still Applicable)

- Instructor Professional Development; Administrative QA; System Administration; Cross-Training.

### Getting Started (Updated)

- Non-student user:
  1. Click `RoleSwitcher` in the header → select “Student”.
  2. Enroll in a course; start lessons and quizzes.
  3. Complete course; generate/view certificate.
  4. Switch back to your primary role when done.

### Related Documentation

- `docs/admin-guide.md`
- `docs/progress-based_fragmented_docs/CERTIFICATE_SYSTEM_COMPLETE.md`
- API and architecture notes inline within server/client files referenced below.

### Future Enhancements (Curated)

- Role-aware recommendations; cross-role analytics dashboards; advanced learning paths per role.
- Optional audit log enrichment for role-switch actions and certificate lifecycle.

### Example Requests

Switch role (client):

```http
PUT /api/auth/switch-role
Authorization: Bearer <token>
Content-Type: application/json

{ "active_role": "student" }
```

Authenticated API request with active role:

```http
GET /api/enrollments
Authorization: Bearer <token>
X-Active-Role: student
```

Verify certificate (public):

```http
GET /api/certificates/verify/VERIFY-1730800000000-ABCDEF12
```

### Components & Files (Key)

- Client
  - `src/contexts/AuthContext.tsx` — `primary_role`, `active_role`, `switchRole()`
  - `src/lib/api.ts` — `X-Active-Role` header, `authApi.switchRole`
  - `src/components/common/RoleSwitcher.tsx` — toggle UI
  - Student pages — `StudentDashboardPage.tsx`, `StudentCoursesPage.tsx`, `StudentLessonViewer.tsx`
  - Certificates — `CertificateManagementPage.tsx`, `CertificateViewPage.tsx`, `CertificateVerificationPage.tsx`

- Server
  - Auth & tenant — `server/middleware/auth.middleware.js`, `server/middleware/tenant.middleware.js`
  - Enrollments — `server/routes/enrollments.js`, `server/services/enrollments.service.js`
  - Progress — `server/routes/progress.js`
  - Courses/Modules/Lessons — `server/routes/*.js`, `server/services/*.service.js`
  - Certificates — `server/routes/certificate.js`, `server/services/certificate.service.js`

### Known Pitfalls Avoided

- Cross-student data bleed by strict `student_id` filters in Student Mode.
- Tenant leakage by guarding queries unless `primaryRole === 'super_admin'` with `tenantId === null`.
- Silent redirects hiding real errors during navigation.

### Change Log (Highlights)

- Introduced active role switching via `settings.active_role` and `X-Active-Role`.
- Hardened RBAC and tenant isolation across enrollments, progress, and certificates.
- Added on-brand confirmation modals; removed browser prompts.
- Fixed certificate verification and added admin management (revoke/activate with notes and presets).


