// Testimonials Service - curated marketing stories
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const TESTIMONIAL_STATUSES = ['draft', 'published', 'archived'];

function validateTestimonialPayload(payload) {
  const { review_id, feedback_id, body } = payload;
  if (!review_id && !feedback_id && (!body || body.trim().length === 0)) {
    throw new ValidationError('Provide a linked review, platform feedback entry, or manual body content.');
  }

  if (payload.status && !TESTIMONIAL_STATUSES.includes(payload.status)) {
    throw new ValidationError(`Invalid status. Allowed: ${TESTIMONIAL_STATUSES.join(', ')}`);
  }
}

function buildUpdateClause(data) {
  const columns = [];
  const values = [];
  let idx = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    columns.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  });

  return { columns, values };
}

export async function listTestimonials(filters = {}) {
  const params = [];
  const whereClauses = [];

  if (filters.status) {
    if (!TESTIMONIAL_STATUSES.includes(filters.status)) {
      throw new ValidationError(`Invalid status filter. Allowed: ${TESTIMONIAL_STATUSES.join(', ')}`);
    }
    params.push(filters.status);
    whereClauses.push(`status = $${params.length}`);
  }

  if (filters.placement) {
    params.push(filters.placement);
    whereClauses.push(`placement = $${params.length}`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const { rows } = await query(
    `
    SELECT *
    FROM testimonials
    ${whereSql}
    ORDER BY display_order ASC, created_at DESC
    `,
    params
  );

  return rows;
}

export async function listPublishedTestimonials({ placement = null, limit = 12, featuredOnly = false } = {}) {
  const params = ['published'];
  const whereClauses = ['status = $1'];

  if (placement) {
    params.push(placement);
    whereClauses.push(`placement = $${params.length}`);
  }

  if (featuredOnly) {
    whereClauses.push('is_featured = true');
  }

  params.push(limit);

  const { rows } = await query(
    `
    SELECT *
    FROM testimonials
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY display_order ASC, created_at DESC
    LIMIT $${params.length}
    `,
    params
  );

  return rows;
}

export async function getTestimonialById(id) {
  const { rows } = await query(`SELECT * FROM testimonials WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw new NotFoundError('Testimonial not found');
  }
  return rows[0];
}

export async function createTestimonial(data) {
  validateTestimonialPayload(data);

  const result = await query(
    `
    INSERT INTO testimonials (
      review_id,
      feedback_id,
      headline,
      body,
      attribution_name,
      attribution_title,
      attribution_organization,
      placement,
      display_order,
      status,
      is_featured,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 0), COALESCE($10, 'draft'), COALESCE($11, false), COALESCE($12, '{}'))
    RETURNING *
    `,
    [
      data.review_id || null,
      data.feedback_id || null,
      data.headline || null,
      data.body || null,
      data.attribution_name || null,
      data.attribution_title || null,
      data.attribution_organization || null,
      data.placement || null,
      data.display_order,
      data.status,
      data.is_featured,
      data.metadata || {},
    ]
  );

  return result.rows[0];
}

export async function updateTestimonial(id, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    return getTestimonialById(id);
  }

  validateTestimonialPayload({
    review_id: updates.review_id,
    feedback_id: updates.feedback_id,
    body: updates.body,
    status: updates.status,
  });

  const { columns, values } = buildUpdateClause({
    review_id: updates.review_id ?? null,
    feedback_id: updates.feedback_id ?? null,
    headline: updates.headline,
    body: updates.body,
    attribution_name: updates.attribution_name,
    attribution_title: updates.attribution_title,
    attribution_organization: updates.attribution_organization,
    placement: updates.placement,
    display_order: updates.display_order,
    status: updates.status,
    is_featured: updates.is_featured,
    metadata: updates.metadata,
  });

  if (!columns.length) {
    return getTestimonialById(id);
  }

  const setClauses = columns.map((clause) => {
    if (clause.endsWith('= NOW()')) {
      return clause;
    }
    return clause;
  });

  const result = await query(
    `
    UPDATE testimonials
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length + 1}
    RETURNING *
    `,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Testimonial not found');
  }

  return result.rows[0];
}

export async function deleteTestimonial(id) {
  const { rowCount } = await query('DELETE FROM testimonials WHERE id = $1', [id]);
  if (rowCount === 0) {
    throw new NotFoundError('Testimonial not found');
  }
  return { success: true };
}

export default {
  listTestimonials,
  listPublishedTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};

