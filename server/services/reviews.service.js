// Reviews Service - handles platform, course, and school reviews
import { query } from '../lib/db.js';
import { createNotification } from './notifications.service.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

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
});

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
    `SELECT id, tenant_id, title 
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
  io = null,
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
          },
          io
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
  { io = null } = {}
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
    io,
  });

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
      t.subdomain AS school_subdomain
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
      t.subdomain AS school_subdomain
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
      COALESCE(NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''), u.email) AS user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE r.reviewable_type = $1
      AND r.status = 'approved'
      AND r.visibility = 'public'
      ${reviewableId ? `AND r.reviewable_id = $${reviewableParamIndex}` : ''}
    ORDER BY r.approved_at DESC NULLS LAST, r.created_at DESC
    LIMIT $2
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    user: {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
    },
  }));
}

export default {
  createReview,
  getReviews,
  getReviewById,
  getUserReviews,
  updateReviewStatus,
  updateReviewVisibility,
  getPublicReviews,
};


