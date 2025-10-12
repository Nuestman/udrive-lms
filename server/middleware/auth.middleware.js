// Authentication Middleware
import jwt from 'jsonwebtoken';
import { query } from '../lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

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
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database (decoded.id not decoded.userId!)
    const result = await query(
      'SELECT id, email, first_name, last_name, role, tenant_id, is_active FROM user_profiles WHERE id = $1',
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
      const decoded = jwt.verify(token, JWT_SECRET);
      const result = await query(
        'SELECT id, email, first_name, last_name, role, tenant_id, is_active FROM user_profiles WHERE id = $1',
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

