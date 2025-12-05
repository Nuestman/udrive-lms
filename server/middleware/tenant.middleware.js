// Tenant Context Middleware - Bulletproof Tenant Isolation
import { query } from '../lib/db.js';

/**
 * Establish tenant context from authenticated user
 * 
 * SECURITY RULES:
 * - Super Admin: No tenant restrictions (req.tenantId = null, req.isSuperAdmin = true)
 * - All Others: Strict tenant isolation (req.tenantId = user.tenant_id, req.isSuperAdmin = false)
 * 
 * Sets on req:
 * - tenantId: Current tenant scope (null for super_admin = all tenants)
 * - isSuperAdmin: Boolean flag
 * - userTenantId: User's actual tenant_id (for logging)
 */
export async function tenantContext(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required' 
    });
  }

  // Fetch fresh user data with profile to get tenant_id
  const result = await query(
    `SELECT u.id, u.email, u.role, u.tenant_id, u.is_active,
            p.first_name, p.last_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const userProfile = result.rows[0];

  // Store user's actual tenant_id
  req.userTenantId = userProfile.tenant_id;

  // SUPER ADMIN: Bypass all tenant restrictions (check primary role, not active role)
  // Even if switched to student mode, super admin retains tenant bypass
  const primaryRole = req.user.primaryRole || userProfile.role;
  if (primaryRole === 'super_admin') {
    req.tenantId = null; // null = no filtering, see all tenants
    req.isSuperAdmin = true;
    console.log(`🔓 Super Admin Access: ${userProfile.email} - No tenant restrictions (Active Role: ${req.user.activeRole || userProfile.role})`);
    next();
    return;
  }

  // ALL OTHER ROLES: Strict tenant isolation
  // When in student mode, still use their actual tenant_id for isolation
  if (!userProfile.tenant_id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: User must belong to a tenant/school'
    });
  }

  req.tenantId = userProfile.tenant_id;
  req.isSuperAdmin = false;
  const activeRole = req.user.activeRole || userProfile.role;
//   commented out for now to reduce console noise
//   console.log(`🔒 Tenant Isolation: ${req.tenantId} (User: ${userProfile.email}, Primary Role: ${primaryRole}, Active Role: ${activeRole})`);

  next();
}

/**
 * Validate that a specific resource belongs to user's tenant
 * Use for GET/PUT/DELETE operations on individual resources
 * 
 * Super admin bypasses this check
 */
export function validateTenantAccess(getResourceTenant) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Super admin can access any tenant's resources
    if (req.isSuperAdmin) {
      console.log(`🔓 Super Admin: Bypassing tenant validation for resource`);
      return next();
    }

    try {
      const resourceTenantId = await getResourceTenant(req);

      // Resource must belong to user's tenant
      if (resourceTenantId !== req.tenantId) {
        console.log(`🚫 Tenant Violation: User ${req.user.email} (tenant: ${req.tenantId}) attempted to access resource from tenant: ${resourceTenantId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Access denied - resource belongs to different school' 
        });
      }

      next();
    } catch (error) {
      console.error('Tenant validation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to validate tenant access' 
      });
    }
  };
}

export default {
  tenantContext,
  validateTenantAccess
};
