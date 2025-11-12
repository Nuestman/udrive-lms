/**
 * Course Support Questions & Replies Service
 * Handles CRUD operations for course support questions and replies
 */

import { query, getClient } from '../lib/db.js';

/**
 * Map database row to question object
 */
function mapQuestionRow(row) {
  if (!row) return null;

  const author = row.author && typeof row.author === 'string'
    ? JSON.parse(row.author)
    : row.author || null;

  const attachments = row.attachments && typeof row.attachments === 'string'
    ? JSON.parse(row.attachments)
    : row.attachments || [];

  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    lessonId: row.lesson_id,
    category: row.category,
    title: row.title,
    body: row.body,
    status: row.status,
    isPinned: row.is_pinned,
    viewCount: row.view_count,
    replyCount: row.reply_count,
    lastReplyAt: row.last_reply_at,
    metadata: row.metadata || {},
    attachments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author,
  };
}

/**
 * Map database row to reply object
 */
function mapReplyRow(row) {
  if (!row) return null;

  const author = row.author && typeof row.author === 'string'
    ? JSON.parse(row.author)
    : row.author || null;

  const attachments = row.attachments && typeof row.attachments === 'string'
    ? JSON.parse(row.attachments)
    : row.attachments || [];

  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    body: row.body,
    isAnswer: row.is_answer,
    isInstructorReply: row.is_instructor_reply,
    metadata: row.metadata || {},
    attachments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author,
  };
}

/**
 * Create a new support question
 */
export async function createQuestion(payload, { studentId, courseId }) {
  const { category, title, body, lesson_id, lessonId, metadata = {}, attachments = [] } = payload;

  if (!category || !title || !body) {
    throw new Error('Category, title, and body are required');
  }

  const validCategories = ['course_content', 'certificates', 'resources', 'technical', 'other'];
  if (!validCategories.includes(category)) {
    throw new Error('Invalid category');
  }

  const lessonIdValue = lesson_id || lessonId || null;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      INSERT INTO course_support_questions (
        course_id,
        student_id,
        lesson_id,
        category,
        title,
        body,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING *
      `,
      [courseId, studentId, lessonIdValue, category, title, body, JSON.stringify(metadata)]
    );

    const questionId = result.rows[0].id;

    // Insert attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const attachment of attachments) {
        await client.query(
          `
          INSERT INTO course_support_attachments (
            question_id,
            file_url,
            filename,
            original_filename,
            file_type,
            file_size,
            mime_type,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          `,
          [
            questionId,
            attachment.file_url || attachment.fileUrl || attachment.url,
            attachment.filename,
            attachment.original_filename || attachment.originalFilename,
            attachment.file_type || attachment.fileType || 'document',
            attachment.file_size || attachment.fileSize || 0,
            attachment.mime_type || attachment.mimeType || 'application/octet-stream',
            JSON.stringify(attachment.metadata || {}),
          ]
        );
      }
    }

    await client.query('COMMIT');

    return await getQuestionById(questionId, studentId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Get question by ID with author info
 */
export async function getQuestionById(questionId, viewerId = null) {
  const result = await query(
    `
    SELECT
      q.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'role', u.role,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'avatarUrl', p.avatar_url,
        'fullName', NULLIF(TRIM(concat_ws(' ', p.first_name, p.last_name)), '')
      ) AS author,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'file_url', a.file_url,
            'filename', a.filename,
            'original_filename', a.original_filename,
            'file_type', a.file_type,
            'file_size', a.file_size,
            'mime_type', a.mime_type,
            'metadata', a.metadata
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::JSON
      ) AS attachments
    FROM course_support_questions q
    LEFT JOIN users u ON u.id = q.student_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN course_support_attachments a ON a.question_id = q.id AND a.reply_id IS NULL
    WHERE q.id = $1
    GROUP BY q.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    `,
    [questionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Increment view count if viewer is not the author
  const question = result.rows[0];
  if (viewerId && viewerId !== question.student_id) {
    await query('SELECT increment_question_view_count($1)', [questionId]);
  }

  return mapQuestionRow(result.rows[0]);
}

/**
 * List questions with filters
 */
export async function listQuestions({
  courseId,
  studentId,
  category,
  status,
  search,
  limit = 25,
  offset = 0,
}) {
  const params = [];
  const conditions = [];

  if (courseId) {
    params.push(courseId);
    conditions.push(`q.course_id = $${params.length}`);
  }

  if (studentId) {
    params.push(studentId);
    conditions.push(`q.student_id = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`q.category = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`q.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(q.title ILIKE $${params.length} OR q.body ILIKE $${params.length})`);
  }

  params.push(limit);
  params.push(offset);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `
    SELECT
      q.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'role', u.role,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'avatarUrl', p.avatar_url,
        'fullName', NULLIF(TRIM(concat_ws(' ', p.first_name, p.last_name)), '')
      ) AS author,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'file_url', a.file_url,
            'filename', a.filename,
            'original_filename', a.original_filename,
            'file_type', a.file_type,
            'file_size', a.file_size,
            'mime_type', a.mime_type,
            'metadata', a.metadata
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::JSON
      ) AS attachments
    FROM course_support_questions q
    LEFT JOIN users u ON u.id = q.student_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN course_support_attachments a ON a.question_id = q.id AND a.reply_id IS NULL
    ${whereClause}
    GROUP BY q.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    ORDER BY q.is_pinned DESC, q.last_reply_at DESC NULLS LAST, q.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );

  return result.rows.map(mapQuestionRow);
}

/**
 * Create a reply to a question
 */
export async function createReply(payload, { userId, questionId, isInstructor = false }) {
  const { body, metadata = {}, attachments = [] } = payload;

  if (!body || !body.trim()) {
    throw new Error('Reply body is required');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if question exists
    const questionResult = await client.query(
      'SELECT course_id, student_id FROM course_support_questions WHERE id = $1',
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult.rows[0];

    // Insert reply
    const result = await client.query(
      `
      INSERT INTO course_support_replies (
        question_id,
        user_id,
        body,
        is_instructor_reply,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING *
      `,
      [questionId, userId, body, isInstructor, JSON.stringify(metadata)]
    );

    const replyId = result.rows[0].id;

    // Insert attachments if provided
    // For reply attachments, question_id must be NULL (constraint requires either question_id OR reply_id, not both)
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const attachment of attachments) {
        await client.query(
          `
          INSERT INTO course_support_attachments (
            question_id,
            reply_id,
            file_url,
            filename,
            original_filename,
            file_type,
            file_size,
            mime_type,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
          `,
          [
            null, // question_id must be NULL for reply attachments
            replyId,
            attachment.file_url || attachment.fileUrl || attachment.url,
            attachment.filename,
            attachment.original_filename || attachment.originalFilename,
            attachment.file_type || attachment.fileType || 'document',
            attachment.file_size || attachment.fileSize || 0,
            attachment.mime_type || attachment.mimeType || 'application/octet-stream',
            JSON.stringify(attachment.metadata || {}),
          ]
        );
      }
    }

    await client.query('COMMIT');

    return await getReplyById(replyId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Get reply by ID with author info
 */
export async function getReplyById(replyId) {
  const result = await query(
    `
    SELECT
      r.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'role', u.role,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'avatarUrl', p.avatar_url,
        'fullName', NULLIF(TRIM(concat_ws(' ', p.first_name, p.last_name)), '')
      ) AS author,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'file_url', a.file_url,
            'filename', a.filename,
            'original_filename', a.original_filename,
            'file_type', a.file_type,
            'file_size', a.file_size,
            'mime_type', a.mime_type,
            'metadata', a.metadata
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::JSON
      ) AS attachments
    FROM course_support_replies r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN course_support_attachments a ON a.reply_id = r.id
    WHERE r.id = $1
    GROUP BY r.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    `,
    [replyId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapReplyRow(result.rows[0]);
}

/**
 * Get all replies for a question
 */
export async function getQuestionReplies(questionId) {
  const result = await query(
    `
    SELECT
      r.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'role', u.role,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'avatarUrl', p.avatar_url,
        'fullName', NULLIF(TRIM(concat_ws(' ', p.first_name, p.last_name)), '')
      ) AS author,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'file_url', a.file_url,
            'filename', a.filename,
            'original_filename', a.original_filename,
            'file_type', a.file_type,
            'file_size', a.file_size,
            'mime_type', a.mime_type,
            'metadata', a.metadata
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::JSON
      ) AS attachments
    FROM course_support_replies r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN course_support_attachments a ON a.reply_id = r.id
    WHERE r.question_id = $1
    GROUP BY r.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    ORDER BY r.is_answer DESC, r.created_at ASC
    `,
    [questionId]
  );

  return result.rows.map(mapReplyRow);
}

/**
 * Mark a reply as the accepted answer
 */
export async function markReplyAsAnswer(replyId, questionId, actorId) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify question ownership or instructor status
    const questionResult = await client.query(
      `
      SELECT q.student_id, c.created_by, c.tenant_id
      FROM course_support_questions q
      JOIN courses c ON c.id = q.course_id
      WHERE q.id = $1
      `,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult.rows[0];
    const isOwner = question.student_id === actorId;
    
    // Check if actor is instructor/admin
    const userCheck = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [actorId]
    );
    const userRole = userCheck.rows[0]?.role;
    const isInstructor = ['super_admin', 'school_admin', 'instructor'].includes(userRole) && 
                         (question.created_by === actorId || userRole === 'super_admin');

    if (!isOwner && !isInstructor) {
      throw new Error('Only the question author or course instructor can mark answers');
    }

    // Unmark any existing answer
    await client.query(
      'UPDATE course_support_replies SET is_answer = false WHERE question_id = $1',
      [questionId]
    );

    // Mark this reply as answer
    await client.query(
      'UPDATE course_support_replies SET is_answer = true WHERE id = $1',
      [replyId]
    );

    await client.query('COMMIT');

    return await getReplyById(replyId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Update question status
 */
export async function updateQuestionStatus(questionId, status, actorId) {
  const validStatuses = ['open', 'answered', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership or instructor status
    const questionResult = await client.query(
      `
      SELECT q.student_id, c.created_by, c.tenant_id
      FROM course_support_questions q
      JOIN courses c ON c.id = q.course_id
      WHERE q.id = $1
      `,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult.rows[0];
    const isOwner = question.student_id === actorId;
    
    // Check if actor is instructor/admin (need to check user role)
    const userCheck = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [actorId]
    );
    const userRole = userCheck.rows[0]?.role;
    const isInstructor = ['super_admin', 'school_admin', 'instructor'].includes(userRole) && 
                         (question.created_by === actorId || userRole === 'super_admin');

    if (!isOwner && !isInstructor) {
      throw new Error('Only the question author or course instructor can update status');
    }

    const result = await client.query(
      'UPDATE course_support_questions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, questionId]
    );

    await client.query('COMMIT');

    return mapQuestionRow(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Update a question (only by the author)
 */
export async function updateQuestion(questionId, payload, actorId) {
  const { title, body, category, lesson_id, lessonId, metadata = {}, attachments = [] } = payload;
  
  if (!title || !title.trim()) {
    throw new Error('Title is required');
  }
  
  if (!body || !body.trim()) {
    throw new Error('Body is required');
  }

  const client = await getClient();
  const lessonIdValue = lesson_id || lessonId || null;

  try {
    await client.query('BEGIN');

    // Verify ownership
    const questionResult = await client.query(
      'SELECT student_id FROM course_support_questions WHERE id = $1',
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    if (questionResult.rows[0].student_id !== actorId) {
      throw new Error('Only the question author can edit it');
    }

    // Update question
    const result = await client.query(
      `UPDATE course_support_questions 
       SET title = $1, body = $2, category = $3, lesson_id = $4, metadata = $5::jsonb, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, body, category, lessonIdValue, JSON.stringify(metadata), questionId]
    );

    // Delete existing attachments
    await client.query(
      'DELETE FROM course_support_attachments WHERE question_id = $1',
      [questionId]
    );

    // Insert new attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const attachment of attachments) {
        await client.query(
          `INSERT INTO course_support_attachments (
            question_id, file_url, filename, original_filename, file_type, file_size, mime_type, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [
            questionId,
            attachment.file_url || attachment.fileUrl || attachment.url,
            attachment.filename,
            attachment.original_filename || attachment.originalFilename,
            attachment.file_type || attachment.fileType || 'document',
            attachment.file_size || attachment.fileSize || 0,
            attachment.mime_type || attachment.mimeType || 'application/octet-stream',
            JSON.stringify(attachment.metadata || {}),
          ]
        );
      }
    }

    await client.query('COMMIT');

    return await getQuestionById(questionId, actorId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Delete a question (only by the author)
 */
export async function deleteQuestion(questionId, actorId) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const questionResult = await client.query(
      'SELECT student_id FROM course_support_questions WHERE id = $1',
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    if (questionResult.rows[0].student_id !== actorId) {
      throw new Error('Only the question author can delete it');
    }

    // Delete question (CASCADE will handle attachments and replies)
    await client.query(
      'DELETE FROM course_support_questions WHERE id = $1',
      [questionId]
    );

    await client.query('COMMIT');

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Update a reply (only by the author)
 */
export async function updateReply(replyId, payload, actorId) {
  const { body, metadata = {}, attachments = [] } = payload;
  
  if (!body || !body.trim()) {
    throw new Error('Reply body is required');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const replyResult = await client.query(
      'SELECT user_id FROM course_support_replies WHERE id = $1',
      [replyId]
    );

    if (replyResult.rows.length === 0) {
      throw new Error('Reply not found');
    }

    if (replyResult.rows[0].user_id !== actorId) {
      throw new Error('Only the reply author can edit it');
    }

    // Update reply
    const result = await client.query(
      `UPDATE course_support_replies 
       SET body = $1, metadata = $2::jsonb, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [body, JSON.stringify(metadata), replyId]
    );

    // Delete existing attachments
    await client.query(
      'DELETE FROM course_support_attachments WHERE reply_id = $1',
      [replyId]
    );

    // Insert new attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const attachment of attachments) {
        await client.query(
          `INSERT INTO course_support_attachments (
            question_id, reply_id, file_url, filename, original_filename, file_type, file_size, mime_type, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
          [
            null, // question_id must be NULL for reply attachments
            replyId,
            attachment.file_url || attachment.fileUrl || attachment.url,
            attachment.filename,
            attachment.original_filename || attachment.originalFilename,
            attachment.file_type || attachment.fileType || 'document',
            attachment.file_size || attachment.fileSize || 0,
            attachment.mime_type || attachment.mimeType || 'application/octet-stream',
            JSON.stringify(attachment.metadata || {}),
          ]
        );
      }
    }

    await client.query('COMMIT');

    return await getReplyById(replyId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Delete a reply (only by the author)
 */
export async function deleteReply(replyId, actorId) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const replyResult = await client.query(
      'SELECT user_id FROM course_support_replies WHERE id = $1',
      [replyId]
    );

    if (replyResult.rows.length === 0) {
      throw new Error('Reply not found');
    }

    if (replyResult.rows[0].user_id !== actorId) {
      throw new Error('Only the reply author can delete it');
    }

    // Delete reply (CASCADE will handle attachments)
    await client.query(
      'DELETE FROM course_support_replies WHERE id = $1',
      [replyId]
    );

    await client.query('COMMIT');

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

