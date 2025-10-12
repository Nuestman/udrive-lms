// Role-Based Access Control Middleware

/**
 * Require specific role(s) to access route
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
export function requireRole(allowedRoles) {
  // Convert single role to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Check if user can access resource
 * For example, instructor can only edit their own courses
 */
export function canAccessResource(getResourceOwner) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Super admin and school admin can access everything in their tenant
    if (['super_admin', 'school_admin'].includes(req.user.role)) {
      return next();
    }

    // For other roles, check resource ownership
    try {
      const resourceOwnerId = await getResourceOwner(req);
      
      if (resourceOwnerId === req.user.id) {
        return next();
      }

      return res.status(403).json({ 
        success: false,
        error: 'You can only access your own resources' 
      });
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to verify resource access' 
      });
    }
  };
}

/**
 * Permission check helper
 */
export const permissions = {
  // Course permissions
  canCreateCourse: requireRole(['super_admin', 'school_admin', 'instructor']),
  canEditCourse: requireRole(['super_admin', 'school_admin', 'instructor']),
  canDeleteCourse: requireRole(['super_admin', 'school_admin']),
  canPublishCourse: requireRole(['super_admin', 'school_admin']),
  
  // Student permissions
  canManageStudents: requireRole(['super_admin', 'school_admin']),
  canViewStudents: requireRole(['super_admin', 'school_admin', 'instructor']),
  
  // Content permissions
  canCreateContent: requireRole(['super_admin', 'school_admin', 'instructor']),
  canPublishContent: requireRole(['super_admin', 'school_admin']),
  
  // Admin only
  adminOnly: requireRole(['super_admin', 'school_admin']),
  superAdminOnly: requireRole('super_admin'),
};

export default {
  requireRole,
  canAccessResource,
  permissions
};

