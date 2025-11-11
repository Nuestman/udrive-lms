// Course Review Settings Service
import { query } from '../lib/db.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const TRIGGER_TYPES = ['percentage', 'lesson_count', 'manual'];

function validateSettings(payload) {
  if (payload.trigger_type && !TRIGGER_TYPES.includes(payload.trigger_type)) {
    throw new ValidationError(`Invalid trigger_type. Allowed: ${TRIGGER_TYPES.join(', ')}`);
  }

  if (payload.trigger_type === 'percentage') {
    if (payload.trigger_value === undefined || payload.trigger_value === null) {
      payload.trigger_value = 20;
    }
    const percent = Number(payload.trigger_value);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      throw new ValidationError('trigger_value must be an integer between 1 and 100 for percentage triggers');
    }
    payload.trigger_value = percent;
  } else if (payload.trigger_type === 'lesson_count') {
    if (payload.trigger_value === undefined || payload.trigger_value === null) {
      throw new ValidationError('trigger_value is required for lesson_count triggers');
    }
    const lessons = Number(payload.trigger_value);
    if (!Number.isInteger(lessons) || lessons < 1) {
      throw new ValidationError('trigger_value must be a positive integer for lesson_count triggers');
    }
    payload.trigger_value = lessons;
  } else if (payload.trigger_type === 'manual') {
    payload.trigger_value = null;
  }

  if (payload.cooldown_days !== undefined && payload.cooldown_days !== null) {
    const cooldown = Number(payload.cooldown_days);
    if (!Number.isInteger(cooldown) || cooldown < 0) {
      throw new ValidationError('cooldown_days must be a non-negative integer');
    }
    payload.cooldown_days = cooldown;
  }

  payload.allow_multiple = Boolean(payload.allow_multiple);
  payload.manual_trigger_enabled = Boolean(payload.manual_trigger_enabled);
}

export async function getCourseReviewSettings(courseId) {
  const { rows } = await query(
    `SELECT * FROM course_review_settings WHERE course_id = $1`,
    [courseId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

export async function upsertCourseReviewSettings(courseId, data) {
  validateSettings(data);

  const existing = await getCourseReviewSettings(courseId);
  const metadataValue =
    data.metadata === undefined || data.metadata === null
      ? null
      : typeof data.metadata === 'string'
      ? data.metadata
      : JSON.stringify(data.metadata);

  if (existing) {
    const result = await query(
      `
      UPDATE course_review_settings
      SET trigger_type = COALESCE($2, trigger_type),
          trigger_value = COALESCE($3, trigger_value),
          cooldown_days = COALESCE($4, cooldown_days),
          allow_multiple = COALESCE($5, allow_multiple),
          manual_trigger_enabled = COALESCE($6, manual_trigger_enabled),
          prompt_message = COALESCE($7, prompt_message),
          metadata = COALESCE($8::jsonb, metadata),
          updated_at = NOW()
      WHERE course_id = $1
      RETURNING *
      `,
      [
        courseId,
        data.trigger_type || null,
        data.trigger_value,
        data.cooldown_days,
        data.allow_multiple,
        data.manual_trigger_enabled,
        data.prompt_message || null,
        metadataValue,
      ]
    );

    return result.rows[0];
  }

  const result = await query(
    `
    INSERT INTO course_review_settings (
      course_id,
      trigger_type,
      trigger_value,
      cooldown_days,
      allow_multiple,
      manual_trigger_enabled,
      prompt_message,
      metadata
    )
    VALUES ($1, COALESCE($2, 'percentage'), $3, COALESCE($4, 30), COALESCE($5, false), COALESCE($6, false), $7, COALESCE($8::jsonb, '{}'::jsonb))
    RETURNING *
    `,
    [
      courseId,
      data.trigger_type || null,
      data.trigger_value,
      data.cooldown_days,
      data.allow_multiple,
      data.manual_trigger_enabled,
      data.prompt_message || null,
      metadataValue ?? JSON.stringify({}),
    ]
  );

  return result.rows[0];
}

export async function recordPromptHistory({ courseId, userId, reviewId = null, status = 'pending', metadata = {} }) {
  const result = await query(
    `
    INSERT INTO course_review_prompt_history (
      course_id,
      user_id,
      last_prompted_at,
      last_review_id,
      prompt_count,
      status,
      metadata
    )
    VALUES ($1, $2, NOW(), $3, 1, $4, $5)
    ON CONFLICT (course_id, user_id)
    DO UPDATE SET
      last_prompted_at = NOW(),
      last_review_id = EXCLUDED.last_review_id,
      prompt_count = course_review_prompt_history.prompt_count + 1,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING *
    `,
    [courseId, userId, reviewId, status, metadata]
  );

  return result.rows[0];
}

export async function updatePromptStatus(courseId, userId, status) {
  if (!['pending', 'dismissed', 'completed'].includes(status)) {
    throw new ValidationError('Invalid prompt status');
  }

  const { rows } = await query(
    `
    UPDATE course_review_prompt_history
    SET status = $3,
        updated_at = NOW()
    WHERE course_id = $1
      AND user_id = $2
    RETURNING *
    `,
    [courseId, userId, status]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Prompt history not found');
  }

  return rows[0];
}

export default {
  getCourseReviewSettings,
  upsertCourseReviewSettings,
  recordPromptHistory,
  updatePromptStatus,
};


