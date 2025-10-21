# 🔒 Tenant Isolation Strategy - Bulletproof Implementation

## Tenant Hierarchy Definition

### 1. **Super Admin** (Global Access)
```
Role: super_admin
Tenant: NULL or special system tenant
Access: ALL data across ALL tenants
Restrictions: NONE
```

**Capabilities:**
- View all schools/tenants
- View all users across all tenants
- View all courses across all tenants
- Manage system-wide settings
- Create/manage tenants
- No tenant filtering applied

### 2. **School Admin** (Tenant Scoped)
```
Role: school_admin
Tenant: Specific school UUID
Access: Only their tenant's data
Restrictions: tenant_id = user.tenant_id
```

**Capabilities:**
- View/manage their school's data only
- Manage courses in their school
- Manage students in their school
- Manage instructors in their school
- Cannot see other schools' data

### 3. **Instructor** (Tenant Scoped)
```
Role: instructor
Tenant: Specific school UUID
Access: Only their tenant's data
Restrictions: tenant_id = user.tenant_id + owned courses
```

**Capabilities:**
- View their tenant's courses
- Manage courses they created
- View students enrolled in their courses
- Cannot see other schools' data
- Cannot access other instructors' courses

### 4. **Student** (Tenant Scoped)
```
Role: student
Tenant: Specific school UUID
Access: Only their tenant's data + enrolled courses
Restrictions: tenant_id = user.tenant_id + enrollments only
```

**Capabilities:**
- View courses in their school
- Access only enrolled courses
- View own progress
- Cannot see other schools' data
- Cannot see other students' data

---

## Implementation Rules

### Database Level

#### All User-Related Tables MUST Have:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id)
```

**Tables requiring tenant_id:**
- ✅ users
- ✅ courses
- ✅ modules (via courses)
- ✅ lessons (via modules → courses)
- ✅ enrollments (via courses)
- ✅ quizzes (via courses)
- ✅ certificates (via users)
- ✅ assignments (via courses)
- ✅ notifications (via users)
- ✅ goals (via users)
- ✅ achievements (via users)

#### Indexes for Performance:
```sql
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX idx_enrollments_tenant_id ON enrollments(tenant_id);
-- etc for all tables
```

---

## Middleware Implementation

### 1. **Tenant Context Middleware**

```javascript
// server/middleware/tenant.middleware.js

export const tenantContext = (req, res, next) => {
  // Super admin bypasses tenant filtering
  if (req.user.role === 'super_admin') {
    req.tenantId = null; // null means "all tenants"
    req.isSuperAdmin = true;
    console.log(`Super Admin Access: ${req.user.email} - No tenant restrictions`);
    next();
    return;
  }

  // All other roles MUST have tenant_id
  if (!req.user.tenant_id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: No tenant association'
    });
  }

  req.tenantId = req.user.tenant_id;
  req.isSuperAdmin = false;
  console.log(`Tenant context: ${req.tenantId} (User: ${req.user.email}, Role: ${req.user.role})`);
  next();
};
```

### 2. **Query Pattern for Services**

```javascript
// SUPER ADMIN queries (no tenant filter)
if (isSuperAdmin) {
  const result = await query(
    `SELECT c.*, t.name as school_name
     FROM courses c
     LEFT JOIN tenants t ON c.tenant_id = t.id
     ORDER BY c.created_at DESC`
  );
}

// TENANT-SCOPED queries (with filter)
else {
  const result = await query(
    `SELECT c.*
     FROM courses c
     WHERE c.tenant_id = $1
     ORDER BY c.created_at DESC`,
    [tenantId]
  );
}
```

---

## Service Layer Rules

### Pattern for ALL Services:

```javascript
export async function getResource(filters, tenantId, isSuperAdmin) {
  // Build base query
  let query = 'SELECT * FROM resources r';
  let params = [];
  
  // Super admin: no tenant filter
  if (!isSuperAdmin) {
    query += ' WHERE r.tenant_id = $1';
    params.push(tenantId);
  } else {
    // Super admin sees all, join tenant info
    query += ' LEFT JOIN tenants t ON r.tenant_id = t.id';
  }
  
  // Add filters
  // Add ordering
  
  return await db.query(query, params);
}
```

---

## Data Access Matrix

| Role | Courses | Students | Enrollments | Modules | Lessons | System Settings |
|------|---------|----------|-------------|---------|---------|-----------------|
| **Super Admin** | All | All | All | All | All | ✅ |
| **School Admin** | Own School | Own School | Own School | Own School | Own School | ❌ |
| **Instructor** | Own School + Created | Enrolled Only | Enrolled Only | Created Only | Created Only | ❌ |
| **Student** | Enrolled Only | Self Only | Self Only | Enrolled Only | Enrolled Only | ❌ |

---

## Security Checklist

### ✅ Required for Every Query:

1. **Authentication Check**
   ```javascript
   requireAuth middleware
   ```

2. **Tenant Context**
   ```javascript
   tenantContext middleware
   ```

3. **Role Authorization**
   ```javascript
   permissions.canViewResource
   ```

4. **Query Filtering**
   ```javascript
   WHERE tenant_id = $1 (unless super_admin)
   ```

5. **Response Sanitization**
   ```javascript
   // Don't leak other tenants' data
   // Remove sensitive fields
   ```

---

## Critical Security Rules

### 🚨 NEVER Allow:

1. ❌ Query without tenant filter (except super_admin)
2. ❌ Direct tenant_id in URL parameters
3. ❌ Client-side tenant selection
4. ❌ Tenant switching without re-authentication
5. ❌ Cross-tenant data access

### ✅ ALWAYS Require:

1. ✅ Tenant from authenticated user session
2. ✅ Tenant validation in middleware
3. ✅ Tenant filter in ALL queries
4. ✅ Tenant check in ALL updates/deletes
5. ✅ Audit logging for cross-tenant attempts

---

## Example: Courses Service

```javascript
export async function getCourses(filters, req) {
  const { tenantId, isSuperAdmin, user } = req;
  
  let query = `
    SELECT c.*, 
      u.first_name || ' ' || u.last_name as instructor_name,
      (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count
    FROM courses c
    LEFT JOIN users u ON c.created_by = u.id
  `;
  
  const params = [];
  const conditions = [];
  
  // CRITICAL: Tenant filtering
  if (!isSuperAdmin) {
    conditions.push(`c.tenant_id = $${params.length + 1}`);
    params.push(tenantId);
  } else {
    // Super admin sees all with school name
    query = query.replace('FROM courses c', 
      'FROM courses c LEFT JOIN tenants t ON c.tenant_id = t.id');
  }
  
  // Additional filters
  if (filters.status) {
    conditions.push(`c.status = $${params.length + 1}`);
    params.push(filters.status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  const result = await db.query(query, params);
  return result.rows;
}
```

---

## Testing Tenant Isolation

### Test Cases:

1. **Super Admin Access**
   ```
   Login as super_admin
   GET /api/courses
   Expected: All courses from all tenants
   ```

2. **School Admin Isolation**
   ```
   Login as school_admin (tenant A)
   GET /api/courses
   Expected: Only tenant A courses
   Attempt to access tenant B course: 403 Forbidden
   ```

3. **Cross-Tenant Attack**
   ```
   Login as school_admin (tenant A)
   PUT /api/courses/{tenant_B_course_id}
   Expected: 404 Not Found or 403 Forbidden
   ```

4. **Instructor Isolation**
   ```
   Login as instructor (tenant A)
   GET /api/students
   Expected: Only students from tenant A enrolled in instructor's courses
   ```

5. **Student Isolation**
   ```
   Login as student (tenant A)
   GET /api/courses
   Expected: Only enrolled courses from tenant A
   Attempt to access other student's data: 403 Forbidden
   ```

---

## Migration Plan

### Phase 1: Fix Middleware (Immediate)
1. Update tenant.middleware.js for super_admin bypass
2. Add isSuperAdmin flag to requests
3. Test all endpoints

### Phase 2: Update Services (Next)
1. Add isSuperAdmin parameter to all service functions
2. Implement conditional tenant filtering
3. Add tenant name to super admin queries

### Phase 3: Validation (Final)
1. Security audit of all endpoints
2. Automated tests for tenant isolation
3. Penetration testing
4. Documentation update

---

## Database Seed Compliance

### Current State:
- 1 tenant (UDrive School)
- All users belong to this tenant
- All data scoped to this tenant

### Required Changes:
1. ✅ Ensure all records have valid tenant_id
2. ✅ Create test tenants for isolation testing
3. ✅ Create super_admin user with no tenant
4. ✅ Verify foreign key constraints

---

## Monitoring & Logging

### Log Every:
1. Cross-tenant access attempts
2. Super admin data access
3. Tenant context establishment
4. Permission denied events

### Alerts for:
1. Missing tenant_id in queries
2. Cross-tenant data leaks
3. Unauthorized tenant switching
4. Failed permission checks

---

**Next Step: Implement this strategy across all services!**

