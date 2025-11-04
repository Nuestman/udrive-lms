# SunLMS Email Templates Reference

Comprehensive reference for all email templates implemented in `server/utils/emailTemplates.js`. Use via `sendTemplatedEmail(templateId, { to, variables })`.

- Transport: Nodemailer (SMTP)
- Branding:
  - Inline logo (CID) with fallback URL
  - Env: `EMAIL_BRAND_LOGO_URL` (optional). Fallback: `${FRONTEND_URL}/sun-lms-logo-compact.png`
  - Header logo height ~48px
- Common vars available to all templates:
  - `appName?` (default: SunLMS)
  - `brandLogoCid?` (filled automatically when CID is embedded)
  - `brandLogoUrl?` (auto fallback)

## Account Lifecycle

### welcome_user
- Vars:
  - `firstName?`
  - `dashboardUrl?` (default: `${FRONTEND_URL}/dashboard`)
- Example:
```js
await sendTemplatedEmail('welcome_user', {
  to: user.email,
  variables: { firstName: 'Jane', dashboardUrl: `${FRONTEND_URL}/dashboard` }
});
```

### account_activated
- Vars: `firstName?`, `dashboardUrl?`

### account_deactivated
- Vars: `firstName?`, `supportUrl?`

### account_deleted
- Vars: `firstName?`

### admin_password_reset_notification
- Vars: `firstName?`, `loginUrl?` (default: `${FRONTEND_URL}/login`), `temporaryPassword?`

### 2fa_enabled, 2fa_disabled
- Vars: `firstName`, `timestamp` (preformatted string recommended)

## Authentication / Security

### password_reset
- Vars: `resetUrl` (required), `appName?`

## Enrollment & Certificates

### enrollment_created
- Vars: `firstName?`, `courseName`, `courseUrl?`

### course_completed_certificate
- Vars: `firstName?`, `courseName`, `certificateUrl?`

## Course Templates

### course_published
- Vars: `firstName?`, `courseName`, `courseUrl`
- Trigger: on publish (tenant-wide email to all active students)

### course_updated
- Vars: `firstName?`, `courseName`, `courseUrl?`, `updateDetails?` (e.g., `Updated: title, thumbnail`)
- Trigger: on update (enrolled students with status active or completed)

## Module Templates

### module_published
- Vars: `firstName?`, `moduleName`, `courseName`, `moduleUrl?`

### module_updated
- Vars: `firstName?`, `moduleName`, `courseName`, `moduleUrl?`, `updateDetails?`

## Lesson Templates

### lesson_published
- Vars: `firstName?`, `lessonName`, `moduleName`, `courseName`, `lessonUrl?`

### lesson_updated
- Vars: `firstName?`, `lessonName`, `moduleName`, `courseName`, `lessonUrl?`, `updateDetails?`

## Quiz Templates

### quiz_assigned (enhanced)
- Vars:
  - `firstName?`
  - `quizName` (required)
  - `quizUrl?`
  - `courseName?`
  - `moduleName?`
  - `dueAt?` (string)
  - `timeLimit?` (number, minutes)
  - `attemptsAllowed?` (number)
- Example:
```js
await sendTemplatedEmail('quiz_assigned', {
  to: student.email,
  variables: {
    firstName: student.first_name,
    quizName: quiz.title,
    quizUrl: `${FRONTEND_URL}/quizzes/${quiz.id}`,
    courseName: course.title,
    moduleName: module.title,
    dueAt: quiz.due_at,
    timeLimit: quiz.time_limit_minutes,
    attemptsAllowed: quiz.max_attempts
  }
});
```

### quiz_updated
- Vars: `firstName?`, `quizName`, `courseName`, `quizUrl?`, `updateDetails?`

### quiz_result
- Vars: `firstName?`, `quizName`, `score?`, `resultUrl?`

## Tenant-wide Course Announcement

### course_added_school
- Vars: `firstName?`, `courseName`, `courseUrl`
- Trigger: on course publish (moved from create to publish)

## Delivery & Branding

- CID Logo: The mailer attempts to inline the brand logo via CID; when not possible, falls back to an absolute URL.
- Env requirements (SMTP): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- Optional branding env: `EMAIL_BRAND_LOGO_URL`

## Implementation Notes

- Template rendering: `buildEmail(templateId, variables)` with graceful fallbacks.
- In-app notifications accompany emails for course/module/lesson/quiz events; enrolled students with status `active` and `completed` receive updates.
- Course publish sends tenant‑wide emails to all active students of the tenant; course updates target enrolled students only.

## Troubleshooting

- Logo not visible: ensure `EMAIL_BRAND_LOGO_URL` is reachable over HTTPS or allow CID embedding (default attempts CID). Some clients block external images by default.
- Missing details (e.g., moduleName): pass the variable in `variables` object; templates render conditionally.
- Time/dates: preformat `dueAt` and `timestamp` to user‑friendly strings before passing.
