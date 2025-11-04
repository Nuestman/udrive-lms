// Analytics Service - Dashboard statistics and metrics
import { query } from '../lib/db.js';

/**
 * Get dashboard statistics
 * - Super Admin: System-wide statistics
 * - Others: Their school's statistics only
 */
export async function getDashboardStats(tenantId, isSuperAdmin = false) {
  const tenantFilter = isSuperAdmin ? '' : 'WHERE tenant_id = $1';
  const params = isSuperAdmin ? [] : [tenantId];
  // Get all stats in parallel
  const [
    studentStats,
    courseStats,
    enrollmentStats,
    certificateStats
  ] = await Promise.all([
    // Student statistics
    query(
      `SELECT 
        COUNT(*) as total_students,
        COUNT(*) FILTER (WHERE is_active = true) as active_students,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
       FROM users 
       ${isSuperAdmin ? "WHERE role = 'student'" : "WHERE tenant_id = $1 AND role = 'student'"}`,
      params
    ),
    
    // Course statistics
    query(
      `SELECT 
        COUNT(*) as total_courses,
        COUNT(*) FILTER (WHERE status = 'published') as published_courses,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_courses
       FROM courses 
       ${tenantFilter}`,
      params
    ),
    
    // Enrollment statistics  
    query(
      isSuperAdmin 
        ? `SELECT 
            COUNT(*) as total_enrollments,
            COUNT(*) FILTER (WHERE e.status = 'active') as active_enrollments,
            COUNT(*) FILTER (WHERE e.status = 'completed') as completed_enrollments,
            COUNT(*) FILTER (WHERE e.enrolled_at > NOW() - INTERVAL '30 days') as monthly_enrollments,
            ROUND(AVG(e.progress_percentage)) as avg_progress
           FROM enrollments e`
        : `SELECT 
            COUNT(*) as total_enrollments,
            COUNT(*) FILTER (WHERE e.status = 'active') as active_enrollments,
            COUNT(*) FILTER (WHERE e.status = 'completed') as completed_enrollments,
            COUNT(*) FILTER (WHERE e.enrolled_at > NOW() - INTERVAL '30 days') as monthly_enrollments,
            ROUND(AVG(e.progress_percentage)) as avg_progress
           FROM enrollments e
           JOIN courses c ON e.course_id = c.id
           WHERE c.tenant_id = $1`,
      params
    ),
    
    // Certificate statistics
    query(
      `SELECT 
        COUNT(*) as total_certificates,
        COUNT(*) FILTER (WHERE issued_at > NOW() - INTERVAL '30 days') as monthly_certificates
       FROM certificates cert
       JOIN users u ON cert.student_id = u.id
       ${isSuperAdmin ? '' : 'WHERE u.tenant_id = $1'}`,
      params
    )
  ]);

  // Get instructor count
  const instructorStats = await query(
    isSuperAdmin
      ? 'SELECT COUNT(*) as count FROM users WHERE role = \'instructor\' AND is_active = true'
      : 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND role = \'instructor\' AND is_active = true',
    params
  );

  // Get completion rate
  const totalEnrollments = parseInt(enrollmentStats.rows[0].total_enrollments) || 1; // Avoid division by zero
  const completedEnrollments = parseInt(enrollmentStats.rows[0].completed_enrollments) || 0;
  const completionRate = Math.round((completedEnrollments / totalEnrollments) * 100);

  return {
    totalStudents: parseInt(studentStats.rows[0].total_students) || 0,
    activeStudents: parseInt(studentStats.rows[0].active_students) || 0,
    newStudentsThisMonth: parseInt(studentStats.rows[0].new_this_month) || 0,
    
    totalCourses: parseInt(courseStats.rows[0].total_courses) || 0,
    publishedCourses: parseInt(courseStats.rows[0].published_courses) || 0,
    draftCourses: parseInt(courseStats.rows[0].draft_courses) || 0,
    
    activeInstructors: parseInt(instructorStats.rows[0].count) || 0,
    
    totalEnrollments: parseInt(enrollmentStats.rows[0].total_enrollments) || 0,
    activeEnrollments: parseInt(enrollmentStats.rows[0].active_enrollments) || 0,
    monthlyEnrollments: parseInt(enrollmentStats.rows[0].monthly_enrollments) || 0,
    averageProgress: parseInt(enrollmentStats.rows[0].avg_progress) || 0,
    completionRate: completionRate,
    
    certificatesIssued: parseInt(certificateStats.rows[0].total_certificates) || 0,
    monthlyCertificates: parseInt(certificateStats.rows[0].monthly_certificates) || 0
  };
}

/**
 * Get recent activity
 * - Super Admin: System-wide activity across all tenants
 * - Others: Their school's activity only
 */
export async function getRecentActivity(tenantId, limit = 10) {
  const activities = [];

  // Super admin gets system-wide data, others get tenant-specific data
  const tenantFilterEnrollments = tenantId ? 'WHERE c.tenant_id = $1' : '';
  const tenantFilterCertificates = tenantId ? 'WHERE u.tenant_id = $1' : '';
  const enrollmentParams = tenantId ? [tenantId, Math.floor(limit / 2)] : [Math.floor(limit / 2)];
  const certificateParams = tenantId ? [tenantId, Math.floor(limit / 2)] : [Math.floor(limit / 2)];

  // Recent enrollments
  const enrollments = await query(
    `SELECT e.enrolled_at as timestamp, 'enrollment' as type,
      p.first_name || ' ' || p.last_name as user_name,
      c.title as course_title
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN courses c ON e.course_id = c.id
     ${tenantFilterEnrollments}
     ORDER BY e.enrolled_at DESC
     LIMIT ${tenantId ? '$2' : '$1'}`,
    enrollmentParams
  );

  enrollments.rows.forEach(row => {
    activities.push({
      type: 'enrollment',
      description: `${row.user_name} enrolled in ${row.course_title}`,
      timestamp: row.timestamp,
      user: row.user_name
    });
  });

  // Recent certificates
  const certificates = await query(
    `SELECT cert.issued_at as timestamp, 'certificate' as type,
      p.first_name || ' ' || p.last_name as user_name,
      c.title as course_title
     FROM certificates cert
     JOIN users u ON cert.student_id = u.id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN courses c ON cert.course_id = c.id
     ${tenantFilterCertificates}
     ORDER BY cert.issued_at DESC
     LIMIT ${tenantId ? '$2' : '$1'}`,
    certificateParams
  );

  certificates.rows.forEach(row => {
    activities.push({
      type: 'certificate',
      description: `Certificate issued to ${row.user_name} for ${row.course_title}`,
      timestamp: row.timestamp,
      user: row.user_name
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, limit);
}

/**
 * Get enrollment trends aggregated by interval
 * - Super Admin: System-wide trends across all tenants
 * - Others: Their school's trends only
 */
export async function getEnrollmentTrends(tenantId, options = {}) {
  const { interval = 'week', periods = 12 } = options;
  const validIntervals = ['day', 'week', 'month'];
  const safeInterval = validIntervals.includes(interval) ? interval : 'week';
  const rangeSql = safeInterval === 'day' ? `INTERVAL '${periods} days'` : safeInterval === 'month' ? `INTERVAL '${periods} months'` : `INTERVAL '${periods} weeks'`;

  // Super admin gets system-wide data, others get tenant-specific data
  const tenantFilter = tenantId ? 'WHERE c.tenant_id = $1' : '';
  const params = tenantId ? [tenantId] : [];

  const result = await query(
    `SELECT 
      DATE_TRUNC('${safeInterval}', e.enrolled_at) AS period_start,
      COUNT(*) AS enrollments,
      COUNT(*) FILTER (WHERE e.status = 'completed') AS completions
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     ${tenantFilter}
       AND e.enrolled_at >= CURRENT_DATE - ${rangeSql}
     GROUP BY DATE_TRUNC('${safeInterval}', e.enrolled_at)
     ORDER BY period_start ASC`,
    params
  );

  return result.rows.map(row => ({
    periodStart: row.period_start,
    enrollments: parseInt(row.enrollments) || 0,
    completions: parseInt(row.completions) || 0
  }));
}

/**
 * Get course performance summary
 * - Super Admin: System-wide course performance across all tenants
 * - Others: Their school's course performance only
 */
export async function getCoursePerformance(tenantId, limit = 10) {
  // Super admin gets system-wide data, others get tenant-specific data
  const tenantFilter = tenantId ? 'WHERE c.tenant_id = $1' : '';
  const params = tenantId ? [tenantId, limit] : [limit];

  const result = await query(
    `SELECT 
      c.id,
      c.title,
      COUNT(e.*) AS enrollments,
      COUNT(*) FILTER (WHERE e.status = 'completed') AS completions,
      ROUND(AVG(e.progress_percentage)) AS avg_progress
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id
     ${tenantFilter}
     GROUP BY c.id
     ORDER BY enrollments DESC NULLS LAST
     LIMIT ${tenantId ? '$2' : '$1'}`,
    params
  );

  return result.rows.map(row => {
    const enrollments = parseInt(row.enrollments) || 0;
    const completions = parseInt(row.completions) || 0;
    const completionRate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;
    return {
      courseId: row.id,
      courseTitle: row.title,
      enrollments,
      completions,
      averageProgress: parseInt(row.avg_progress) || 0,
      completionRate
    };
  });
}

/**
 * Get school performance metrics for super admin
 * Returns performance data for all schools
 */
export async function getSchoolPerformance(limit = 10) {
  const result = await query(
    `SELECT 
      t.id as school_id,
      t.name as school_name,
      t.subdomain,
      t.is_active,
      COUNT(DISTINCT u.id) as total_students,
      COUNT(DISTINCT c.id) as total_courses,
      COUNT(DISTINCT e.id) as total_enrollments,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_enrollments,
      ROUND(AVG(e.progress_percentage)) as avg_progress,
      COUNT(DISTINCT cert.id) as certificates_issued
     FROM tenants t
     LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'student'
     LEFT JOIN courses c ON c.tenant_id = t.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     LEFT JOIN certificates cert ON cert.student_id = u.id
     GROUP BY t.id, t.name, t.subdomain, t.is_active
     ORDER BY total_enrollments DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(row => {
    const totalEnrollments = parseInt(row.total_enrollments) || 0;
    const completedEnrollments = parseInt(row.completed_enrollments) || 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    
    return {
      schoolId: row.school_id,
      schoolName: row.school_name,
      subdomain: row.subdomain,
      isActive: row.is_active,
      totalStudents: parseInt(row.total_students) || 0,
      totalCourses: parseInt(row.total_courses) || 0,
      totalEnrollments,
      completedEnrollments,
      avgProgress: parseInt(row.avg_progress) || 0,
      completionRate,
      certificatesIssued: parseInt(row.certificates_issued) || 0
    };
  });
}

/**
 * Get school statistics for super admin dashboard
 */
export async function getSchoolStats() {
  const result = await query(
    `SELECT 
      COUNT(*) as total_schools,
      COUNT(*) FILTER (WHERE is_active = true) as active_schools,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_schools,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_schools_this_month
     FROM tenants`
  );

  const row = result.rows[0];
  return {
    totalSchools: parseInt(row.total_schools) || 0,
    activeSchools: parseInt(row.active_schools) || 0,
    inactiveSchools: parseInt(row.inactive_schools) || 0,
    newSchoolsThisMonth: parseInt(row.new_schools_this_month) || 0
  };
}

export default {
  getDashboardStats,
  getRecentActivity,
  getEnrollmentTrends,
  getCoursePerformance,
  getSchoolPerformance,
  getSchoolStats
};

