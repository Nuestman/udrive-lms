// Reviews Service - handles platform, course, and school reviews
import { query } from '../lib/db.js';
import { createNotification } from './notifications.service.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { APP_CONFIG } from '../config/app.js';
import { isEmailConfigured, sendTemplatedEmail } from '../utils/mailer.js';

const REVIEW_TYPES = ['platform', 'course', 'school'];
const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];
const ACTIVE_STATUSES = ['pending', 'approved'];
const REVIEW_VISIBILITY = ['private', 'public'];
const PLATFORM_UUID_ZERO = '00000000-0000-0000-0000-000000000000';

const mapReviewRow = (row) => ({
  ...row,
  visibility: row.visibility,
  metadata: row.metadata || {},
  user: row.user_id
    ? {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        role: row.user_role,
      }
    : undefined,
  course: row.course_id
    ? {
        id: row.course_id,
        title: row.course_title,
        tenant_id: row.course_tenant_id,
      }
    : undefined,
  school: row.school_id
    ? {
        id: row.school_id,
        name: row.school_name,
        subdomain: row.school_subdomain,
      }
    : undefined,
  comments:
    row.comments && typeof row.comments === 'string'
      ? JSON.parse(row.comments)
      : row.comments || [],
});

const FRONTEND_URL =
  APP_CONFIG?.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

function formatDisplayName(person = {}) {
  if (!person) return '';
  if (person.display_name && person.display_name.trim().length > 0) {
    return person.display_name;
  }
  if (person.first_name || person.last_name) {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim();
  }
  if (person.name) return person.name;
  if (person.email) return person.email;
  return '';
}

async function getCourseOwnerRecipients(courseId) {
  if (!courseId) return [];

  const { rows } = await query(
    `
      SELECT
        u.id,
        u.email,
        COALESCE(
          NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
          u.email
        ) AS name,
        up.first_name
      FROM courses c
      JOIN users u ON u.id = c.created_by
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE c.id = $1
        AND u.is_active = TRUE
    `,
    [courseId]
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    firstName: row.first_name,
  }));
}

function buildCourseReviewUrl(course) {
  const base = FRONTEND_URL.replace(/\/$/, '');
  if (!course?.id) return `${base}/admin/reviews`;
  const courseSegment = course.slug || course.id;
  return `${base}/admin/reviews?course=${courseSegment}`;
}

async function notifyCourseOwnersOfReview({ review, course, reviewer }) {
  if (!course?.id || !isEmailConfigured()) {
    return;
  }

  const recipients = await getCourseOwnerRecipients(course.id);
  if (!recipients || recipients.length === 0) {
    return;
  }

  const reviewerName = formatDisplayName(reviewer) || 'A learner';
  const reviewBody = (review.body || '').trim();
  const reviewSnippet =
    reviewBody.length > 400 ? `${reviewBody.slice(0, 397)}…` : reviewBody;
  const reviewUrl = buildCourseReviewUrl(course);

  await Promise.all(
    recipients
      .filter((owner) => owner.email && owner.id !== review.user_id)
      .map(async (owner) => {
        try {
          await sendTemplatedEmail('review_submitted_notification', {
            to: owner.email,
            variables: {
              recipientName: owner.firstName || owner.name || owner.email,
              courseTitle: course.title || 'Course',
              reviewerName,
              reviewTitle: review.title || '',
              reviewBody: reviewSnippet,
              rating: review.rating,
              reviewUrl,
            },
          });
        } catch (error) {
          console.error('[Reviews] Failed to send course owner notification:', error);
        }
      })
  );
}

async function notifyCourseOwnersOfReviewComment({ review, course, comment, author }) {
  if (!course?.id || !isEmailConfigured()) {
    return;
  }

  const recipients = await getCourseOwnerRecipients(course.id);
  if (!recipients || recipients.length === 0) {
    return;
  }

  const commentAuthorName =
    formatDisplayName(author) || formatDisplayName(comment?.author) || 'Team member';
  const commentBody = (comment?.body || '').trim();
  const commentSnippet =
    commentBody.length > 400 ? `${commentBody.slice(0, 397)}…` : commentBody;
  const reviewUrl = buildCourseReviewUrl(course);
  const reviewSnippet =
    (review?.body || '').trim().length > 400
      ? `${review.body.slice(0, 397)}…`
      : (review?.body || '').trim();

  await Promise.all(
    recipients
      .filter((owner) => owner.email && owner.id !== comment?.author_id && owner.id !== author?.id)
      .map(async (owner) => {
        try {
          await sendTemplatedEmail('review_comment_notification', {
            to: owner.email,
            variables: {
              recipientName: owner.firstName || owner.name || owner.email,
              courseTitle: course.title || 'Course',
              commentAuthor: commentAuthorName,
              reviewBody: reviewSnippet,
              commentBody: commentSnippet,
              reviewUrl,
            },
          });
        } catch (error) {
          console.error('[Reviews] Failed to send review comment notification:', error);
        }
      })
  );
}

async function loadReviewContext(reviewId) {
  const { rows } = await query(
    `
      SELECT
        r.*,
        c.id AS course_id,
        c.slug AS course_slug,
        c.title AS course_title,
        c.created_by AS course_owner_id,
        c.tenant_id AS course_tenant_id,
        t.id AS school_id,
        t.name AS school_name
      FROM reviews r
      LEFT JOIN courses c ON r.reviewable_type = 'course' AND r.reviewable_id = c.id
      LEFT JOIN tenants t ON r.reviewable_type = 'school' AND r.reviewable_id = t.id
      WHERE r.id = $1
    `,
    [reviewId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  return rows[0];
}

async function fetchReviewCommentById(commentId) {
  const { rows } = await query(
    `
      SELECT
        rc.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'role', u.role,
          'firstName', up.first_name,
          'lastName', up.last_name,
          'fullName', NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), '')
        ) AS author
      FROM review_comments rc
      LEFT JOIN users u ON u.id = rc.author_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE rc.id = $1
    `,
    [commentId]
  );

  if (rows.length === 0) {
    return null;
  }

  const commentRow = rows[0];
  return {
    id: commentRow.id,
    review_id: commentRow.review_id,
    author_id: commentRow.author_id,
    body: commentRow.body,
    is_internal: commentRow.is_internal,
    created_at: commentRow.created_at,
    updated_at: commentRow.updated_at,
    author: commentRow.author,
  };
}

function canCommentOnReview(reviewContext, actor) {
  if (!actor) return false;
  const actorRole = actor.primaryRole || actor.role;
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;

  if (reviewContext.reviewable_type === 'course') {
    if (
      actorRole === 'school_admin' &&
      actor.tenant_id &&
      reviewContext.course_tenant_id &&
      actor.tenant_id === reviewContext.course_tenant_id
    ) {
      return true;
    }
    if (actorRole === 'instructor') {
      return reviewContext.course_owner_id === actor.id;
    }
  }

  if (reviewContext.reviewable_type === 'school') {
    if (
      actorRole === 'school_admin' &&
      actor.tenant_id &&
      reviewContext.reviewable_id &&
      actor.tenant_id === reviewContext.reviewable_id
    ) {
      return true;
    }
  }

  return false;
}

function assertReviewType(type) {
  if (!REVIEW_TYPES.includes(type)) {
    throw new ValidationError(`Invalid review type. Allowed: ${REVIEW_TYPES.join(', ')}`);
  }
}

function normalizeReviewableId(type, reviewableId) {
  if (type === 'platform') {
    return null;
  }

  if (!reviewableId) {
    throw new ValidationError(`${type.charAt(0).toUpperCase() + type.slice(1)} reviews require a target id`);
  }

  return reviewableId;
}

async function loadUserContext(userId) {
  const { rows } = await query(
    `SELECT 
        u.id,
        u.role,
        u.tenant_id,
        u.email,
        COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), u.email) AS display_name
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new ValidationError('User not found for review submission');
  }

  return rows[0];
}

async function ensureCourseAccess(reviewableId, user) {
  const { rows } = await query(
    `SELECT id, tenant_id, title, slug, created_by 
     FROM courses
     WHERE id = $1`,
    [reviewableId]
  );

  if (rows.length === 0) {
    throw new ValidationError('Course not found for review');
  }

  const course = rows[0];

  if (user.tenant_id && course.tenant_id && user.tenant_id !== course.tenant_id && user.role !== 'super_admin') {
    throw new ValidationError('You can only review courses that belong to your organization');
  }

  // Require enrollment for students
  if (user.role === 'student') {
    const enrollment = await query(
      `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2`,
      [user.id, reviewableId]
    );

    if (enrollment.rows.length === 0) {
      throw new ValidationError('You must be enrolled in the course to review it');
    }
  }

  return course;
}

async function ensureSchoolAccess(reviewableId, user) {
  const { rows } = await query(
    `SELECT id, name, subdomain 
     FROM tenants
     WHERE id = $1`,
    [reviewableId]
  );

  if (rows.length === 0) {
    throw new ValidationError('School not found for review');
  }

  const school = rows[0];

  if (user.role !== 'super_admin' && user.tenant_id !== reviewableId) {
    throw new ValidationError('You can only review your own school');
  }

  return school;
}

async function ensureNoActiveDuplicate(userId, reviewableType, reviewableId) {
  const normalized = reviewableId || PLATFORM_UUID_ZERO;
  const { rows } = await query(
    `SELECT id, status 
     FROM reviews
     WHERE user_id = $1
       AND reviewable_type = $2
       AND COALESCE(reviewable_id, $4::UUID) = COALESCE($3::UUID, $4::UUID)
       AND status = ANY($5::TEXT[])`,
    [userId, reviewableType, reviewableId, PLATFORM_UUID_ZERO, ACTIVE_STATUSES]
  );

  if (rows.length > 0) {
    throw new ValidationError(
      `You already have a ${rows[0].status} review for this ${reviewableType}. Please wait for moderation or update the existing review.`
    );
  }
}

async function fetchReviewModerationContext(reviewId) {
  const { rows } = await query(
    `
    SELECT
      r.id,
      r.reviewable_type,
      r.reviewable_id,
      r.visibility,
      u.tenant_id AS user_tenant_id,
      c.tenant_id AS course_tenant_id
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN courses c ON r.reviewable_type = 'course' AND r.reviewable_id = c.id
    WHERE r.id = $1
    `,
    [reviewId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  return rows[0];
}

function assertModerationScope(reviewContext, tenantId, isSuperAdmin) {
  if (isSuperAdmin) {
    return;
  }

  if (!tenantId) {
    throw new ForbiddenError('You do not have permission to moderate reviews outside your organization');
  }

  const isAllowed =
    (reviewContext.reviewable_type === 'platform' && reviewContext.user_tenant_id === tenantId) ||
    (reviewContext.reviewable_type === 'course' && reviewContext.course_tenant_id === tenantId) ||
    (reviewContext.reviewable_type === 'school' && reviewContext.reviewable_id === tenantId);

  if (!isAllowed) {
    throw new ForbiddenError('You can only moderate reviews belonging to your organization');
  }
}

async function notifyReviewModerators({
  review,
  reviewableType,
  reviewableId,
  user,
  course,
  school,
}) {
  try {
    const reviewerName = user.display_name || user.email || 'A learner';
    const tenantId =
      (reviewableType === 'course' && course?.tenant_id) ||
      (reviewableType === 'school' && school?.id) ||
      user.tenant_id ||
      null;

    const recipientsQuery = tenantId
      ? `
        SELECT id, role 
        FROM users 
        WHERE is_active = TRUE 
          AND role IN ('super_admin', 'school_admin')
          AND (role = 'super_admin' OR tenant_id = $1)
      `
      : `
        SELECT id, role 
        FROM users 
        WHERE is_active = TRUE 
          AND role = 'super_admin'
      `;

    const recipientsResult = await query(recipientsQuery, tenantId ? [tenantId] : []);
    if (recipientsResult.rows.length === 0) {
      return;
    }

    const title =
      reviewableType === 'course'
        ? `New course review submitted for "${course?.title || 'a course'}"`
        : `New school review submitted`;

    const messageParts = [`${reviewerName} shared a new review.`];
    if (review.rating) {
      messageParts.push(`Rating: ${review.rating}/5.`);
    }
    messageParts.push('Review is pending moderation.');

    const dataPayload = {
      eventType: 'review_submitted',
      reviewId: review.id,
      reviewableType,
      reviewableId,
      tenantId,
    };

    await Promise.all(
      recipientsResult.rows.map((recipient) => {
        const link =
          recipient.role === 'super_admin'
            ? '/admin/reviews?status=pending'
            : '/school/reviews?status=pending';

        return createNotification(
          recipient.id,
          {
            type: 'info',
            title,
            message: messageParts.join(' '),
            link,
            data: dataPayload,
          }
        );
      })
    );
  } catch (error) {
    console.error('Failed to dispatch review notifications:', error);
  }
}

export async function createReview(
  {
    userId,
    reviewableType,
    reviewableId,
    rating,
    title,
    body,
  },
) {
  if (!body || body.trim().length < 10) {
    throw new ValidationError('Review body must be at least 10 characters');
  }

  assertReviewType(reviewableType);

  if (reviewableType === 'platform') {
    throw new ValidationError('Platform feedback must be submitted using the dedicated feedback form.');
  }

  if (rating !== undefined && rating !== null) {
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }
    rating = parsedRating;
  } else {
    rating = null;
  }

  const normalizedReviewableId = normalizeReviewableId(reviewableType, reviewableId);
  const user = await loadUserContext(userId);

  let course, school;

  if (reviewableType === 'course') {
    course = await ensureCourseAccess(normalizedReviewableId, user);
  } else if (reviewableType === 'school') {
    school = await ensureSchoolAccess(normalizedReviewableId, user);
  }

  await ensureNoActiveDuplicate(userId, reviewableType, normalizedReviewableId);

  const result = await query(
    `INSERT INTO reviews (
      user_id,
      reviewable_type,
      reviewable_id,
      rating,
      title,
      body,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *`,
    [userId, reviewableType, normalizedReviewableId, rating, title?.trim() || null, body.trim()]
  );

  const reviewRow = result.rows[0];

  await notifyReviewModerators({
    review: reviewRow,
    reviewableType,
    reviewableId: normalizedReviewableId,
    user,
    course,
    school,
  });

  if (reviewableType === 'course' && course) {
    try {
      await notifyCourseOwnersOfReview({
        review: reviewRow,
        course,
        reviewer: user,
      });
    } catch (error) {
      console.error('[Reviews] Course owner email notification failed:', error);
    }
  }

  return {
    ...reviewRow,
    course,
    school,
  };
}

export async function getReviews(filters = {}, options = {}) {
  const { tenantId = null, isSuperAdmin = false } = options;
  const params = [];
  let idx = 1;
  let whereClauses = [];

  if (filters.status) {
    if (!REVIEW_STATUSES.includes(filters.status)) {
      throw new ValidationError(`Invalid status filter. Allowed: ${REVIEW_STATUSES.join(', ')}`);
    }
    whereClauses.push(`r.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.reviewable_type) {
    assertReviewType(filters.reviewable_type);
    whereClauses.push(`r.reviewable_type = $${idx}`);
    params.push(filters.reviewable_type);
    idx++;
  }

  if (filters.user_id) {
    whereClauses.push(`r.user_id = $${idx}`);
    params.push(filters.user_id);
    idx++;
  }

  if (filters.reviewable_id) {
    whereClauses.push(`r.reviewable_id = $${idx}`);
    params.push(filters.reviewable_id);
    idx++;
  }

  if (filters.visibility) {
    if (!REVIEW_VISIBILITY.includes(filters.visibility)) {
      throw new ValidationError(`Invalid visibility filter. Allowed: ${REVIEW_VISIBILITY.join(', ')}`);
    }
    whereClauses.push(`r.visibility = $${idx}`);
    params.push(filters.visibility);
    idx++;
  }

  if (filters.search) {
    whereClauses.push(`(
      r.title ILIKE $${idx} OR
      r.body ILIKE $${idx} OR
      u.email ILIKE $${idx}
    )`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  if (!isSuperAdmin && tenantId) {
    const tenantIdx = idx;
    params.push(tenantId);
    idx++;

    whereClauses.push(`
      (
        (r.reviewable_type = 'platform' AND u.tenant_id = $${tenantIdx})
        OR (r.reviewable_type = 'course' AND c.tenant_id = $${tenantIdx})
        OR (r.reviewable_type = 'school' AND r.reviewable_id = $${tenantIdx})
      )
    `);
  }

  const limit = filters.limit ? Math.min(parseInt(filters.limit, 10) || 20, 100) : 20;
  const offset = filters.offset ? Math.max(parseInt(filters.offset, 10) || 0, 0) : 0;

  params.push(limit);
  const limitIdx = idx;
  idx++;

  params.push(offset);
  const offsetIdx = idx;
  idx++;

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const { rows } = await query(
    `
    SELECT
      r.*,
      u.email AS user_email,
      u.role AS user_role,
      COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), u.email) AS user_name,
      CASE WHEN r.reviewable_type = 'course' THEN c.id END AS course_id,
      c.title AS course_title,
      c.tenant_id AS course_tenant_id,
      CASE WHEN r.reviewable_type = 'school' THEN t.id END AS school_id,
      t.name AS school_name,
      t.subdomain AS school_subdomain,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', rc.id,
              'review_id', rc.review_id,
              'author_id', rc.author_id,
              'body', rc.body,
              'is_internal', rc.is_internal,
              'created_at', rc.created_at,
              'updated_at', rc.updated_at,
              'author', json_build_object(
                'id', u2.id,
                'email', u2.email,
                'role', u2.role,
                'firstName', up2.first_name,
                'lastName', up2.last_name,
                'fullName', NULLIF(TRIM(CONCAT(up2.first_name, ' ', up2.last_name)), '')
              )
            )
            ORDER BY rc.created_at ASC
          )
          FROM review_comments rc
          LEFT JOIN users u2 ON u2.id = rc.author_id
          LEFT JOIN user_profiles up2 ON up2.user_id = u2.id
          WHERE rc.review_id = r.id AND rc.is_internal = FALSE
        ),
        '[]'::JSON
      ) AS comments
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN courses c ON r.reviewable_type = 'course' AND r.reviewable_id = c.id
    LEFT JOIN tenants t ON r.reviewable_type = 'school' AND r.reviewable_id = t.id
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
    `,
    params
  );

  return rows.map(mapReviewRow);
}

export async function getReviewById(reviewId) {
  const { rows } = await query(
    `
    SELECT
      r.*,
      u.email AS user_email,
      u.role AS user_role,
      COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), u.email) AS user_name,
      CASE WHEN r.reviewable_type = 'course' THEN c.id END AS course_id,
      c.title AS course_title,
      c.tenant_id AS course_tenant_id,
      CASE WHEN r.reviewable_type = 'school' THEN t.id END AS school_id,
      t.name AS school_name,
      t.subdomain AS school_subdomain,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', rc.id,
              'review_id', rc.review_id,
              'author_id', rc.author_id,
              'body', rc.body,
              'is_internal', rc.is_internal,
              'created_at', rc.created_at,
              'updated_at', rc.updated_at,
              'author', json_build_object(
                'id', u2.id,
                'email', u2.email,
                'role', u2.role,
                'firstName', up2.first_name,
                'lastName', up2.last_name,
                'fullName', NULLIF(TRIM(CONCAT(up2.first_name, ' ', up2.last_name)), '')
              )
            )
            ORDER BY rc.created_at ASC
          )
          FROM review_comments rc
          LEFT JOIN users u2 ON u2.id = rc.author_id
          LEFT JOIN user_profiles up2 ON up2.user_id = u2.id
          WHERE rc.review_id = r.id AND rc.is_internal = FALSE
        ),
        '[]'::JSON
      ) AS comments
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN courses c ON r.reviewable_type = 'course' AND r.reviewable_id = c.id
    LEFT JOIN tenants t ON r.reviewable_type = 'school' AND r.reviewable_id = t.id
    WHERE r.id = $1
    `,
    [reviewId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  return mapReviewRow(rows[0]);
}

export async function updateReviewStatus(reviewId, status, moderatorId, options = {}) {
  const { tenantId = null, isSuperAdmin = false } = options;

  if (!REVIEW_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Allowed: ${REVIEW_STATUSES.join(', ')}`);
  }

  const existing = await fetchReviewModerationContext(reviewId);
  assertModerationScope(existing, tenantId, isSuperAdmin);

  const approvedFields =
    status === 'approved'
      ? {
          approved_at: 'NOW()',
          approved_by: moderatorId ? `$3` : 'NULL',
        }
      : {
          approved_at: 'NULL',
          approved_by: 'NULL',
        };

  const params = [status, reviewId];
  if (status === 'approved' && moderatorId) {
    params.push(moderatorId);
  }

  const { rows } = await query(
    `
    UPDATE reviews
    SET status = $1,
        approved_at = ${approvedFields.approved_at},
        approved_by = ${approvedFields.approved_by},
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    params
  );

  if (rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  return getReviewById(rows[0].id);
}

export async function updateReviewVisibility(reviewId, visibility, options = {}) {
  const { tenantId = null, isSuperAdmin = false } = options;

  if (!REVIEW_VISIBILITY.includes(visibility)) {
    throw new ValidationError(`Invalid visibility. Allowed: ${REVIEW_VISIBILITY.join(', ')}`);
  }

  const existing = await fetchReviewModerationContext(reviewId);
  assertModerationScope(existing, tenantId, isSuperAdmin);

  await query(
    `
    UPDATE reviews
    SET visibility = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
    [visibility, reviewId]
  );

  return getReviewById(reviewId);
}

export async function getUserReviews(userId) {
  return getReviews({ user_id: userId, limit: 100 });
}

export async function getPublicReviews({ type = 'course', limit = 12, reviewableId = null } = {}) {
  assertReviewType(type);

  const params = [type, limit];
  const reviewableParamIndex = params.length + 1;
  if (reviewableId) {
    params.push(reviewableId);
  }

  const { rows } = await query(
    `
    SELECT
      r.*,
      u.email AS user_email,
      u.role AS user_role,
      COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), u.email) AS user_name,
      CASE WHEN r.reviewable_type = 'course' THEN c.id END AS course_id,
      c.title AS course_title,
      c.tenant_id AS course_tenant_id,
      CASE WHEN r.reviewable_type = 'school' THEN t.id END AS school_id,
      t.name AS school_name,
      t.subdomain AS school_subdomain,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', rc.id,
              'review_id', rc.review_id,
              'author_id', rc.author_id,
              'body', rc.body,
              'is_internal', rc.is_internal,
              'created_at', rc.created_at,
              'updated_at', rc.updated_at,
              'author', json_build_object(
                'id', u2.id,
                'email', u2.email,
                'role', u2.role,
                'firstName', up2.first_name,
                'lastName', up2.last_name,
                'fullName', NULLIF(TRIM(CONCAT(up2.first_name, ' ', up2.last_name)), '')
              )
            )
            ORDER BY rc.created_at ASC
          )
          FROM review_comments rc
          LEFT JOIN users u2 ON u2.id = rc.author_id
          LEFT JOIN user_profiles up2 ON up2.user_id = u2.id
          WHERE rc.review_id = r.id AND rc.is_internal = FALSE
        ),
        '[]'::JSON
      ) AS comments
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN courses c ON r.reviewable_type = 'course' AND r.reviewable_id = c.id
    LEFT JOIN tenants t ON r.reviewable_type = 'school' AND r.reviewable_id = t.id
    WHERE r.reviewable_type = $1
      AND r.status = 'approved'
      AND r.visibility = 'public'
      ${reviewableId ? `AND r.reviewable_id = $${reviewableParamIndex}` : ''}
    ORDER BY r.approved_at DESC NULLS LAST, r.created_at DESC
    LIMIT $2
    `,
    params
  );

  return rows.map(mapReviewRow);
}

export async function createReviewComment(reviewId, body, actor) {
  if (!body || !body.trim()) {
    throw new ValidationError('Comment body is required');
  }

  const reviewContext = await loadReviewContext(reviewId);
  if (!canCommentOnReview(reviewContext, actor)) {
    throw new ForbiddenError('You do not have permission to comment on this review');
  }

  const trimmedBody = body.trim();

  const { rows } = await query(
    `
      INSERT INTO review_comments (review_id, author_id, body, is_internal)
      VALUES ($1, $2, $3, FALSE)
      RETURNING id
    `,
    [reviewId, actor.id, trimmedBody]
  );

  const commentId = rows[0]?.id;
  if (!commentId) {
    throw new Error('Failed to create review comment');
  }

  const comment = await fetchReviewCommentById(commentId);

  if (reviewContext.reviewable_type === 'course') {
    try {
      await notifyCourseOwnersOfReviewComment({
        review: reviewContext,
        course: {
          id: reviewContext.course_id,
          title: reviewContext.course_title,
          slug: reviewContext.course_slug,
          tenant_id: reviewContext.course_tenant_id,
        },
        comment,
        author: actor,
      });
    } catch (error) {
      console.error('[Reviews] Comment email notification failed:', error);
    }
  }

  return comment;
}

export default {
  createReview,
  getReviews,
  getReviewById,
  getUserReviews,
  updateReviewStatus,
  updateReviewVisibility,
  getPublicReviews,
  createReviewComment,
};


