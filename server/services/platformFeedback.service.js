// Platform Feedback Service - internal product insights
import { query } from '../lib/db.js';
import { ValidationError } from '../middleware/errorHandler.js';

const SCORE_FIELDS = [
  'onboarding_score',
  'usability_score',
  'ui_score',
  'navigation_score',
  'support_score',
];

function validateScores(payload) {
  let hasSignal = false;

  SCORE_FIELDS.forEach((field) => {
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      payload[field] = null;
      return;
    }

    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
      throw new ValidationError(`${field} must be an integer between 1 and 5`);
    }

    payload[field] = numericValue;
    hasSignal = true;
  });

  if (!hasSignal && !payload.comments) {
    throw new ValidationError('Please provide at least one score or a comment.');
  }
}

export async function createPlatformFeedback({
  userId,
  tenantId,
  onboarding_score,
  usability_score,
  ui_score,
  navigation_score,
  support_score,
  role_context,
  comments,
  submitted_from,
  additional_context,
}) {
  const payload = {
    onboarding_score,
    usability_score,
    ui_score,
    navigation_score,
    support_score,
    role_context: role_context?.trim() || null,
    comments: comments?.trim() || null,
    submitted_from: submitted_from?.trim() || null,
    additional_context: additional_context || {},
  };

  validateScores(payload);

  const result = await query(
    `INSERT INTO platform_feedback (
      user_id,
      tenant_id,
      onboarding_score,
      usability_score,
      ui_score,
      navigation_score,
      support_score,
      role_context,
      comments,
      submitted_from,
      additional_context
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      userId,
      tenantId,
      payload.onboarding_score,
      payload.usability_score,
      payload.ui_score,
      payload.navigation_score,
      payload.support_score,
      payload.role_context,
      payload.comments,
      payload.submitted_from,
      payload.additional_context,
    ]
  );

  return result.rows[0];
}

export async function listPlatformFeedback({ tenantId = null, isSuperAdmin = false, limit = 50, offset = 0 }) {
  const params = [];
  let whereClause = '';

  if (!isSuperAdmin) {
    params.push(tenantId);
    whereClause = 'WHERE tenant_id = $1';
  } else if (tenantId) {
    params.push(tenantId);
    whereClause = 'WHERE tenant_id = $1';
  }

  params.push(limit);
  params.push(offset);

  const { rows } = await query(
    `
    SELECT *
    FROM platform_feedback
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
    `,
    params
  );

  return rows;
}

export async function getPlatformFeedbackSummary({ tenantId = null, isSuperAdmin = false }) {
  const params = [];
  let whereClause = '';

  if (!isSuperAdmin) {
    params.push(tenantId);
    whereClause = 'WHERE tenant_id = $1';
  } else if (tenantId) {
    params.push(tenantId);
    whereClause = 'WHERE tenant_id = $1';
  }

  const { rows } = await query(
    `
    SELECT
      COUNT(*) AS total_responses,
      AVG(onboarding_score)::NUMERIC(10,2) AS avg_onboarding_score,
      AVG(usability_score)::NUMERIC(10,2) AS avg_usability_score,
      AVG(ui_score)::NUMERIC(10,2) AS avg_ui_score,
      AVG(navigation_score)::NUMERIC(10,2) AS avg_navigation_score,
      AVG(support_score)::NUMERIC(10,2) AS avg_support_score,
      MIN(created_at) AS first_response_at,
      MAX(created_at) AS last_response_at
    FROM platform_feedback
    ${whereClause}
    `,
    params
  );

  return rows[0] || {
    total_responses: 0,
    avg_onboarding_score: null,
    avg_usability_score: null,
    avg_ui_score: null,
    avg_navigation_score: null,
    avg_support_score: null,
    first_response_at: null,
    last_response_at: null,
  };
}

export default {
  createPlatformFeedback,
  listPlatformFeedback,
  getPlatformFeedbackSummary,
};


