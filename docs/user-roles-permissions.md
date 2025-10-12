# UDrive User Roles & Permissions

## Overview

UDrive implements a comprehensive role-based access control (RBAC) system to ensure appropriate access levels for different user types. The system defines four primary roles with distinct permission sets.

## Role Hierarchy

```
┌─────────────────┐
│   Super Admin   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  School Admin   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Instructor    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Student     │
└─────────────────┘
```

## Detailed Role Permissions

### Super Admin

Super Admins manage the entire platform and have unrestricted access to all features.

#### Platform Management
- Create, update, and delete tenants (driving schools)
- Configure platform-wide settings
- Monitor system health and performance
- View usage analytics across all tenants
- Manage subscription plans and billing

#### User Management
- Create and manage School Admin accounts
- View all users across the platform
- Reset passwords for any user
- Enable/disable user accounts

#### Content Management
- View content across all tenants
- Create and manage global content templates
- Create and manage system-wide announcements

#### Analytics & Reporting
- Access platform-wide analytics dashboard
- Generate cross-tenant reports
- Monitor system usage patterns
- Track growth metrics
- Analyze performance indicators

### School Admin

School Admins manage their specific driving school (tenant) and have full control within their school's domain.

#### School Management
- Configure school profile and branding
- Manage school settings and preferences
- Set up school-specific policies
- Define custom fields for student registration

#### User Management
- Create, update, and delete instructor accounts
- Create, update, and delete student accounts
- Assign instructors to courses
- Manage user groups and classes
- View instructor and student activity

#### Content Management
- Create, update, and delete courses
- Approve content created by instructors
- Manage school-wide content library
- Set up curriculum pathways
- Define certificate templates

#### Analytics & Reporting
- Access school-level analytics dashboard
- Track student progress and performance
- Monitor instructor activity and effectiveness
- Generate custom reports
- Export data for external analysis

#### Billing & Subscription
- View current subscription details
- Update payment information
- Access billing history
- Manage add-on services

### Instructor

Instructors create and deliver educational content and manage their assigned students.

#### Student Management
- View assigned students
- Track student progress
- Provide feedback on student work
- Communicate with students
- Manage small groups within assigned classes

#### Content Management
- Create and edit lessons
- Develop quizzes and assessments
- Upload and manage media content
- Create assignment instructions
- Request approval for published content

#### Assessment Management
- Create quiz questions
- Grade student submissions
- Provide feedback on assignments
- Track quiz performance statistics
- Set up automated grading rules

#### Progress Tracking
- View student completion rates
- Monitor time spent on lessons
- Track quiz scores and attempts
- Identify struggling students
- Generate progress reports

### Student

Students access learning materials, complete assessments, and track their own progress.

#### Course Access
- View enrolled courses
- Access assigned lessons and materials
- Download course resources
- Bookmark important content
- View course announcements

#### Learning Activities
- Complete lessons
- Take quizzes and assessments
- Submit assignments
- Interact with interactive content
- Track personal progress

#### Progress & Certificates
- View personal progress dashboard
- Track completion status
- Access earned certificates
- View quiz scores and feedback
- Set personal learning goals

#### Communication
- Message assigned instructors
- Receive notifications
- Access help resources
- Provide course feedback
- Report technical issues

## Permission Matrix

| Feature | Super Admin | School Admin | Instructor | Student |
|---------|------------|--------------|------------|---------|
| **Tenant Management** |
| Create tenants | ✓ | - | - | - |
| Configure tenant settings | ✓ | ✓ | - | - |
| Delete tenants | ✓ | - | - | - |
| **User Management** |
| Create school admins | ✓ | - | - | - |
| Create instructors | ✓ | ✓ | - | - |
| Create students | ✓ | ✓ | - | - |
| Delete users | ✓ | ✓ | - | - |
| Reset passwords | ✓ | ✓ | - | - |
| **Course Management** |
| Create courses | ✓ | ✓ | - | - |
| Edit courses | ✓ | ✓ | ✓ | - |
| Delete courses | ✓ | ✓ | - | - |
| Publish courses | ✓ | ✓ | - | - |
| **Content Management** |
| Create lessons | ✓ | ✓ | ✓ | - |
| Edit lessons | ✓ | ✓ | ✓ | - |
| Delete lessons | ✓ | ✓ | ✓ | - |
| Publish lessons | ✓ | ✓ | ✓ | - |
| **Quiz Management** |
| Create quizzes | ✓ | ✓ | ✓ | - |
| Edit quizzes | ✓ | ✓ | ✓ | - |
| Delete quizzes | ✓ | ✓ | ✓ | - |
| View quiz results | ✓ | ✓ | ✓ | Own only |
| **Certificate Management** |
| Create certificate templates | ✓ | ✓ | - | - |
| Issue certificates | ✓ | ✓ | ✓ | - |
| View certificates | ✓ | ✓ | ✓ | Own only |
| Verify certificates | ✓ | ✓ | ✓ | ✓ |
| **Analytics & Reporting** |
| Platform-wide analytics | ✓ | - | - | - |
| School-level analytics | ✓ | ✓ | - | - |
| Instructor analytics | ✓ | ✓ | Own only | - |
| Student analytics | ✓ | ✓ | Assigned | Own only |
| Export reports | ✓ | ✓ | Limited | - |
| **System Settings** |
| Manage system configurations | ✓ | - | - | - |
| Manage integrations | ✓ | Limited | - | - |
| Access API keys | ✓ | Limited | - | - |

## Implementation Approach

The permission system will be implemented using:

1. **Role-based middleware** - Validates user role before allowing access to protected routes
2. **Permission decorators** - Applied to API endpoints to enforce fine-grained permissions
3. **UI conditional rendering** - Shows/hides UI elements based on user permissions
4. **Database-level security** - Enforces tenant isolation through query filters

### Code Example: Permission Middleware

```typescript
// middlewares/permissionMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (allowedRoles.includes(user.role)) {
      return next();
    }
    
    throw new ForbiddenError('You do not have permission to perform this action');
  };
};

// Usage in routes
router.get(
  '/api/tenants',
  requireRole(['super_admin']),
  tenantsController.getAllTenants
);
```

### Code Example: Tenant Isolation

```typescript
// middlewares/tenantMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export const tenantContext = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Super admin can access all tenants
  if (user.role === 'super_admin') {
    return next();
  }
  
  // Add tenant filter to the request context
  req.tenantId = user.tenantId;
  
  next();
};

// Usage in database queries
const getCourses = async (req: Request) => {
  const query = { 
    ...(req.tenantId && { tenant_id: req.tenantId })
  };
  
  return Course.find(query);
};
```

### Code Example: UI Permission Check

```typescript
// hooks/usePermissions.ts
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const can = (action: string, resource: string) => {
    if (!user) return false;
    
    // Super admin can do anything
    if (user.role === 'super_admin') return true;
    
    // Define permission matrix
    const permissions = {
      school_admin: {
        'create:course': true,
        'delete:course': true,
        'create:instructor': true,
        // ...more permissions
      },
      instructor: {
        'create:course': false,
        'create:lesson': true,
        'edit:lesson': true,
        // ...more permissions
      },
      student: {
        'view:lesson': true,
        'take:quiz': true,
        // ...more permissions
      }
    };
    
    return permissions[user.role]?.[`${action}:${resource}`] || false;
  };
  
  return { can };
};

// Usage in component
const CourseActions = ({ course }) => {
  const { can } = usePermissions();
  
  return (
    <div>
      {can('edit', 'course') && (
        <button>Edit Course</button>
      )}
      {can('delete', 'course') && (
        <button>Delete Course</button>
      )}
    </div>
  );
};
```