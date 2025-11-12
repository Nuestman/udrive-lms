## Overview

The Course Support System provides a structured, tenant-aware help channel that connects students, instructors, and administrators inside SunLMS. It replaces the legacy “Discussions” tab with a modern support experience that supports scoped Q&A, rich attachments, instructor escalation, analytics, and ownership controls. Students can raise contextual questions (linking to the lesson they were viewing), attach supporting files, and receive replies from instructors or peers. Instructors and admins can moderate, resolve, and mark answers while maintaining strict tenant isolation.

This document covers architecture, database schema, permission rules, API usage, UI flows, storage conventions, operations, and troubleshooting.

## At a Glance

| Capability | Details |
|------------|---------|
| **Supported roles** | Students (ask questions), Instructors/School Admins/Super Admins (reply, moderate), Original Poster (edit/delete) |
| **Categories** | `course_content`, `certificates`, `resources`, `technical`, `other` |
| **Statuses** | `open`, `answered`, `resolved`, `closed` |
| **Context** | Optional lesson linkage for course-content questions |
| **Attachments** | Multiple files per question/reply, Vercel Blob backed, sanitized filenames |
| **UI surfaces** | Lesson viewer “Support” tab, support modals, badges, instructor tools |
| **Polling** | 30-second polling for badge counts on lesson viewer |
| **Isolation** | Tenant scoped data, question-based ownership controls |

## Architecture Overview

```
┌────────────────────┐        ┌────────────────────────────┐
│ Lesson Viewer (SPA)│        │ Instructor/Admin Consoles  │
└──────────┬─────────┘        └──────────┬─────────────────┘
           │ GraphQL/REST (fetch/poll)                │
           ▼                                          ▼
    ┌───────────────┐                         ┌────────────────────┐
    │ Frontend API  │                         │ Frontend API       │
    │ (`src/services│                         │ (`src/services/    │
    │ /courseSupport│                         │  courseSupport...`)│
    └─────────┬─────┘                         └─────────┬──────────┘
              │ REST (`/api/course-support/*`)           │
              ▼                                          ▼
    ┌──────────────────────────────┐
    │ Express Router               │
    │ (`server/routes/courseSupport│
    │ .js`)                        │
    └────────────┬─────────────────┘
                 │
    ┌────────────▼────────────┐
    │ Service Layer           │
    │ (`server/services/      │
    │  courseSupport.service` │
    │  validates, enforces)   │
    └────────────┬────────────┘
                 │ SQL (transactions)
    ┌────────────▼────────────┐
    │ PostgreSQL              │
    │ course_support_* tables │
    └────────────┬────────────┘
                 │ File metadata + context
    ┌────────────▼────────────┐
    │ Vercel Blob Storage     │
    └─────────────────────────┘
```

## Data Model

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `course_support_questions` | Stores questions asked by students | `course_id`, `student_id`, `lesson_id`, `category`, `status`, `metadata`, `attachments` (via relation) |
| `course_support_replies` | Stores replies from instructors/students | `question_id`, `user_id`, `body`, `is_instructor_reply`, `is_answer` |
| `course_support_attachments` | Associates uploaded files with questions or replies | `question_id`, `reply_id`, `file_url`, `filename`, `original_filename`, `file_type`, `file_size`, `mime_type`, `metadata` |

#### Attachment Reference Constraint

```
CONSTRAINT check_attachment_reference CHECK (
  (question_id IS NOT NULL AND reply_id IS NULL) OR
  (question_id IS NULL AND reply_id IS NOT NULL)
)
```

Attachments must belong to exactly one question or one reply.

### Triggers & Functions

- **Reply count maintenance**: Trigger updates `reply_count` and `last_reply_at` on questions when replies are added.
- **Status automation**: Trigger sets question status to `answered` when a reply is marked as the accepted answer.
- **View counter**: `increment_question_view_count` function for analytics (callable from application if needed).

## Permissions & Roles

| Role | Capabilities |
|------|--------------|
| **Student** | Create questions (must be enrolled), edit/delete own questions, reply to others, edit/delete own replies. |
| **Instructor / School Admin** | Everything students can do, plus reply as instructor, mark answers, update status (answered/resolved/closed). |
| **Super Admin** | Full moderation across tenants (subject to company policy if cross-tenant visibility is allowed). |

Additional rules:

- Questions and replies are tenant scoped.
- Edit/delete is restricted to the original poster (OP).
- Mark-as-answer and status updates require instructor/admin privileges or question ownership.
- Enrollment checks ensure only enrolled students can ask or reply.

## API Surface

Base path: `/api/course-support`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/questions` | `GET` | Authenticated | List questions (filters: `course_id`, `student_id`, `category`, `status`, `search`, `limit`, `offset`). |
| `/questions/:id` | `GET` | Authenticated | Get single question with attachments and author metadata (verifies access). |
| `/questions` | `POST` | Authenticated student | Create question. Requires enrollment. Supports lesson linkage and attachments. |
| `/questions/:id` | `PUT` | Original poster | Update question title/body/category/lesson/attachments. |
| `/questions/:id` | `DELETE` | Original poster | Delete question (cascade removes replies/attachments). |
| `/questions/:id/replies` | `GET` | Authenticated | List replies for a question with author and attachments. |
| `/questions/:id/replies` | `POST` | Enrolled user | Create reply; sets `is_instructor_reply` for instructors/admins. |
| `/replies/:id` | `PUT` | Reply owner | Update reply body/attachments. |
| `/replies/:id` | `DELETE` | Reply owner | Delete reply (cascade removes attachments). |
| `/replies/:id/answer` | `PUT` | Instructor or question owner | Mark reply as accepted answer. |
| `/questions/:id/status` | `PUT` | Instructor or question owner | Change status (`open`, `answered`, `resolved`, `closed`). |

### Payload Highlights

- **Question creation**: `{ course_id, category, title, body, lesson_id?, attachments?[] }`
- **Attachment object**: `{ file_url, filename, original_filename, file_type, file_size, mime_type, metadata? }`
- **Reply creation**: `{ body, attachments?[] }`
- **Status update**: `{ status }`
- **Mark answer**: `{ question_id }`

## Frontend Integration

### Lesson Viewer (`StudentLessonViewer.tsx`)

- Replaces `discussion` tab with `support`.
- Polls every 30 seconds to refresh open question counts.
- Shows badges for unread announcements and open support questions.
- Uses `fetchQuestions`, `fetchQuestionById`, `fetchQuestionReplies`, `createQuestion`, `createReply`, `updateQuestion`, `deleteQuestion`, `updateReply`, `deleteReply`, `markReplyAsAnswer`, `updateQuestionStatus`.
- Filters results by `courseId` for contextual display.

### `CourseSupportTab` Component

Key features:

- Intro panel with call-to-action and explanation.
- Filter toolbar (category, status, search).
- Question list cards with status/category badges and metadata.
- Question detail view:
  - Author info, timestamps, view/reply counts.
  - Lesson context banner (if linked).
  - Attachments section.
  - Instructor quick actions (resolve, close).
- Reply list with accepted answer highlights and instructor badges.
- Support count badge (open questions) displayed on tab.
- Modals:
  - Ask question (with attachments upload UI).
  - Reply (with attachments upload UI).
  - Edit question/reply (re-uses forms, pre-populates attachments).
  - Confirmation modal for deletions.

### File Upload Flow

Uses `uploadFileWithProgress` utility → `/api/media/upload` with storage category `course-support`.

Metadata includes `courseId`, optional `lessonId`. Storage path pattern:

```
/tenants/{tenant-name}/{course-name}/support/{sanitized-filename}
```

All filenames are sanitized and original names preserved in metadata.

## Operations

### Database Migration

- Run `database/migrations/20251114_create_course_support_system.sql`.
- Creates tables, constraints, indexes, triggers.
- Safe to re-run (uses `IF NOT EXISTS`).

### Configuration

- Ensure Vercel Blob credentials are configured (`BLOB_READ_WRITE_TOKEN`).
- Ensure `MEDIA_BASE_URL` or similar env points to public blob domain.
- CORS configuration already allows preview environments.
- No special feature-flag—enabled by default for tenants.

### Monitoring & Metrics

- Track `course_support_questions.reply_count` and `view_count` for engagement.
- Use `last_reply_at` to highlight stale threads.
- Consider surfacing unanswered questions in instructor dashboards (future enhancement).

### Troubleshooting

| Issue | Resolution |
|-------|------------|
| **Student cannot ask question** | Verify enrollment in course; check `enrollments` table and tenant context. |
| **Attachment upload fails (file_size)** | Ensure media service returns size; verify fallback `fileBuffer.length`. |
| **Attachment shows wrong directory** | Confirm storage context parameters (courseId, lessonId) passed to `/media/upload`. |
| **Reply mark-as-answer fails** | Ensure request includes `question_id` in body; verify user role or question ownership. |
| **Blank support tab** | Confirm `useModules(courseId)` returns data before rendering (hook order must remain stable). |
| **CORS errors on preview domains** | As of v2.5.0, CORS allows `*.vercel.app`; ensure environment variables are set. |

### Email Notifications

The system automatically sends email notifications to course creators/instructors when:

- **New Question Posted**: When a student asks a question, the course creator receives an email with:
  - Question title and body preview
  - Student name
  - Course name and direct link to the question
  - Category and lesson context (if applicable)
- **New Reply Posted**: When a student or instructor replies to a question, the course creator receives an email with:
  - Reply author name and role
  - Reply body preview
  - Question context and direct link
  - Notification that it's from a student or instructor

Email notifications use branded templates with TinyMCE-styled formatting and include direct links to view the question/reply in the lesson viewer. Notifications are only sent to course creators (users who created the course), and only if email is configured in the system.

### Future Enhancements (Backlog)

- Instructor dashboard widget for unanswered questions.
- Rich editor for replies (TinyMCE subset).
- Ratings or helpfulness votes on replies.
- Email notification preferences per instructor.

---

**Revision History**

- **2025-11-15** — Added email notifications for new questions and replies (SunLMS v2.6.0).
- **2025-11-12** — Initial documentation for Course Support System (SunLMS v2.5.0).


