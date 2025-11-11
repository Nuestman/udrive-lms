import { query, getClient } from '../lib/db.js';
import { APP_CONFIG } from '../config/app.js';
import whiteLabelService from './whiteLabel.service.js';
import { isEmailConfigured, sendTemplatedEmail } from '../utils/mailer.js';

const ALLOWED_TARGET_ROLES = ['student', 'instructor', 'school_admin', 'super_admin'];
const DEFAULT_TARGET_ROLES = ['student'];

function normalizeTargetRoles(targetRoles = DEFAULT_TARGET_ROLES) {
  const seen = new Set();
  for (const role of targetRoles) {
    const normalized = String(role || '').toLowerCase();
    if (ALLOWED_TARGET_ROLES.includes(normalized)) {
      seen.add(normalized);
    }
  }
  if (seen.size === 0) {
    DEFAULT_TARGET_ROLES.forEach(role => seen.add(role));
  }
  return Array.from(seen);
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return fallback;
}

function mapAnnouncementRow(row) {
  if (!row) return null;

  const media = Array.isArray(row.media)
    ? row.media.filter(Boolean)
    : (typeof row.media === 'string' ? JSON.parse(row.media) : []);

  const author = row.author && typeof row.author === 'string'
    ? JSON.parse(row.author)
    : row.author || null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    authorId: row.author_id,
    authorRole: row.author_role,
    audienceScope: row.audience_scope,
    title: row.title,
    summary: row.summary,
    bodyHtml: row.body_html,
    bodyJson: row.body_json,
    contextType: row.context_type,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    quizId: row.quiz_id,
    targetRoles: row.target_roles,
    status: row.status,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    expiresAt: row.expires_at,
    emailSentAt: row.email_sent_at,
    isPinned: coerceBoolean(row.is_pinned),
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media,
    author: author
      ? {
          ...author,
          fullName:
            author.fullName ||
            [author.firstName, author.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() ||
            author.email ||
            null,
        }
      : null,
    isRead: coerceBoolean(row.is_read),
    readAt: row.read_at,
  };
}

async function resolveHierarchy(client, { tenantId, courseId, moduleId, lessonId, quizId }) {
  let resolvedTenantId = tenantId || null;
  let resolvedCourseId = courseId || null;
  let resolvedModuleId = moduleId || null;
  let resolvedLessonId = lessonId || null;
  let resolvedQuizId = quizId || null;

  // Resolve module → course
  if (resolvedModuleId && !resolvedCourseId) {
    const moduleResult = await client.query(
      `SELECT course_id FROM modules WHERE id = $1`,
      [resolvedModuleId]
    );
    if (moduleResult.rows.length > 0) {
      resolvedCourseId = moduleResult.rows[0].course_id;
    }
  }

  // Resolve lesson → module/course
  if (resolvedLessonId && !resolvedModuleId) {
    const lessonResult = await client.query(
      `SELECT module_id FROM lessons WHERE id = $1`,
      [resolvedLessonId]
    );
    if (lessonResult.rows.length > 0) {
      resolvedModuleId = lessonResult.rows[0].module_id;
    }
  }

  if (resolvedLessonId && !resolvedCourseId) {
    const lessonCourseResult = await client.query(
      `SELECT m.course_id
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       WHERE l.id = $1`,
      [resolvedLessonId]
    );
    if (lessonCourseResult.rows.length > 0) {
      resolvedCourseId = lessonCourseResult.rows[0].course_id;
    }
  }

  // Resolve quiz → module/course
  if (resolvedQuizId && !resolvedModuleId) {
    const quizResult = await client.query(
      `SELECT module_id FROM quizzes WHERE id = $1`,
      [resolvedQuizId]
    );
    if (quizResult.rows.length > 0) {
      resolvedModuleId = quizResult.rows[0].module_id;
    }
  }

  if (resolvedQuizId && !resolvedCourseId) {
    const quizCourseResult = await client.query(
      `SELECT m.course_id
       FROM quizzes q
       JOIN modules m ON m.id = q.module_id
       WHERE q.id = $1`,
      [resolvedQuizId]
    );
    if (quizCourseResult.rows.length > 0) {
      resolvedCourseId = quizCourseResult.rows[0].course_id;
    }
  }

  // Resolve tenant from course if missing
  if (!resolvedTenantId && resolvedCourseId) {
    const courseTenantResult = await client.query(
      `SELECT tenant_id FROM courses WHERE id = $1`,
      [resolvedCourseId]
    );
    if (courseTenantResult.rows.length > 0) {
      resolvedTenantId = courseTenantResult.rows[0].tenant_id;
    }
  }

  // Resolve tenant from module if still missing
  if (!resolvedTenantId && resolvedModuleId) {
    const moduleTenantResult = await client.query(
      `SELECT c.tenant_id
       FROM modules m
       JOIN courses c ON c.id = m.course_id
       WHERE m.id = $1`,
      [resolvedModuleId]
    );
    if (moduleTenantResult.rows.length > 0) {
      resolvedTenantId = moduleTenantResult.rows[0].tenant_id;
    }
  }

  return {
    tenantId: resolvedTenantId,
    courseId: resolvedCourseId,
    moduleId: resolvedModuleId,
    lessonId: resolvedLessonId,
    quizId: resolvedQuizId,
  };
}

async function fetchAnnouncements({
  viewerId,
  viewerRole,
  tenantId,
  isSuperAdmin,
  courseId,
  moduleId,
  lessonId,
  quizId,
  includeGlobal = true,
  limit = 25,
  status,
  includeExpired = false,
  search,
}) {
  const params = [];
  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const normalizedLimit = Math.min(Math.max(limit || 25, 1), 200);
  const readerParam = addParam(viewerId ?? null);

  const whereClauses = [];
  const scopeConditions = [];
  const hasExplicitContext = courseId || moduleId || lessonId || quizId;
  const superAdminFullAccess = Boolean(isSuperAdmin && !tenantId && !hasExplicitContext);

  if (superAdminFullAccess) {
    scopeConditions.push('TRUE');
  } else {
    if (includeGlobal) {
      scopeConditions.push(`a.audience_scope = 'global'`);
    }

    if (tenantId) {
      scopeConditions.push(`(a.audience_scope = 'tenant' AND a.tenant_id = ${addParam(tenantId)})`);
    } else if (!isSuperAdmin && !includeGlobal) {
      scopeConditions.push('FALSE');
    }

    if (courseId) {
      scopeConditions.push(`a.course_id = ${addParam(courseId)}`);
    }

    if (moduleId) {
      scopeConditions.push(`a.module_id = ${addParam(moduleId)}`);
    }

    if (lessonId) {
      scopeConditions.push(`a.lesson_id = ${addParam(lessonId)}`);
    }

    if (quizId) {
      scopeConditions.push(`a.quiz_id = ${addParam(quizId)}`);
    }
  }

  if (scopeConditions.length === 0) {
    scopeConditions.push('TRUE');
  }

  whereClauses.push(`(${scopeConditions.join(' OR ')})`);

  if (!isSuperAdmin && viewerRole) {
    const viewerParam = addParam(viewerRole);
    whereClauses.push(`(a.target_roles && ARRAY[${viewerParam}]::TEXT[])`);
  }

  let normalizedStatus = status;
  if (!normalizedStatus) {
    normalizedStatus = 'published';
  }

  if (normalizedStatus !== 'all') {
    const statusParam = addParam(normalizedStatus);
    whereClauses.push(`a.status = ${statusParam}`);
  }

  const shouldFilterExpired =
    !includeExpired && (!status || normalizedStatus === 'published');

  if (shouldFilterExpired) {
    whereClauses.push(`(a.expires_at IS NULL OR a.expires_at > NOW())`);
  }

  if (search && search.trim()) {
    const searchParam = addParam(`%${search.trim()}%`);
    whereClauses.push(`(a.title ILIKE ${searchParam} OR a.summary ILIKE ${searchParam})`);
  }

  const limitParam = addParam(normalizedLimit);

  const queryText = `
    SELECT
      a.*,
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
            'id', am.id,
            'mediaType', am.media_type,
            'url', am.url,
            'thumbnailUrl', am.thumbnail_url,
            'title', am.title,
            'description', am.description,
            'altText', am.alt_text,
            'mimeType', am.mime_type,
            'fileSize', am.file_size,
            'metadata', am.metadata,
            'createdAt', am.created_at
          )
        ) FILTER (WHERE am.id IS NOT NULL),
        '[]'::JSON
      ) AS media,
      CASE WHEN MAX(ar.read_at) IS NOT NULL THEN TRUE ELSE FALSE END AS is_read,
      MAX(ar.read_at) AS read_at
    FROM announcements a
    LEFT JOIN users u ON u.id = a.author_id
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN announcement_media am ON am.announcement_id = a.id
    LEFT JOIN announcement_reads ar
      ON ar.announcement_id = a.id
     AND ar.user_id = ${readerParam}
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY a.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    ORDER BY a.is_pinned DESC, a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT ${limitParam}
  `;

  const result = await query(queryText, params);
  return result.rows.map(mapAnnouncementRow);
}

async function fetchAnnouncementById(id, viewerId = null) {
  const result = await query(
    `
      SELECT
        a.*,
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
              'id', am.id,
              'mediaType', am.media_type,
              'url', am.url,
              'thumbnailUrl', am.thumbnail_url,
              'title', am.title,
              'description', am.description,
              'altText', am.alt_text,
              'mimeType', am.mime_type,
              'fileSize', am.file_size,
              'metadata', am.metadata,
              'createdAt', am.created_at
            )
          ) FILTER (WHERE am.id IS NOT NULL),
          '[]'::JSON
        ) AS media,
        CASE WHEN MAX(ar.read_at) IS NOT NULL THEN TRUE ELSE FALSE END AS is_read,
        MAX(ar.read_at) AS read_at
      FROM announcements a
      LEFT JOIN users u ON u.id = a.author_id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN announcement_media am ON am.announcement_id = a.id
      LEFT JOIN announcement_reads ar
        ON ar.announcement_id = a.id
       AND ar.user_id = $2
      WHERE a.id = $1
      GROUP BY a.id, u.id, p.first_name, p.last_name, p.avatar_url, u.email, u.role
    `,
    [id, viewerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAnnouncementRow(result.rows[0]);
}

async function upsertAnnouncementMedia(client, announcementId, mediaItems = []) {
  await client.query(
    `DELETE FROM announcement_media WHERE announcement_id = $1`,
    [announcementId]
  );

  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    return;
  }

  const insertValues = [];
  const valueClauses = [];

  mediaItems.forEach((item, index) => {
    const mediaType = item.mediaType || item.type || 'document';
    const metadata = item.metadata || {};

    insertValues.push(
      announcementId,
      mediaType,
      item.url,
      item.thumbnailUrl || item.thumbnail_url || null,
      item.title || null,
      item.description || null,
      item.altText || item.alt_text || null,
      item.mimeType || item.mime_type || null,
      item.fileSize || item.file_size || null,
      metadata
    );

    const baseIndex = index * 10;
    valueClauses.push(
      `(
        uuid_generate_v4(),
        $${baseIndex + 1},
        $${baseIndex + 2},
        $${baseIndex + 3},
        $${baseIndex + 4},
        $${baseIndex + 5},
        $${baseIndex + 6},
        $${baseIndex + 7},
        $${baseIndex + 8},
        $${baseIndex + 9},
        $${baseIndex + 10}
      )`
    );
  });

  await client.query(
    `
      INSERT INTO announcement_media (
        id,
        announcement_id,
        media_type,
        url,
        thumbnail_url,
        title,
        description,
        alt_text,
        mime_type,
        file_size,
        metadata
      )
      VALUES ${valueClauses.join(', ')}
    `,
    insertValues
  );
}

async function getAnnouncementRecipients(client, announcement) {
  const recipients = new Map();
  const roles = normalizeTargetRoles(announcement.targetRoles);

  const addRecipients = (rows, role) => {
    for (const row of rows) {
      const key = row.id;
      if (!key || recipients.has(key)) continue;
      recipients.set(key, {
        id: row.id,
        email: row.email,
        firstName: row.first_name || row.firstName,
        lastName: row.last_name || row.lastName,
        role,
      });
    }
  };

  const baseParams = [];
  let clause = 'u.is_active = true';

  if (announcement.tenantId) {
    clause += ` AND u.tenant_id = $${baseParams.length + 1}`;
    baseParams.push(announcement.tenantId);
  }

  if (roles.includes('student')) {
    if (announcement.courseId) {
      const result = await client.query(
        `
          SELECT DISTINCT u.id, u.email, p.first_name, p.last_name
          FROM enrollments e
          JOIN users u ON u.id = e.student_id
          LEFT JOIN user_profiles p ON p.user_id = u.id
          WHERE e.course_id = $1
            AND e.status IN ('active', 'completed')
            AND u.is_active = true
        `,
        [announcement.courseId]
      );
      addRecipients(result.rows, 'student');
    } else {
      const result = await client.query(
        `
          SELECT u.id, u.email, p.first_name, p.last_name
          FROM users u
          LEFT JOIN user_profiles p ON p.user_id = u.id
          WHERE u.role = 'student'
            AND ${clause}
        `,
        baseParams
      );
      addRecipients(result.rows, 'student');
    }
  }

  if (roles.includes('instructor')) {
    if (announcement.courseId) {
      const result = await client.query(
        `
          SELECT DISTINCT u.id, u.email, p.first_name, p.last_name
          FROM courses c
          JOIN users u ON u.id = c.created_by
          LEFT JOIN user_profiles p ON p.user_id = u.id
          WHERE c.id = $1
            AND u.is_active = true
        `,
        [announcement.courseId]
      );
      addRecipients(result.rows, 'instructor');
    } else {
      const result = await client.query(
        `
          SELECT u.id, u.email, p.first_name, p.last_name
          FROM users u
          LEFT JOIN user_profiles p ON p.user_id = u.id
          WHERE u.role = 'instructor'
            AND ${clause}
        `,
        baseParams
      );
      addRecipients(result.rows, 'instructor');
    }
  }

  if (roles.includes('school_admin')) {
    const result = await client.query(
      `
        SELECT u.id, u.email, p.first_name, p.last_name
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.role = 'school_admin'
          AND ${clause}
      `,
      baseParams
    );
    addRecipients(result.rows, 'school_admin');
  }

  if (roles.includes('super_admin')) {
    const result = await client.query(
      `
        SELECT u.id, u.email, p.first_name, p.last_name
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.role = 'super_admin'
          AND u.is_active = true
      `
    );
    addRecipients(result.rows, 'super_admin');
  }

  return Array.from(recipients.values());
}

async function dispatchAnnouncementEmails(client, announcement, options = {}) {
  const shouldSendEmail =
    options.force === true ||
    announcement.authorRole === 'super_admin' ||
    options.sendEmail === true;

  if (!shouldSendEmail) {
    return { attempted: 0, sent: 0, skipped: true };
  }

  if (!isEmailConfigured()) {
    console.warn('[Announcements] Email not configured; skipping dispatch.');
    return { attempted: 0, sent: 0, skipped: true };
  }

  const recipients = await getAnnouncementRecipients(client, announcement);
  if (recipients.length === 0) {
    console.log('[Announcements] No recipients to email.');
    return { attempted: 0, sent: 0, skipped: true };
  }

  const branding = await whiteLabelService.getBrandingConfig(
    announcement.tenantId,
    'student'
  );

  const appName = branding?.companyName || process.env.APP_NAME || 'SunLMS';
  const frontendUrl = announcement.metadata?.ctaUrl ||
    announcement.metadata?.cta_url ||
    APP_CONFIG.FRONTEND_URL;

  let sent = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;

    try {
      await sendTemplatedEmail('announcement_broadcast', {
        to: recipient.email,
        variables: {
          firstName: recipient.firstName,
          announcementTitle: announcement.title,
          announcementSummary: announcement.summary,
          announcementBodyHtml: announcement.bodyHtml,
          ctaUrl: frontendUrl,
          appName,
          primaryColor: branding?.primaryColor,
        },
      });
      sent += 1;
    } catch (error) {
      console.error(`[Announcements] Failed to send email to ${recipient.email}`, error);
    }
  }

  if (sent > 0) {
    await client.query(
      `UPDATE announcements SET email_sent_at = NOW() WHERE id = $1`,
      [announcement.id]
    );
  }

  return { attempted: recipients.length, sent, skipped: false };
}

export async function listAnnouncements(options) {
  return fetchAnnouncements(options);
}

export async function getAnnouncement(id, viewerId) {
  return fetchAnnouncementById(id, viewerId);
}

export async function createAnnouncement(payload, { authorId, authorRole, tenantId, sendEmail }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const targetRoles = normalizeTargetRoles(payload.target_roles || payload.targetRoles);

    const hierarchy = await resolveHierarchy(client, {
      tenantId: payload.tenant_id || tenantId,
      courseId: payload.course_id || payload.courseId,
      moduleId: payload.module_id || payload.moduleId,
      lessonId: payload.lesson_id || payload.lessonId,
      quizId: payload.quiz_id || payload.quizId,
    });

    const audienceScope =
      payload.audience_scope ||
      payload.audienceScope ||
      (hierarchy.courseId ? 'course' : hierarchy.tenantId ? 'tenant' : 'global');

    const contextType =
      payload.context_type ||
      payload.contextType ||
      (hierarchy.quizId
        ? 'quiz'
        : hierarchy.lessonId
        ? 'lesson'
        : hierarchy.moduleId
        ? 'module'
        : hierarchy.courseId
        ? 'course'
        : 'general');

    const result = await client.query(
      `
        INSERT INTO announcements (
          tenant_id,
          author_id,
          author_role,
          audience_scope,
          title,
          summary,
          body_html,
          body_json,
          context_type,
          course_id,
          module_id,
          lesson_id,
          quiz_id,
          target_roles,
          status,
          published_at,
          scheduled_for,
          expires_at,
          is_pinned,
          metadata
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15,
          $16, $17, $18,
          $19, $20
        )
        RETURNING *
      `,
      [
        hierarchy.tenantId,
        authorId,
        authorRole,
        audienceScope,
        payload.title,
        payload.summary || null,
        payload.body_html || payload.bodyHtml,
        payload.body_json || payload.bodyJson || null,
        contextType,
        hierarchy.courseId,
        hierarchy.moduleId,
        hierarchy.lessonId,
        hierarchy.quizId,
        targetRoles,
        payload.status || 'draft',
        payload.status === 'published' || payload.publish_now === true ? new Date() : null,
        payload.scheduled_for || payload.scheduledFor || null,
        payload.expires_at || payload.expiresAt || null,
        coerceBoolean(payload.is_pinned),
        payload.metadata || {},
      ]
    );

    const announcementRow = result.rows[0];
    await upsertAnnouncementMedia(client, announcementRow.id, payload.media);

    // Auto publish when requested
    if (
      (payload.status === 'published' || payload.publish_now === true) &&
      !announcementRow.published_at
    ) {
      const publishResult = await client.query(
        `
          UPDATE announcements
          SET status = 'published', published_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [announcementRow.id]
      );
      Object.assign(announcementRow, publishResult.rows[0]);
    }

    await client.query('COMMIT');

    const hydrated = await fetchAnnouncementById(announcementRow.id);
    await dispatchAnnouncementEmails(client, {
      ...hydrated,
      tenantId: hierarchy.tenantId,
      courseId: hierarchy.courseId,
      targetRoles,
    }, { sendEmail });

    return hydrated;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Announcements] Create failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAnnouncement(id, updates, { actorId, actorRole, sendEmail }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT * FROM announcements WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      throw new Error('Announcement not found');
    }

    const announcement = existing.rows[0];
    const isOwner = announcement.author_id === actorId;

    if (announcement.author_role === 'super_admin' && actorRole !== 'super_admin') {
      throw new Error('System announcements can only be modified by super admins.');
    }

    const canEdit =
      actorRole === 'super_admin' ||
      (['school_admin', 'instructor'].includes(actorRole) && isOwner);

    if (!canEdit) {
      throw new Error('You can only modify announcements you created.');
    }

    const targetRoles = updates.target_roles || updates.targetRoles
      ? normalizeTargetRoles(updates.target_roles || updates.targetRoles)
      : announcement.target_roles;

    const hierarchy = await resolveHierarchy(client, {
      tenantId: updates.tenant_id || updates.tenantId || announcement.tenant_id,
      courseId: updates.course_id || updates.courseId || announcement.course_id,
      moduleId: updates.module_id || updates.moduleId || announcement.module_id,
      lessonId: updates.lesson_id || updates.lessonId || announcement.lesson_id,
      quizId: updates.quiz_id || updates.quizId || announcement.quiz_id,
    });

    const contextType =
      updates.context_type ||
      updates.contextType ||
      (hierarchy.quizId
        ? 'quiz'
        : hierarchy.lessonId
        ? 'lesson'
        : hierarchy.moduleId
        ? 'module'
        : hierarchy.courseId
        ? 'course'
        : announcement.context_type);

    const status = updates.status || announcement.status;
    const publishNow = updates.publish_now === true;

    const normalizeTimestamp = (value) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    const publishTimestamp =
      status === 'published'
        ? normalizeTimestamp(
            publishNow
              ? new Date()
              : updates.published_at || announcement.published_at || new Date()
          )
        : null;

    const scheduledForIso =
      status === 'scheduled'
        ? normalizeTimestamp(
            updates.scheduled_for || updates.scheduledFor || announcement.scheduled_for
          )
        : null;

    if (status === 'scheduled' && !scheduledForIso) {
      throw new Error('Scheduled announcements require a scheduled publish date/time.');
    }

    const expiresAtIso = normalizeTimestamp(
      updates.expires_at || updates.expiresAt || announcement.expires_at
    );

    const metadataValue =
      updates.metadata !== undefined
        ? updates.metadata
        : announcement.metadata || {};

    const metadataJson =
      metadataValue && typeof metadataValue === 'object'
        ? JSON.stringify(metadataValue)
        : typeof metadataValue === 'string'
        ? metadataValue
        : '{}';

    const result = await client.query(
      `
        UPDATE announcements
        SET
          tenant_id = $1,
          audience_scope = $2,
          title = $3,
          summary = $4,
          body_html = $5,
          body_json = $6,
          context_type = $7,
          course_id = $8,
          module_id = $9,
          lesson_id = $10,
          quiz_id = $11,
          target_roles = $12,
          status = $13,
          published_at = CASE
            WHEN $13 = 'published' AND published_at IS NULL THEN NOW()
            WHEN $14::timestamptz IS NOT NULL THEN $14::timestamptz
            WHEN $13 != 'published' THEN NULL
            ELSE published_at
          END,
          scheduled_for = $15::timestamptz,
          expires_at = $16::timestamptz,
          is_pinned = $17,
          metadata = COALESCE($18::jsonb, '{}'::jsonb),
          updated_at = NOW()
        WHERE id = $19
        RETURNING *
      `,
      [
        hierarchy.tenantId,
        updates.audience_scope || updates.audienceScope || announcement.audience_scope,
        updates.title || announcement.title,
        updates.summary !== undefined ? updates.summary : announcement.summary,
        updates.body_html || updates.bodyHtml || announcement.body_html,
        updates.body_json || updates.bodyJson || announcement.body_json,
        contextType,
        hierarchy.courseId,
        hierarchy.moduleId,
        hierarchy.lessonId,
        hierarchy.quizId,
        targetRoles,
        status,
        publishTimestamp,
        scheduledForIso,
        expiresAtIso,
        updates.is_pinned !== undefined ? coerceBoolean(updates.is_pinned) : announcement.is_pinned,
        metadataJson,
        id,
      ]
    );

    await upsertAnnouncementMedia(client, id, updates.media);

    await client.query('COMMIT');

    const hydrated = await fetchAnnouncementById(id);

    if (status === 'published' && !announcement.email_sent_at) {
      await dispatchAnnouncementEmails(client, {
        ...hydrated,
        tenantId: hierarchy.tenantId,
        courseId: hierarchy.courseId,
        targetRoles,
      }, { sendEmail });
    }

    return hydrated;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Announcements] Update failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function archiveAnnouncement(id, actorRole, actorId) {
  if (!['super_admin', 'school_admin'].includes(actorRole)) {
    throw new Error('Only administrators can archive announcements');
  }

  const existing = await query(
    `SELECT * FROM announcements WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new Error('Announcement not found');
  }

  const announcement = existing.rows[0];
  const isOwner = announcement.author_id === actorId;

  if (announcement.author_role === 'super_admin' && actorRole !== 'super_admin') {
    throw new Error('System announcements can only be archived by super admins.');
  }

  if (actorRole !== 'super_admin' && !isOwner) {
    throw new Error('You can only archive announcements you created.');
  }

  const result = await query(
    `
      UPDATE announcements
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  return mapAnnouncementRow(result.rows[0]);
}

export async function deleteAnnouncement(id, actorRole) {
  const result = await query(
    `
      DELETE FROM announcements
      WHERE id = $1
        AND $2 = 'super_admin'
      RETURNING *
    `,
    [id, actorRole]
  );

  if (result.rows.length === 0) {
    throw new Error('Only super admins can permanently delete announcements');
  }

  return true;
}

export async function markAnnouncementRead(id, userId) {
  if (!userId) {
    throw new Error('User required to mark announcement as read');
  }

  await query(
    `
      INSERT INTO announcement_reads (announcement_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (announcement_id, user_id)
      DO UPDATE SET read_at = excluded.read_at
    `,
    [id, userId]
  );

  return fetchAnnouncementById(id, userId);
}

export default {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
};


