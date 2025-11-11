## Overview

The SunLMS Announcement System delivers tenant-isolated, role-aware broadcast messaging that complements the real-time notification stack. Announcements target high-level updates—program news, course/module/lesson/quiz changes, or platform-wide broadcasts from system administrators—and surface inside learner-centric experiences (lesson viewer, student announcement page) as well as management consoles. Rich HTML content, media attachments backed by Vercel Blob storage, optional email distribution, and fine-grained scoping ensure messages reach the right audience without overwhelming users.

This document covers architecture, data model, permission rules, backend/frontend components, API usage, email behaviour, operational guidance, and error handling.

## At a Glance

| Capability | Details |
|------------|---------|
| **Author roles** | `super_admin`, `school_admin`, `instructor` (students are viewers only) |
| **Audience scopes** | `global`, `tenant`, `course`, `module`, `lesson`, `quiz` |
| **Delivery surfaces** | Lesson viewer announcements tab, `/student/announcements`, role-specific management pages, course management panel |
| **Media support** | Image, video, audio, document uploads via Vercel Blob; external embeds |
| **Email dispatch** | Optional (automatic for super-admin publications); branding-aware `announcement_broadcast` template |
| **Read tracking** | `announcement_reads` table + `/api/announcements/:id/read` endpoint |
| **Tenant controls** | Strict isolation & ownership enforcement in service layer |

## Architecture Overview

```
┌───────────────────────┐       ┌──────────────────────────────┐
│ Announcement Authors  │       │    Announcement Consumers    │
│ (Super Admin, etc.)   │       │ (Students, Staff, Admins)    │
└─────────────┬─────────┘       └─────────────┬────────────────┘
              │ REST + Auth UI                                │ REST + UI
              ▼                                                ▼
      ┌─────────────────────┐                     ┌────────────────────────┐
      │ REST API Routes     │                     │ Lesson Viewer / Pages  │
      │ `/api/announcements`│                     │ `/student/announcements│
      └────────┬────────────┘                     │ /admin/announcements`  │
               │                                  └──────────┬─────────────┘
               │                                      (marks read, filters)
      ┌────────▼──────────┐
      │ Announcement      │
      │ Service Layer     │ (create/update/archive/delete/list scoped data,
      │ (`server/services`│  dispatch emails, enforce permissions)
      └────────┬──────────┘
               │
      ┌────────▼──────────┐
      │ PostgreSQL Tables │ (`announcements`, `announcement_media`,
      │                   │  `announcement_reads`)
      └────────┬──────────┘
               │
      ┌────────▼──────────┐
      │ Vercel Blob       │ (uploaded media managed via `/api/media/upload`)
      └────────────────────┘
```

## Database Schema

```
┌───────────────────────────────┐
│ announcements                 │
│-------------------------------│
│ id UUID PRIMARY KEY           │
│ tenant_id UUID                │ FK → tenants.id ON DELETE CASCADE
│ author_id UUID                │ FK → users.id ON DELETE SET NULL
│ author_role TEXT              │ {super_admin, school_admin, instructor}
│ audience_scope TEXT           │ {global, tenant, course, module, lesson, quiz}
│ title TEXT NOT NULL           │
│ summary TEXT NULL             │ optional excerpt
│ body_html TEXT NOT NULL       │ sanitized HTML payload
│ body_json JSONB NULL          │ optional TinyMCE content
│ context_type TEXT             │ {general, course, module, lesson, quiz}
│ course_id UUID NULL           │ FK → courses.id
│ module_id UUID NULL           │ FK → modules.id
│ lesson_id UUID NULL           │ FK → lessons.id
│ quiz_id UUID NULL             │ FK → quizzes.id
│ target_roles TEXT[]           │ subset ⊆ {student,instructor,school_admin,super_admin}
│ status TEXT                   │ {draft, scheduled, published, archived}
│ published_at TIMESTAMPTZ NULL │ set when status transitions to published
│ scheduled_for TIMESTAMPTZ NULL│ optional future publish time
│ expires_at TIMESTAMPTZ NULL   │ optional expiry
│ email_sent_at TIMESTAMPTZ NULL│ recorded after email broadcast
│ is_pinned BOOLEAN             │ pinned announcements surface first
│ metadata JSONB                │ ctaUrl, moduleName, changes[], etc.
│ created_at TIMESTAMPTZ        │ default NOW()
│ updated_at TIMESTAMPTZ        │ default NOW()
└───────────────────────────────┘

┌───────────────────────────────┐
│ announcement_media            │
│-------------------------------│
│ id UUID PRIMARY KEY           │
│ announcement_id UUID          │ FK → announcements.id ON DELETE CASCADE
│ media_type TEXT               │ {image,video,audio,document,embed}
│ url TEXT                      │ Vercel Blob/public URL
│ thumbnail_url TEXT NULL       │ optional preview
│ title TEXT NULL               │ attachment title
│ description TEXT NULL         │ summary
│ alt_text TEXT NULL            │ accessibility hint
│ mime_type TEXT NULL           │ MIME metadata
│ file_size INT NULL            │ bytes
│ metadata JSONB                │ blob metadata (pathname, uploadedAt)
│ created_at TIMESTAMPTZ        │ default NOW()
└───────────────────────────────┘

┌───────────────────────────────┐
│ announcement_reads            │
│-------------------------------│
│ announcement_id UUID          │ FK → announcements.id ON DELETE CASCADE
│ user_id UUID                  │ FK → users.id ON DELETE CASCADE
│ read_at TIMESTAMPTZ           │ default NOW()
│ PRIMARY KEY (announcement_id, user_id)
└───────────────────────────────┘
```

## Permission Model & Tenant Isolation

| Action | Super Admin | School Admin | Instructor | Student |
|--------|-------------|--------------|------------|---------|
| Create global announcement | ✅ | ❌ | ❌ | ❌ |
| Create tenant announcement | ✅ | ✅ (their tenant) | ❌ | ❌ |
| Create course/module/lesson/quiz announcement | ✅ | ✅ (owned tenant) | ✅ (courses they own) | ❌ |
| Update/Archive announcement | ✅ (any) | ✅ (if author) | ✅ (if author) | ❌ |
| Delete announcement (hard delete) | ✅ | ❌ | ❌ | ❌ |
| View announcements | ✅ | ✅ | ✅ | ✅ (scoped) |

Enforcement highlights (`server/services/announcements.service.js`):
- Author role is validated at creation; unauthorized attempts throw explicit errors.
- Tenant isolation is applied to every `listAnnouncements` call. Super admins may optionally override via query.
- Updates/archives are restricted to owners unless the record was authored by a super admin (immutable for others).
- Viewers must match tenant + scope + target role criteria.

## Backend Components

### Routes (`server/routes/announcements.js`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/announcements` | List announcements with filters (`course_id`, `module_id`, `lesson_id`, `quiz_id`, `include_global`, `status`, `search`, `tenant_id`, etc.). |
| GET | `/api/announcements/:id` | Fetch single announcement (role/tenant filtered). |
| POST | `/api/announcements` | Create announcement (role checks, scope validation, email flag). |
| PUT | `/api/announcements/:id` | Update announcement (ownership checks, media upsert, publish logic). |
| PUT | `/api/announcements/:id/archive` | Soft archive (status set to `archived`). |
| DELETE | `/api/announcements/:id` | Hard delete (super admin only). |
| POST | `/api/announcements/:id/read` | Mark as read for current user. |

### Service (`server/services/announcements.service.js`)
- `createAnnouncement` – resolves hierarchy, defaults context, saves media, auto-publishes, dispatches email.
- `updateAnnouncement` – enforces immutability rules, updates media, re-dispatches email if needed.
- `listAnnouncements` / `fetchAnnouncements` – builds dynamic SQL with scoped filters, status, search, expiry, viewer role.
- `archiveAnnouncement`, `deleteAnnouncement`, `markAnnouncementRead`.
- `dispatchAnnouncementEmails` – loads branding, selects recipients, sends `announcement_broadcast` template.

### Email Template (`server/utils/emailTemplates.js`)
- Template key: `announcement_broadcast`.
- Injects branding (logo, primary color), optional CTA, and fallback text for plain email clients.

### Media Upload Flow
1. Modal uses `uploadFileWithProgress` to POST to `/api/media/upload`.
2. Route applies `uploadMedia` middleware → `media.service.js`, stores file in Vercel Blob and DB.
3. Response provides URL, metadata, and optional file ID for attachments.

## Frontend Components

### Shared Editor (`src/components/announcements/AnnouncementEditorModal.tsx`)
- TinyMCE rich text, sanitized server-side.
- Dropdowns for audience scope, courses, modules, lessons, quizzes.
- File upload with progress + embed fallback.
- Configurable props to lock scope/course for course-specific workflow.

### Global Management (`src/components/announcements/AnnouncementsManagementPage.tsx`)
- Filters: status, tenant (super admin), search.
- Three-column cards styled like notification UI.
- Action menu (publish/draft, pin/unpin, edit, archive, delete) with confirmation modal.
- Creation button opens editor; success reloads list.

### Course Detail Panel (`src/components/courses/CourseDetailsPage.tsx`)
- “Course Announcements” section surfaces only `audience_scope = 'course'` records for the course.
- Uses shared editor with locked scope/course ID.
- Displays attachments, metadata chips, CTA links.

### Student Experiences
- `StudentLessonViewer.tsx`: Announcements tab loads course-specific items, marks unread announcements as read on tab focus.
- `StudentAnnouncementsPage.tsx`: search + include global toggle, two-column layout mirroring notifications.

### Navigation & Badges
- `src/App.tsx`: Routes for admins, school admins, instructors, students.
- `DashboardLayout.tsx`: Sidebar entries show unread badge counts via periodic fetch.

## API Usage Examples

```typescript
// List announcements for a course (student)
const data = await fetchAnnouncements({
  courseId: courseId,
  includeGlobal: true,
  limit: 50,
});

// Create tenant-wide announcement (super admin)
await createAnnouncement({
  audience_scope: 'tenant',
  target_roles: ['student', 'instructor'],
  title: 'Orientation Week',
  summary: 'Schedule + resources',
  body_html: '<p>Welcome back!</p>',
  send_email: true,
});

// Mark as read
await markAnnouncementAsRead(announcementId);

// Update announcement (pin + publish)
await updateAnnouncementRequest(announcementId, {
  status: 'published',
  publish_now: true,
  is_pinned: true,
});
```

## Email Dispatch Flow

1. `createAnnouncement`/`updateAnnouncement` called with `send_email: true`, or a super admin publishes.
2. `dispatchAnnouncementEmails` gathers recipients:
   - Students enrolled in scoped course/module/lesson/quiz.
   - Targeted staff roles when included in `target_roles`.
   - Super admins for global messaging.
3. Branding (logo, colors) resolved via white-label service.
4. Email uses `announcement_broadcast` template (CTA conditional on metadata `ctaUrl`).
5. `email_sent_at` recorded after attempt; skipped if email subsystem disabled (logged warning).

> **SMTP requirement**: See `docs/development-setup.md` for environment variables (`SMTP_HOST`, `SMTP_USER`, etc.).

## Operational Guidance

### Creating Announcements
| Step | Description |
|------|-------------|
| 1 | Navigate to role-specific management page (`/admin/announcements`, `/school/announcements`, etc.). |
| 2 | Click “New Announcement” (or “New Course Announcement” from course detail panel). |
| 3 | Choose audience scope, target roles, status (scheduled items require `scheduled_for`). |
| 4 | Compose HTML content (TinyMCE). |
| 5 | Add attachments (upload or embed). |
| 6 | Optionally enable “Send as email broadcast.” |
| 7 | Save (draft or publish). |

### Editing & Archiving
- Use the three-dot menu on management cards.
- Archiving sets status to `archived`, hiding the announcement but preserving history.
- Hard deletion is super admin only and removes associated media.

### Course-Specific Workflow
1. Visit `/school/courses/:id`.
2. “New Course Announcement” auto-locks scope to course and preselects course ID.
3. Learners see published announcements inside lesson viewer tab for that course only.

### Student Experience
- Lesson viewer tab autoloads course announcements and marks them read upon entry.
- `/student/announcements` aggregates global + tenant + scoped announcements relevant to the student.

### Unread Badges
- Sidebar fetch counts per role using `/api/announcements` filters.
- Badges help staff verify new announcements quickly.

## Error Handling & Validation

### Backend
- Transactions wrap create/update processes (`BEGIN/COMMIT/ROLLBACK`).
- Validation ensures:
  - Title/body provided.
  - Hierarchy consistency (module requires course, etc.).
  - Scheduled announcements have `scheduled_for`.
  - Ownership/role checks enforced with descriptive errors.
- Email dispatch failures logged per-recipient; do not fail the main request.

### Frontend
- Modal shows inline validation messages (title, content, hierarchy, upload errors).
- Upload errors per attachment (display + recover).
- Action menus use confirmation modal + toasts for feedback.
- API errors surfaced via toast notifications.

