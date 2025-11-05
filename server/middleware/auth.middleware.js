// Authentication Middleware
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';
import { APP_CONFIG } from '../config/app.js';

/**
 * Verify JWT token and attach user to request
 */
export async function requireAuth(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.auth_token || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET);

    // Get fresh user data from database with profile and settings
    const result = await query(
      `SELECT u.id, u.email, u.role, u.tenant_id, u.is_active, u.settings,
              p.first_name, p.last_name, p.avatar_url, p.phone
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }

    const user = result.rows[0];
    const primaryRole = user.role;
    const settings = user.settings || {};
    
    // Get active_role from header or database settings, default to primary role
    const headerActiveRole = req.headers['x-active-role'];
    const dbActiveRole = settings.active_role || primaryRole;
    
    // Determine effective active role
    let activeRole = dbActiveRole;
    
    // If header is provided, validate it
    if (headerActiveRole) {
      // Validate: header role must be either primary role OR 'student' (if primary is elevated)
      const allowedRoles = [primaryRole];
      if (primaryRole !== 'student') {
        allowedRoles.push('student');
      }
      
      if (allowedRoles.includes(headerActiveRole)) {
        activeRole = headerActiveRole;
      } else {
        // Invalid header role - use database role instead
        console.warn(`Invalid X-Active-Role header: ${headerActiveRole} for user ${user.id}. Using database role.`);
      }
    }

    // Attach user to request with active role information
    req.user = {
      ...user,
      primaryRole: primaryRole,
      activeRole: activeRole,
      // Keep role for backwards compatibility, but use activeRole for permissions
      role: activeRole
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
}

/**
 * Optional auth - attaches user if token exists, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.auth_token || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET);
      const result = await query(
        `SELECT u.id, u.email, u.role, u.tenant_id, u.is_active, u.settings,
                p.first_name, p.last_name, p.avatar_url, p.phone
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = $1`,
        [decoded.id]
      );

      if (result.rows.length > 0 && result.rows[0].is_active) {
        const user = result.rows[0];
        const primaryRole = user.role;
        const settings = user.settings || {};
        const headerActiveRole = req.headers['x-active-role'];
        const dbActiveRole = settings.active_role || primaryRole;
        
        let activeRole = dbActiveRole;
        
        if (headerActiveRole) {
          const allowedRoles = [primaryRole];
          if (primaryRole !== 'student') {
            allowedRoles.push('student');
          }
          
          if (allowedRoles.includes(headerActiveRole)) {
            activeRole = headerActiveRole;
          }
        }

        req.user = {
          ...user,
          primaryRole: primaryRole,
          activeRole: activeRole,
          role: activeRole
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
}

export default {
  requireAuth,
  optionalAuth
};

