# Feedback, Reviews & Testimonials

The reviews pipeline lets authenticated users submit feedback about the platform, specific courses, and their school (tenant). Submissions 
stay in a `pending` state until approved by an administrator, which prevents spam from reaching public surfaces.
We now treat feedback, reviews, and testimonials as distinct but connected channels:[^1][^2][^3]

- **Platform feedback** (internal) captures actionable product insights across onboarding, usability, UI, navigation, and support.
- **Reviews** (public) represent authentic course and school sentiment that is moderated before being surfaced in product.
- **Testimonials** (marketing) are curated stories sourced from reviews/feedback or written manually for high-impact surfaces.

## Data Model

- `platform_feedback` — structured scores (1–5), comments, and role context for internal analysis.
- `reviews` — stores course/school reviews with `status`, `visibility` (`private`, `public`), and light metadata. Platform submissions are now routed through `platform_feedback`.
- `testimonials` — curated quotes referencing a `review_id`, `feedback_id`, or standalone copy. Includes placement metadata and featured flag.
- `course_review_settings` — per-course configuration for triggering review prompts (percentage, lesson count, or manual).
- `course_review_prompt_history` — tracks prompts per learner, preventing duplicates and respecting cooldowns.

All tables include `updated_at` triggers and tenant-aware constraints.

## API Surface

| Endpoint | Auth | Description |
| --- | --- | --- |
| `POST /api/feedback/platform` | Authenticated user | Submit structured platform feedback (Likert scores + comments). |
| `GET /api/feedback/platform` | Super/school admin | List raw platform responses (tenant scoped). |
| `GET /api/feedback/platform/summary` | Super/school admin | Aggregate averages & totals per tenant. |
| `POST /api/reviews` | Authenticated user | Submit **course** or **school** review (enrollment & tenant checks enforced). |
| `GET /api/reviews/mine` | Authenticated user | Personal history for transparency. |
| `GET /api/reviews/public?type=course&reviewable_id=...` | Public | Fetch approved, public reviews for a given course or school. |
| `GET /api/reviews` | Super/school admin | Moderation queue with `status`, `type`, `visibility`, search and pagination. |
| `PUT /api/reviews/:id/status` | Super/school admin | Approve/reject review (records moderator + timestamp). |
| `PUT /api/reviews/:id/visibility` | Super/school admin | Toggle `public` / `private` visibility after moderation. |
| `GET /api/testimonials/public` | Public | Fetch curated testimonials by placement/featured flag. |
| `GET/POST/PUT/DELETE /api/testimonials` | Super/school admin | Manage curated marketing stories. |
| `GET/PUT /api/review-settings/:courseId` | Auth roles that can edit a course | Configure prompt rules and guidance copy for a course. |

## Frontend Surfaces

- **Platform feedback**
  - `/feedback` renders a focused five-question survey with quick-tag comments (`platformFeedback.service`).
  - `/admin/feedback-insights`, `/school/feedback-insights` provide averages + raw response table for ops teams.
- **Reviews**
  - `StudentLessonViewer` shows a reviews tab with course-specific sentiment and a modal to submit a review.
  - In-course prompts respect `course_review_settings`; current hook exposes a manual launch button with history tracking ready for future automation.
  - `/admin/reviews` & `/school/reviews` allow moderation, status, and visibility management.
- **Testimonials**
  - `/admin/testimonials` lets admins curate/publish stories and flag featured placements.
  - `GET /api/testimonials/public` feeds landing-page hero/testimonial components.
- **Course owners**
  - `CourseDetailsPage` now includes a “Review Prompt Settings” card for instructors/admins to configure triggers and messaging.

## Landing Page & Marketing Usage

- Prefer pulling testimonials via `GET /api/testimonials/public?placement=landing-page&featured=true`.
- Course detail views inside the app should use `GET /api/reviews/public?type=course&reviewable_id=<course_id>` for authentic voices.
- Cache responses aggressively (ISR, stale-while-revalidate) to keep marketing pages snappy.

## Operational Notes

- New migrations: `20251112_reviews_feedback_overhaul.sql` must be applied after deploy.
- Existing platform reviews remain but should be migrated to platform feedback if encountered.
- When porting legacy testimonials, hydrate `testimonials` with `status='published'` and optionally link back to `reviews` or `platform_feedback`.

## Future Touchpoints

- Courses dashboard: surface approved course reviews alongside curriculum metrics.
- School insights: display sentiment trends for school admins (aggregate rating averages per tenant).
- Notifications: send moderators a digest when new reviews arrive (hook into `createReview`).

[^1]: https://feedcheck.co/blog/the-differences-between-reviews-and-testimonials/
[^2]: https://remotevideotestimonials.com/testimonials-vs-reviews
[^3]: https://www.indeed.com/career-advice/career-development/testimonial-vs-review

