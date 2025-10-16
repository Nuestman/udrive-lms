# Advanced Admin Users Management System

## Overview

A comprehensive user management dashboard with full CRUD operations, advanced analytics, filtering, and bulk operations for system administrators.

## 🎯 Features

### Core Functionality
- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete users
- ✅ **Advanced Filtering**: Filter by role, status, search by name/email
- ✅ **Bulk Operations**: Activate/deactivate multiple users at once
- ✅ **Password Management**: Admin password reset functionality
- ✅ **Real-time Analytics**: User statistics and activity tracking
- ✅ **Export Functionality**: Export user data to CSV
- ✅ **Pagination**: Efficient handling of large user lists

### Analytics Dashboard
- 📊 **User Statistics Cards**:
  - Total users count
  - Active/Inactive users
  - New users this month
  - Active users this week
  
- 📈 **Activity Chart**: 
  - 30-day user registration trends
  - Student vs Instructor breakdown
  - Interactive tooltips with daily details
  
- 🎨 **Role Distribution Chart**:
  - Visual donut chart showing user roles
  - Percentage breakdown
  - Active/Inactive status overview

- 🏆 **Top Active Users**: 
  - Shows most engaged users
  - Based on enrollments and courses

## 📁 File Structure

### Backend
```
server/
├── services/
│   └── users.service.js       # User management business logic
└── routes/
    └── users.js                # User API endpoints
```

### Frontend
```
src/
├── components/
│   └── users/
│       ├── UsersPage.tsx              # Main users dashboard
│       ├── CreateUserModal.tsx        # Create user form
│       ├── EditUserModal.tsx          # Edit user form
│       ├── DeleteUserModal.tsx        # Delete confirmation
│       ├── ResetPasswordModal.tsx     # Password reset
│       ├── UserActivityChart.tsx      # Activity visualization
│       └── UserRoleDistribution.tsx   # Role distribution chart
├── hooks/
│   └── useUsers.ts             # Custom React hooks for user management
└── lib/
    └── api.ts                  # API client functions (usersApi)
```

## 🚀 API Endpoints

### User Management

#### Get All Users
```
GET /api/users
Query Parameters:
  - role: string (optional) - Filter by role
  - status: string (optional) - Filter by active/inactive
  - search: string (optional) - Search by name or email
  - page: number (default: 1) - Page number
  - limit: number (default: 20) - Items per page
  - sortBy: string (default: 'created_at') - Sort column
  - sortOrder: string (default: 'DESC') - Sort direction

Response:
{
  success: true,
  data: [...users],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

#### Get User Statistics
```
GET /api/users/statistics

Response:
{
  success: true,
  data: {
    total_users: 150,
    active_users: 140,
    inactive_users: 10,
    super_admins: 2,
    school_admins: 5,
    instructors: 23,
    students: 120,
    new_users_week: 12,
    new_users_month: 45,
    active_last_week: 85,
    active_last_month: 130
  }
}
```

#### Get User Activity
```
GET /api/users/activity?days=30

Response:
{
  success: true,
  data: [
    {
      date: "2024-01-15",
      new_users: 5,
      new_students: 4,
      new_instructors: 1
    },
    ...
  ]
}
```

#### Get Top Users
```
GET /api/users/top?limit=10

Response:
{
  success: true,
  data: [...top users with activity metrics]
}
```

#### Get User by ID
```
GET /api/users/:id

Response:
{
  success: true,
  data: { ...user details }
}
```

#### Create User
```
POST /api/users
Body:
{
  email: string (required),
  password: string (required, min 6 chars),
  first_name: string (required),
  last_name: string (required),
  role: string (required),
  tenant_id: string (required for super_admin),
  phone: string (optional),
  avatar_url: string (optional)
}

Response:
{
  success: true,
  data: { ...created user },
  message: "User created successfully"
}
```

#### Update User
```
PUT /api/users/:id
Body:
{
  first_name: string,
  last_name: string,
  role: string,
  phone: string,
  avatar_url: string,
  is_active: boolean
}

Response:
{
  success: true,
  data: { ...updated user },
  message: "User updated successfully"
}
```

#### Delete User (Soft Delete)
```
DELETE /api/users/:id

Response:
{
  success: true,
  message: "User deactivated successfully"
}
```

#### Permanently Delete User (Super Admin Only)
```
DELETE /api/users/:id/permanent

Response:
{
  success: true,
  message: "User permanently deleted"
}
```

#### Reset User Password
```
POST /api/users/:id/reset-password
Body:
{
  newPassword: string (required, min 6 chars)
}

Response:
{
  success: true,
  message: "Password reset successfully"
}
```

#### Bulk Update Users
```
POST /api/users/bulk-update
Body:
{
  userIds: string[] (required),
  updates: {
    role?: string,
    is_active?: boolean
  }
}

Response:
{
  success: true,
  updatedCount: 5,
  message: "5 users updated successfully"
}
```

## 🔐 Access Control

### Super Admin
- Can view and manage all users across all tenants
- Can create/edit/delete any user
- Can assign any role including super_admin
- Can permanently delete users
- Can reset any user's password

### School Admin
- Can view and manage users only within their tenant
- Cannot create or manage super_admin users
- Cannot permanently delete users
- Can reset passwords for users in their tenant
- Can perform bulk operations on their tenant's users

## 🎨 UI Features

### Main Dashboard
- **Statistics Overview**: 4 key metric cards showing user counts and activity
- **Activity Chart**: Visual timeline of user registrations over 30 days
- **Role Distribution**: Donut chart showing user role breakdown
- **Top Users**: List of most active users with engagement metrics

### User Table
- **Multi-select**: Checkbox selection for bulk operations
- **Sorting**: Click column headers to sort (frontend + backend)
- **Pagination**: Navigate through large datasets efficiently
- **Inline Actions**: Quick access to Edit, Reset Password, Delete
- **Status Badges**: Visual indicators for role and active status

### Filtering & Search
- **Real-time Search**: Search by name or email (debounced)
- **Role Filter**: Quick filter by user role
- **Status Filter**: Filter active/inactive users
- **Combined Filters**: All filters work together

### Modals
1. **Create User Modal**
   - Multi-step form validation
   - Role-based field visibility
   - School selection (super admin only)
   - Auto-generated avatar option

2. **Edit User Modal**
   - Pre-filled form with current data
   - Email field locked (read-only)
   - Active status toggle

3. **Delete User Modal**
   - Confirmation dialog with user details
   - Clear warning about soft delete

4. **Reset Password Modal**
   - Random password generator
   - Password confirmation
   - Visual feedback on success

## 🔧 Usage Examples

### Frontend - Using the Hooks

```typescript
import { useUsers, useUserStatistics } from '@/hooks/useUsers';

function MyComponent() {
  // Basic usage
  const { users, loading, error } = useUsers();

  // With filters
  const { users, updateFilters } = useUsers({
    role: 'student',
    status: 'active',
    page: 1,
    limit: 20
  });

  // Statistics
  const { statistics, loading } = useUserStatistics();

  // CRUD operations
  const { createUser, updateUser, deleteUser } = useUsers();

  const handleCreate = async () => {
    try {
      await createUser({
        email: 'user@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
        tenant_id: 'tenant-id'
      });
    } catch (error) {
      console.error(error);
    }
  };
}
```

### Backend - Using the Service

```javascript
import usersService from '../services/users.service.js';

// Get paginated users with filters
const result = await usersService.getAllUsers({
  tenantId: 'tenant-id',
  role: 'student',
  status: 'active',
  search: 'john',
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC'
});

// Get user statistics
const stats = await usersService.getUserStatistics('tenant-id');

// Create user
const user = await usersService.createUser({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'student',
  tenant_id: 'tenant-id'
});

// Bulk update
await usersService.bulkUpdateUsers(
  ['user-id-1', 'user-id-2'],
  { is_active: false }
);
```

## 📊 Database Schema

The system uses the existing `users` table:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT CHECK (role IN ('super_admin', 'school_admin', 'instructor', 'student')),
    avatar_url TEXT,
    phone TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚦 Testing the System

### 1. Access the Dashboard
- Login as super_admin or school_admin
- Navigate to: `/admin/users`

### 2. Test CRUD Operations
```bash
# Create a user
- Click "Add User" button
- Fill in the form
- Submit

# Edit a user
- Click the 3-dot menu on any user
- Select "Edit User"
- Make changes
- Save

# Delete a user
- Click the 3-dot menu
- Select "Delete User"
- Confirm deletion

# Reset password
- Click the 3-dot menu
- Select "Reset Password"
- Enter new password or generate random
- Confirm
```

### 3. Test Filtering
```bash
# Search
- Type in search box: "john"
- Results update in real-time

# Role filter
- Click role buttons to filter
- Click again to remove filter

# Status filter
- Click Active/Inactive to filter
- Click again to remove filter

# Combined
- Use search + role + status together
```

### 4. Test Bulk Operations
```bash
# Select users
- Click checkboxes on multiple users
- Or click "select all" checkbox

# Bulk activate/deactivate
- Click "Activate" or "Deactivate" button
- Users update immediately
```

### 5. Test Export
```bash
# Export to CSV
- Click "Export" button
- CSV file downloads with current filtered users
```

## 🎯 Key Highlights

### Performance Optimizations
- **Server-side pagination**: Handles large datasets efficiently
- **Debounced search**: Prevents excessive API calls
- **Lazy loading**: Charts load independently
- **Memoized components**: Reduced re-renders

### Security Features
- **Role-based access control**: Enforced at API level
- **Tenant isolation**: School admins can't access other tenants
- **Password hashing**: All passwords securely hashed with bcrypt
- **Audit trail ready**: All operations can be logged

### User Experience
- **Real-time feedback**: Loading states and success messages
- **Error handling**: Clear error messages for all operations
- **Responsive design**: Works on mobile and desktop
- **Accessibility**: ARIA labels and keyboard navigation

## 🐛 Common Issues & Solutions

### Issue: Users not loading
**Solution**: Check if user has correct role permissions (super_admin or school_admin)

### Issue: Bulk operations not working
**Solution**: Ensure users are selected and you have permission for the operation

### Issue: Statistics not showing
**Solution**: Check database connection and ensure users table has data

### Issue: Search not working
**Solution**: Verify search parameter is being passed correctly to API

## 🔄 Future Enhancements

Potential features to add:
- [ ] Advanced user import/export (Excel, CSV with mapping)
- [ ] User activity timeline
- [ ] Email notifications for password resets
- [ ] User groups and tags
- [ ] Advanced permissions matrix
- [ ] User audit log viewer
- [ ] Bulk user creation from template
- [ ] User profile customization
- [ ] Integration with external auth providers

## 📝 Notes

- All timestamps are stored in UTC and displayed in user's local timezone
- Soft deletes preserve user data for audit purposes
- Role changes are logged for security
- Tenant isolation is enforced at database query level
- All API endpoints require authentication

## 🎉 Success Metrics

The system provides:
- **Complete user lifecycle management**
- **Comprehensive analytics and reporting**
- **Efficient bulk operations**
- **Role-based access control**
- **Responsive and accessible UI**
- **Export capabilities for reporting**

---

**Created**: 2024
**Last Updated**: 2024
**Maintained By**: UDrive LMS Team

