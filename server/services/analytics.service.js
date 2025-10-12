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
       FROM user_profiles 
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
       JOIN user_profiles u ON cert.student_id = u.id
       ${isSuperAdmin ? '' : 'WHERE u.tenant_id = $1'}`,
      params
    )
  ]);

  // Get instructor count
  const instructorStats = await query(
    isSuperAdmin
      ? 'SELECT COUNT(*) as count FROM user_profiles WHERE role = \'instructor\' AND is_active = true'
      : 'SELECT COUNT(*) as count FROM user_profiles WHERE tenant_id = $1 AND role = \'instructor\' AND is_active = true',
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
 */
export async function getRecentActivity(tenantId, limit = 10) {
  const activities = [];

  // Recent enrollments
  const enrollments = await query(
    `SELECT e.enrolled_at as timestamp, 'enrollment' as type,
      u.first_name || ' ' || u.last_name as user_name,
      c.title as course_title
     FROM enrollments e
     JOIN user_profiles u ON e.student_id = u.id
     JOIN courses c ON e.course_id = c.id
     WHERE c.tenant_id = $1
     ORDER BY e.enrolled_at DESC
     LIMIT $2`,
    [tenantId, Math.floor(limit / 2)]
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
      u.first_name || ' ' || u.last_name as user_name,
      c.title as course_title
     FROM certificates cert
     JOIN user_profiles u ON cert.student_id = u.id
     JOIN courses c ON cert.course_id = c.id
     WHERE u.tenant_id = $1
     ORDER BY cert.issued_at DESC
     LIMIT $2`,
    [tenantId, Math.floor(limit / 2)]
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

export default {
  getDashboardStats,
  getRecentActivity
};

