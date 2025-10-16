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

    // Get fresh user data from database with profile
    const result = await query(
      `SELECT u.id, u.email, u.role, u.tenant_id, u.is_active,
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

    // Attach user to request
    req.user = result.rows[0];
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
        `SELECT u.id, u.email, u.role, u.tenant_id, u.is_active,
                p.first_name, p.last_name, p.avatar_url, p.phone
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = $1`,
        [decoded.id]
      );

      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = result.rows[0];
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

