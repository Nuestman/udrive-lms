// SCORM Service - business logic for SCORM packages, SCOs, and runtime data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from '../lib/db.js';
import { uploadFile, sanitizeDirectoryName } from '../utils/storage.js';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for extracted SCORM content
const SCORM_CONTENT_ROOT = path.join(__dirname, '..', '..', 'storage', 'scorm');

function ensureScormContentDir(packageId) {
  const dir = path.join(SCORM_CONTENT_ROOT, packageId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Sanitize file path to prevent directory traversal attacks
 */
function sanitizePath(filePath) {
  if (!filePath) return '';
  // Remove leading/trailing slashes and normalize
  let sanitized = filePath.replace(/^\/+|\/+$/g, '');
  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');
  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');
  return sanitized;
}

/**
 * Parse imsmanifest.xml from a SCORM 1.2 package
 * Returns { title, scos: [{ identifier, title, launchPath, isEntryPoint }] }
 */
async function parseScormManifestFromZip(admZip, fallbackTitle = 'SCORM Package') {
  const manifestEntry = admZip.getEntry('imsmanifest.xml');
  if (!manifestEntry) {
    throw new Error('SCORM manifest (imsmanifest.xml) not found in package');
  }

  const manifestXml = manifestEntry.getData().toString('utf8');
  const manifest = await parseStringPromise(manifestXml, { explicitArray: true });

  const organizations = manifest?.manifest?.organizations?.[0];
  const resources = manifest?.manifest?.resources?.[0];

  const title =
    organizations?.organization?.[0]?.title?.[0] ||
    manifest?.manifest?.metadata?.[0]?.schemaversion?.[0] ||
    fallbackTitle;

  const resourceMap = new Map();
  if (resources?.resource) {
    for (const res of resources.resource) {
      const attrs = res.$ || {};
      if (!attrs.href) continue;

      const identifier = attrs.identifier;
      const href = attrs.href;
      const scormType = attrs['adlcp:scormType'] || attrs['adlcp:scormtype'] || '';
      const isSco = !scormType || scormType.toLowerCase() === 'sco';

      resourceMap.set(identifier, {
        identifier,
        launchPath: href,
        isSco,
      });
    }
  }

  const scos = [];

  if (organizations?.organization?.[0]?.item) {
    const items = organizations.organization[0].item;
    for (const item of items) {
      const attrs = item.$ || {};
      const identifier = attrs.identifier || attrs.id || '';
      const resId = attrs['identifierref'];
      const itemTitle = item.title?.[0] || identifier;

      const res = resId ? resourceMap.get(resId) : null;
      if (res && res.launchPath) {
        // Sanitize launch path
        const sanitizedLaunchPath = sanitizePath(res.launchPath);
        scos.push({
          identifier: res.identifier || identifier,
          title: itemTitle,
          launchPath: sanitizedLaunchPath,
          isEntryPoint: scos.length === 0,
        });
      }
    }
  }

  // Fallback: if no org/item structure, treat all SCO resources as SCOs
  if (scos.length === 0 && resourceMap.size > 0) {
    for (const res of resourceMap.values()) {
      if (!res.launchPath) continue;
      // Sanitize launch path
      const sanitizedLaunchPath = sanitizePath(res.launchPath);
      scos.push({
        identifier: res.identifier,
        title: res.identifier,
        launchPath: sanitizedLaunchPath,
        isEntryPoint: scos.length === 0,
      });
    }
  }

  if (scos.length === 0) {
    throw new Error('No launchable SCOs found in SCORM manifest');
  }

  return { title, scos };
}

/**
 * Create SCORM package and SCO records from an uploaded zip.
 * - Uploads the original zip to Vercel Blob
 * - Parses imsmanifest.xml to extract SCOs
 * - Extracts content to storage/scorm/{packageId}
 */
export async function createScormPackageFromUpload({
  tenantId,
  courseId,
  ownerId,
  fileBuffer,
  originalFilename,
  mimetype,
}) {
  if (!fileBuffer) {
    throw new Error('No SCORM package data provided');
  }

  // Upload original zip to Vercel Blob
  const uploadResult = await uploadFile(
    fileBuffer,
    originalFilename || 'scorm-package.zip',
    'scorm-package',
    {
      tenantId,
      courseId,
    },
    {
      contentType: mimetype || 'application/zip',
    }
  );

  // Lazy-load adm-zip to avoid unnecessary import if unused
  const { default: AdmZip } = await import('adm-zip');
  const zip = new AdmZip(fileBuffer);

  // Parse manifest for title and SCOs
  const { title, scos } = await parseScormManifestFromZip(zip, originalFilename);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const pkgResult = await client.query(
      `INSERT INTO public.scorm_packages (
        tenant_id,
        course_id,
        title,
        version,
        zip_blob_url,
        content_base_path,
        owner_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        tenantId || null,
        courseId || null,
        title,
        'SCORM_1_2',
        uploadResult.url,
        '', // placeholder, will update after we know package id & filesystem path
        ownerId || null,
      ]
    );

    const pkg = pkgResult.rows[0];
    const packageId = pkg.id;

    // Extract zip contents and upload to Vercel Blob
    console.log(`[SCORM] Extracting and uploading package ${packageId} to Vercel Blob...`);
    
    // Get tenant name for blob path
    const tenantQuery = await query(
      `SELECT name FROM public.tenants WHERE id = $1`,
      [tenantId]
    );
    const tenantName = tenantQuery.rows[0]?.name || tenantId;

    // Sanitize package title for use in path
    const packageName = sanitizeDirectoryName(title || 'scorm-package', 80);
    // Add package ID to ensure uniqueness if title is not unique
    const packagePathName = `${packageName}-${packageId.substring(0, 8)}`;

    // Extract to temporary location first
    const tempDir = ensureScormContentDir(packageId);
    try {
      zip.extractAllTo(tempDir, true);
      console.log(`[SCORM] Extracted to temp directory: ${tempDir}`);
    } catch (extractError) {
      console.error(`[SCORM] Extraction failed:`, extractError);
      throw new Error(`Failed to extract SCORM package: ${extractError.message}`);
    }

    // Upload all extracted files to Vercel Blob
    const { put } = await import('@vercel/blob');
    const uploadedFiles = [];
    const baseBlobPath = `tenants/${sanitizeDirectoryName(tenantName)}/scorm/content/${packagePathName}`;
    let baseBlobUrl = null; // Will store the base URL from first file upload
    
    // Recursively read all files from temp directory and upload to blob
    const uploadExtractedFiles = async (dir, relativePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const blobRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          await uploadExtractedFiles(fullPath, blobRelativePath);
        } else {
          try {
            const fileBuffer = fs.readFileSync(fullPath);
            const blobPath = `${baseBlobPath}/${blobRelativePath}`;
            
            // Determine content type
            const ext = path.extname(entry.name).toLowerCase();
            const contentTypeMap = {
              '.html': 'text/html',
              '.htm': 'text/html',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.xml': 'application/xml',
              '.json': 'application/json',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
            };
            const contentType = contentTypeMap[ext] || 'application/octet-stream';
            
            // Upload to Vercel Blob
            const blob = await put(blobPath, fileBuffer, {
              access: 'public',
              contentType,
              addRandomSuffix: false, // Keep original paths for SCORM
            });
            
            // Extract base URL from first file (all files will have same base)
            if (!baseBlobUrl) {
              // Extract base URL from blob URL
              // Format: https://xxx.public.blob.vercel-storage.com/path/to/file
              // We want: https://xxx.public.blob.vercel-storage.com/tenants/xxx/scorm/content/packageId
              const urlObj = new URL(blob.url);
              // Remove the filename from pathname to get base path
              const pathParts = urlObj.pathname.split('/').filter(p => p);
              // Remove the last part (filename) to get directory
              pathParts.pop();
              const basePath = pathParts.join('/');
              baseBlobUrl = `${urlObj.origin}/${basePath}`;
              console.log(`[SCORM] Extracted base blob URL from first file:`, {
                originalUrl: blob.url,
                pathname: urlObj.pathname,
                pathParts,
                basePath,
                baseBlobUrl
              });
            }
            
            uploadedFiles.push({
              originalPath: blobRelativePath,
              blobUrl: blob.url,
            });
            
            console.log(`[SCORM] Uploaded: ${blobRelativePath} -> ${blob.url}`);
          } catch (uploadError) {
            console.error(`[SCORM] Failed to upload ${blobRelativePath}:`, uploadError);
            throw new Error(`Failed to upload SCORM file ${blobRelativePath}: ${uploadError.message}`);
          }
        }
      }
    };

    await uploadExtractedFiles(tempDir);
    console.log(`[SCORM] Uploaded ${uploadedFiles.length} files to Vercel Blob`);

    if (!baseBlobUrl) {
      throw new Error('Failed to determine base blob URL after upload');
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`[SCORM] Cleaned up temp directory: ${tempDir}`);
    } catch (cleanupError) {
      console.warn(`[SCORM] Could not clean up temp directory:`, cleanupError);
    }

    // Store base blob URL in content_base_path
    // This is the full URL to the package directory in Vercel Blob
    // Format: https://xxx.public.blob.vercel-storage.com/tenants/xxx/scorm/content/packageId
    const contentBasePath = baseBlobUrl;

    console.log(`[SCORM] Saving content_base_path to database:`, {
      packageId,
      contentBasePath,
      uploadedFilesCount: uploadedFiles.length
    });

    // Update package with content_base_path
    const updateResult = await client.query(
      `UPDATE public.scorm_packages
       SET content_base_path = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, content_base_path`,
      [packageId, contentBasePath]
    );
    
    console.log(`[SCORM] Updated package in database:`, {
      packageId: updateResult.rows[0]?.id,
      savedContentBasePath: updateResult.rows[0]?.content_base_path
    });

    const scoValues = [];
    for (const sco of scos) {
      scoValues.push(
        client.query(
          `INSERT INTO public.scorm_scos (
            package_id,
            identifier,
            title,
            launch_path,
            is_entry_point
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *`,
          [packageId, sco.identifier, sco.title, sco.launchPath, !!sco.isEntryPoint]
        )
      );
    }

    const scoResults = await Promise.all(scoValues);
    const scoRows = scoResults.flatMap((r) => r.rows);

    await client.query('COMMIT');

    return {
      package: {
        ...pkg,
        content_base_path: contentBasePath,
      },
      scos: scoRows,
      upload: uploadResult,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [SCORM] Failed to create SCORM package from upload:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getScosByPackageId(packageId, tenantId, isSuperAdmin = false) {
  // Enforce tenant scoping via package
  const pkgResult = await query(
    `SELECT * FROM public.scorm_packages WHERE id = $1`,
    [packageId]
  );

  if (pkgResult.rows.length === 0) {
    throw new Error('SCORM package not found');
  }

  const pkg = pkgResult.rows[0];

  if (!isSuperAdmin && tenantId && pkg.tenant_id && pkg.tenant_id !== tenantId) {
    throw new Error('Access denied to SCORM package');
  }

  const scoResult = await query(
    `SELECT * FROM public.scorm_scos WHERE package_id = $1 ORDER BY is_entry_point DESC, title ASC`,
    [packageId]
  );

  return {
    package: pkg,
    scos: scoResult.rows,
  };
}

/**
 * Upsert SCORM runtime data for a user × SCO × attempt.
 * Expects a payload with:
 * - scoId
 * - attemptNo (optional, default 1)
 * - cmi: { lesson_status, score_raw, lesson_location, suspend_data, total_time_seconds, session_time_seconds, ... }
 */
export async function commitScormRuntime({
  userId,
  tenantId,
  scoId,
  attemptNo = 1,
  cmi = {},
}) {
  if (!userId) throw new Error('User ID is required for SCORM commit');
  if (!scoId) throw new Error('SCO ID is required for SCORM commit');

  const lessonStatus = cmi.lesson_status || cmi['cmi.core.lesson_status'] || 'incomplete';
  const scoreRaw =
    cmi.score_raw ||
    cmi['cmi.core.score.raw'] ||
    cmi['cmi.score.raw'] ||
    null;
  const lessonLocation =
    cmi.lesson_location ||
    cmi['cmi.core.lesson_location'] ||
    null;
  const suspendData = cmi.suspend_data || cmi['cmi.suspend_data'] || null;

  const totalTimeSeconds =
    typeof cmi.total_time_seconds === 'number'
      ? cmi.total_time_seconds
      : typeof cmi['cmi.core.total_time'] === 'number'
      ? cmi['cmi.core.total_time']
      : null;

  const sessionTimeSeconds =
    typeof cmi.session_time_seconds === 'number'
      ? cmi.session_time_seconds
      : typeof cmi['cmi.core.session_time'] === 'number'
      ? cmi['cmi.core.session_time']
      : null;

  const result = await query(
    `INSERT INTO public.scorm_attempts (
       user_id,
       sco_id,
       attempt_no,
       lesson_status,
       score_raw,
       lesson_location,
       suspend_data,
       total_time_seconds,
       session_time_seconds,
       started_at,
       finished_at,
       last_commit_at,
       cmi_data
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 0), COALESCE($9, 0), NOW(), 
             CASE WHEN $4 IN ('completed', 'passed', 'failed') THEN NOW() ELSE NULL END,
             NOW(),
             $10::jsonb)
     ON CONFLICT (user_id, sco_id, attempt_no)
     DO UPDATE SET
       lesson_status = EXCLUDED.lesson_status,
       score_raw = EXCLUDED.score_raw,
       lesson_location = EXCLUDED.lesson_location,
       suspend_data = EXCLUDED.suspend_data,
       total_time_seconds = GREATEST(public.scorm_attempts.total_time_seconds, EXCLUDED.total_time_seconds),
       session_time_seconds = EXCLUDED.session_time_seconds,
       finished_at = CASE
         WHEN EXCLUDED.lesson_status IN ('completed', 'passed', 'failed') THEN NOW()
         ELSE public.scorm_attempts.finished_at
       END,
       last_commit_at = NOW(),
       cmi_data = EXCLUDED.cmi_data,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      scoId,
      attemptNo,
      lessonStatus,
      scoreRaw,
      lessonLocation,
      suspendData,
      totalTimeSeconds,
      sessionTimeSeconds,
      JSON.stringify(cmi || {}),
    ]
  );

  const attempt = result.rows[0];

  // When SCORM status indicates completion, mark linked lessons as completed in lesson_progress
  if (lessonStatus === 'completed' || lessonStatus === 'passed') {
    try {
      await query(
        `INSERT INTO public.lesson_progress (lesson_id, student_id, status, started_at, completed_at, time_spent_seconds)
         SELECT l.id AS lesson_id,
                $1 AS student_id,
                'completed'::text AS status,
                COALESCE(lp.started_at, NOW()) AS started_at,
                NOW() AS completed_at,
                COALESCE(lp.time_spent_seconds, 0) + COALESCE($2, 0) AS time_spent_seconds
         FROM public.lessons l
         JOIN public.scorm_scos s ON l.scorm_sco_id = s.id
         JOIN public.modules m ON l.module_id = m.id
         JOIN public.courses c ON m.course_id = c.id
         LEFT JOIN public.lesson_progress lp
           ON lp.lesson_id = l.id
          AND lp.student_id = $1
         WHERE s.id = $3
           ${tenantId ? 'AND c.tenant_id = $4' : ''}
         ON CONFLICT (student_id, lesson_id)
         DO UPDATE SET
           status = 'completed',
           completed_at = EXCLUDED.completed_at,
           time_spent_seconds = GREATEST(public.lesson_progress.time_spent_seconds, EXCLUDED.time_spent_seconds),
           updated_at = NOW()`,
        tenantId
          ? [userId, totalTimeSeconds || 0, scoId, tenantId]
          : [userId, totalTimeSeconds || 0, scoId]
      );
    } catch (e) {
      console.error('[SCORM] Failed to sync SCORM completion to lesson_progress:', e);
    }
  }

  return attempt;
}

export async function listScormPackagesForTenant(tenantId, isSuperAdmin = false) {
  let queryText = `SELECT * FROM public.scorm_packages`;
  const params = [];

  if (!isSuperAdmin && tenantId) {
    queryText += ' WHERE tenant_id = $1';
    params.push(tenantId);
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  console.log(`[SCORM] Found ${result.rows.length} packages for tenant ${tenantId}`);
  return result.rows;
}

/**
 * Delete a SCORM package and all associated data
 */
export async function deleteScormPackage(packageId, tenantId, isSuperAdmin = false) {
  if (!packageId) throw new Error('Package ID is required');

  // Verify package exists and belongs to tenant
  let pkgQuery;
  if (isSuperAdmin) {
    pkgQuery = await query(
      `SELECT * FROM public.scorm_packages WHERE id = $1`,
      [packageId]
    );
  } else {
    pkgQuery = await query(
      `SELECT * FROM public.scorm_packages WHERE id = $1 AND tenant_id = $2`,
      [packageId, tenantId]
    );
  }

  if (pkgQuery.rows.length === 0) {
    throw new Error('SCORM package not found');
  }

  const pkg = pkgQuery.rows[0];

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Delete SCORM attempts
    await client.query(
      `DELETE FROM public.scorm_attempts 
       WHERE sco_id IN (SELECT id FROM public.scorm_scos WHERE package_id = $1)`,
      [packageId]
    );

    // Delete SCOs
    await client.query(
      `DELETE FROM public.scorm_scos WHERE package_id = $1`,
      [packageId]
    );

    // Delete package
    await client.query(
      `DELETE FROM public.scorm_packages WHERE id = $1`,
      [packageId]
    );

    // Delete extracted files from filesystem
    try {
      const contentDir = path.join(SCORM_CONTENT_ROOT, packageId);
      if (fs.existsSync(contentDir)) {
        fs.rmSync(contentDir, { recursive: true, force: true });
        console.log(`[SCORM] Deleted extracted files from ${contentDir}`);
      }
    } catch (fsError) {
      console.warn(`[SCORM] Could not delete extracted files:`, fsError);
      // Don't fail the transaction if file deletion fails
    }

    // Delete zip file from Vercel Blob
    if (pkg.zip_blob_url) {
      try {
        const { deleteFile } = await import('../utils/storage.js');
        await deleteFile(pkg.zip_blob_url);
        console.log(`[SCORM] Deleted zip file from blob: ${pkg.zip_blob_url}`);
      } catch (blobError) {
        console.warn(`[SCORM] Could not delete zip from blob:`, blobError);
        // Don't fail the transaction if blob deletion fails
      }
    }

    await client.query('COMMIT');

    return { success: true, packageId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SCORM] Failed to delete package:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get SCORM package info for a course
 */
export async function getScormPackageByCourseId(courseId, tenantId, isSuperAdmin = false) {
  let queryText = `
    SELECT p.*, 
           (SELECT COUNT(*) FROM public.scorm_scos WHERE package_id = p.id) as sco_count
    FROM public.scorm_packages p
    WHERE p.course_id = $1
  `;
  const params = [courseId];

  if (!isSuperAdmin && tenantId) {
    queryText += ' AND p.tenant_id = $2';
    params.push(tenantId);
  }

  const result = await query(queryText, params);
  return result.rows[0] || null;
}

export async function getUserScormAttemptsForLesson(userId, lessonId, tenantId, isSuperAdmin = false) {
  const result = await query(
    `SELECT a.*
     FROM public.scorm_attempts a
     JOIN public.scorm_scos s ON s.id = a.sco_id
     JOIN public.lessons l ON l.scorm_sco_id = s.id
     JOIN public.modules m ON l.module_id = m.id
     JOIN public.courses c ON m.course_id = c.id
     WHERE a.user_id = $1
       AND l.id = $2
       ${!isSuperAdmin ? 'AND c.tenant_id = $3' : ''}
     ORDER BY a.last_commit_at DESC NULLS LAST, a.started_at DESC`,
    !isSuperAdmin ? [userId, lessonId, tenantId] : [userId, lessonId]
  );

  return result.rows;
}

export async function getScormSummaryForLesson(lessonId, tenantId, isSuperAdmin = false) {
  const result = await query(
    `SELECT
       COUNT(*) AS attempt_count,
       COUNT(*) FILTER (WHERE a.lesson_status IN ('completed','passed')) AS completed_attempts,
       AVG(a.score_raw) AS avg_score,
       MIN(a.score_raw) AS min_score,
       MAX(a.score_raw) AS max_score
     FROM public.scorm_attempts a
     JOIN public.scorm_scos s ON s.id = a.sco_id
     JOIN public.lessons l ON l.scorm_sco_id = s.id
     JOIN public.modules m ON l.module_id = m.id
     JOIN public.courses c ON m.course_id = c.id
     WHERE l.id = $1
       ${!isSuperAdmin ? 'AND c.tenant_id = $2' : ''}`,
    !isSuperAdmin ? [lessonId, tenantId] : [lessonId]
  );

  return result.rows[0] || {
    attempt_count: 0,
    completed_attempts: 0,
    avg_score: null,
    min_score: null,
    max_score: null,
  };
}

/**
 * Create a SunLMS course from a SCORM package.
 * Creates: course (is_scorm=true), module, lesson (scorm type) linked to entry SCO.
 */
export async function createCourseFromScormPackage({
  packageId,
  tenantId,
  userId,
  courseData = {},
}) {
  if (!packageId) throw new Error('Package ID is required');
  if (!tenantId) throw new Error('Tenant ID is required');
  if (!userId) throw new Error('User ID is required');

  // Get package and entry SCO
  const pkgResult = await query(
    `SELECT * FROM public.scorm_packages WHERE id = $1 AND tenant_id = $2`,
    [packageId, tenantId]
  );

  if (pkgResult.rows.length === 0) {
    throw new Error('SCORM package not found');
  }

  const pkg = pkgResult.rows[0];

  // Get entry SCO (or first SCO if no entry point marked)
  const scoResult = await query(
    `SELECT * FROM public.scorm_scos 
     WHERE package_id = $1 
     ORDER BY is_entry_point DESC, created_at ASC 
     LIMIT 1`,
    [packageId]
  );

  if (scoResult.rows.length === 0) {
    throw new Error('No SCOs found in SCORM package');
  }

  const entrySco = scoResult.rows[0];

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Generate slug from package title
    const baseSlug = (pkg.title || 'scorm-course')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await client.query(
        'SELECT 1 FROM public.courses WHERE tenant_id = $1 AND slug = $2',
        [tenantId, slug]
      );
      if (existing.rows.length === 0) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create course with is_scorm=true
    const courseResult = await client.query(
      `INSERT INTO public.courses (
        tenant_id, slug, title, description, status, 
        duration_weeks, price, created_by, is_scorm
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenantId,
        slug,
        courseData.title || pkg.title || 'SCORM Course',
        courseData.description || null,
        courseData.status || 'draft',
        courseData.duration_weeks || null,
        courseData.price || 0,
        userId,
        true, // is_scorm flag
      ]
    );

    const course = courseResult.rows[0];

    // Link package to course
    await client.query(
      `UPDATE public.scorm_packages SET course_id = $1 WHERE id = $2`,
      [course.id, packageId]
    );

    // NOTE: For SCORM courses, we don't create modules/lessons
    // The SCORM package is self-contained and handles its own navigation
    // Students access it directly via the SCORM player at /student/courses/:courseId/scorm
    // All SCOs are accessible through the SCORM package's own navigation
    const module = null;
    const lesson = null;

    await client.query('COMMIT');

    return {
      course,
      package: pkg,
      sco: entrySco,
      // Note: module and lesson are null for SCORM courses
      // SCORM packages are self-contained and don't use our module/lesson structure
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [SCORM] Failed to create course from package:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createScormPackageFromUpload,
  getScosByPackageId,
  commitScormRuntime,
  createCourseFromScormPackage,
  getScormPackageByCourseId,
  deleteScormPackage,
};

/**
 * Resolve SCORM launch configuration for a given lesson.
 * Joins lessons -> scorm_scos -> scorm_packages and enforces tenant scope.
 */
export async function getScormLaunchConfigForLesson(lessonId, tenantId, isSuperAdmin = false) {
  const result = await query(
    `SELECT 
       l.id as lesson_id,
       l.title as lesson_title,
       l.lesson_type,
       l.scorm_sco_id,
       s.id as sco_id,
       s.identifier as sco_identifier,
       s.title as sco_title,
       s.launch_path,
       s.is_entry_point,
       p.id as package_id,
       p.title as package_title,
       p.version,
       p.content_base_path,
       p.zip_blob_url,
       c.id as course_id,
       c.title as course_title,
       c.slug as course_slug,
       c.tenant_id
     FROM public.lessons l
     JOIN public.modules m ON l.module_id = m.id
     JOIN public.courses c ON m.course_id = c.id
     JOIN public.scorm_scos s ON s.id = l.scorm_sco_id
     JOIN public.scorm_packages p ON p.id = s.package_id
     WHERE l.id = $1`,
    [lessonId]
  );

  if (result.rows.length === 0) {
    throw new Error('SCORM lesson not found or not linked to a SCO');
  }

  const row = result.rows[0];

  if (!isSuperAdmin && tenantId && row.tenant_id && row.tenant_id !== tenantId) {
    throw new Error('Access denied to SCORM lesson');
  }

  if (row.lesson_type !== 'scorm') {
    throw new Error('Lesson is not a SCORM lesson');
  }

  // Sanitize launch path
  const sanitizedLaunchPath = sanitizePath(row.launch_path);
  
  // Build launch URL
  // content_base_path can be either:
  // 1. Vercel Blob URL format: https://xxx.public.blob.vercel-storage.com/tenants/.../scorm/content/packageId
  // 2. Legacy local path: /scorm-content/packageId
  let launchUrl;
  if (row.content_base_path && row.content_base_path.startsWith('http')) {
    // Vercel Blob URL - construct full URL
    const basePath = row.content_base_path.replace(/\/$/, '');
    const launchPath = sanitizedLaunchPath.replace(/^\//, '');
    launchUrl = `${basePath}/${launchPath}`;
  } else {
    // Legacy local filesystem path
    const contentBasePath = row.content_base_path || `/scorm-content/${row.package_id}`;
    const basePath = contentBasePath.replace(/\/$/, '');
    const launchPath = sanitizedLaunchPath.replace(/^\//, '');
    launchUrl = `${basePath}/${launchPath}`;
  }

  return {
    lesson: {
      id: row.lesson_id,
      title: row.lesson_title,
      lesson_type: row.lesson_type,
    },
    course: {
      id: row.course_id,
      title: row.course_title,
      slug: row.course_slug,
    },
    package: {
      id: row.package_id,
      title: row.package_title,
      version: row.version,
      content_base_path: row.content_base_path,
      zip_blob_url: row.zip_blob_url,
    },
    sco: {
      id: row.sco_id,
      identifier: row.sco_identifier,
      title: row.sco_title,
      launch_path: row.launch_path,
      is_entry_point: row.is_entry_point,
    },
    launchUrl,
  };
}

/**
 * Verify if a SCORM file exists in Vercel Blob storage or local filesystem
 */
export async function verifyScormFileExists(packageId, filePath, tenantId, isSuperAdmin = false) {
  const client = await getClient();
  
  // Get package info to find content_base_path
  const pkgResult = await client.query(
    `SELECT content_base_path, tenant_id 
     FROM public.scorm_packages 
     WHERE id = $1`,
    [packageId]
  );

  if (pkgResult.rows.length === 0) {
    throw new Error('SCORM package not found');
  }

  const pkg = pkgResult.rows[0];
  
  // Check tenant access (unless super admin)
  if (!isSuperAdmin && pkg.tenant_id !== tenantId) {
    throw new Error('Access denied to SCORM package');
  }

  const contentBasePath = pkg.content_base_path;
  
  // If content_base_path is a Vercel Blob URL, check using list API
  if (contentBasePath && contentBasePath.startsWith('http')) {
    const { list } = await import('@vercel/blob');
    
    // Construct the expected file path in blob storage
    // content_base_path format: https://xxx.public.blob.vercel-storage.com/tenants/xxx/scorm/content/packageName
    // filePath format: relative path like "shared/launchpage.html"
    const urlObj = new URL(contentBasePath);
    const basePathParts = urlObj.pathname.split('/').filter(p => p);
    
    // Sanitize file path
    const sanitizedFilePath = filePath.replace(/\.\./g, '').replace(/\0/g, '').replace(/^\//, '');
    const expectedPath = [...basePathParts, ...sanitizedFilePath.split('/')].join('/');
    
    try {
      // List files with the expected path as prefix
      const listResult = await list({ 
        prefix: expectedPath,
        limit: 1 
      });
      
      // Check if we found an exact match
      const exactMatch = listResult.blobs.find(
        blob => blob.pathname === expectedPath || blob.pathname.endsWith(`/${sanitizedFilePath}`)
      );
      
      return {
        exists: !!exactMatch,
        isFile: exactMatch ? !exactMatch.pathname.endsWith('/') : false,
        isDirectory: false, // Can't easily determine this from list
        size: exactMatch?.size || 0,
        url: exactMatch?.url || null,
        path: expectedPath,
      };
    } catch (error) {
      console.error('[SCORM] Error verifying file in Vercel Blob:', error);
      // If listing fails, we can't verify, so return false
      return {
        exists: false,
        isFile: false,
        isDirectory: false,
        size: 0,
        url: null,
        path: expectedPath,
        error: error.message,
      };
    }
  } else {
    // Legacy local filesystem check
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scormContentRoot = path.join(__dirname, '..', 'storage', 'scorm');
    const packageDir = path.join(scormContentRoot, packageId);

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/\0/g, '');
    const fullPath = path.join(packageDir, sanitizedPath);

    if (!fullPath.startsWith(packageDir)) {
      throw new Error('Invalid file path');
    }

    const exists = fs.existsSync(fullPath);
    const stats = exists ? fs.statSync(fullPath) : null;

    return {
      exists,
      isFile: stats?.isFile() || false,
      isDirectory: stats?.isDirectory() || false,
      size: stats?.size || 0,
      path: fullPath,
    };
  }
}



