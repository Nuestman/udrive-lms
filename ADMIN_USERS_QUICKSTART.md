# Admin Users System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Start the Servers

```bash
# Start both frontend and backend
npm run dev

# OR start them separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### Step 2: Access the System

1. **Login as Super Admin**
   - Navigate to: `http://localhost:5173/login`
   - Use your super admin credentials
   - Or create a super admin if none exists

2. **Navigate to Users Management**
   - Click on "System Users" in the sidebar
   - Or go directly to: `http://localhost:5173/admin/users`

## 📊 What You'll See

### Dashboard Overview
```
┌─────────────────────────────────────────────────────────────┐
│  User Management                          [+ Add User]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Statistics Cards                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │  Total  │ │ Active  │ │Students │ │ Active  │         │
│  │  Users  │ │  Users  │ │  Count  │ │This Week│         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
│  📈 Analytics                                               │
│  ┌──────────────────────┐  ┌────────────────┐             │
│  │  Activity Chart      │  │ Role Dist.     │             │
│  │  (30 days)          │  │ Donut Chart    │             │
│  └──────────────────────┘  └────────────────┘             │
│                                                             │
│  🏆 Top Active Users                                        │
│  ┌─────────────────────────────────────────┐               │
│  │  [Avatar] John Doe - 25 enrollments    │               │
│  │  [Avatar] Jane Smith - 18 enrollments  │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  🔍 Search & Filters                                        │
│  ┌──────────┬────────────────────────────────────┐         │
│  │  Search  │ [Role] [Status] [Export]          │         │
│  └──────────┴────────────────────────────────────┘         │
│                                                             │
│  📋 Users Table                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☑ User    Role    Status  Last Login  Actions      │  │
│  │ □ John    Admin   Active   Today      ⋮            │  │
│  │ □ Jane    Student Active   Yesterday  ⋮            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  « Previous  [1] [2] [3] [4] [5]  Next »                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Actions

### Create a New User
1. Click "**+ Add User**" button (top right)
2. Fill in the form:
   ```
   First Name: John
   Last Name: Doe
   Email: john.doe@example.com
   Password: password123 (min 6 chars)
   Role: Student/Instructor/School Admin
   School: Select from dropdown (super admin only)
   Phone: +1234567890 (optional)
   Avatar URL: https://... (optional)
   ```
3. Click "**Create User**"

### Edit a User
1. Find the user in the table
2. Click the **⋮** (three dots) menu
3. Select "**Edit User**"
4. Update fields:
   - Name, Phone, Avatar URL
   - Role (super admin can change any role)
   - Active status checkbox
5. Click "**Save Changes**"

### Delete a User
1. Click the **⋮** menu on the user row
2. Select "**Delete User**"
3. Confirm in the dialog
4. User will be **deactivated** (soft delete)

### Reset User Password
1. Click the **⋮** menu
2. Select "**Reset Password**"
3. Either:
   - Type a new password
   - Click "**Generate Random Password**"
4. Confirm the password
5. Click "**Reset Password**"

### Bulk Operations
1. **Select users**:
   - Check individual boxes, or
   - Click the header checkbox to select all
2. **Choose action**:
   - Click "**Activate**" to activate selected users
   - Click "**Deactivate**" to deactivate selected users
3. Click "**Clear**" to deselect all

### Filter Users
1. **Search**: Type name or email in search box
2. **Role Filter**: Click role buttons
   - Super Admin
   - School Admin  
   - Instructor
   - Student
3. **Status Filter**: Click status buttons
   - Active
   - Inactive
4. **Export**: Click "Export" to download CSV

## 🔍 Understanding the Analytics

### Statistics Cards
- **Total Users**: All users in the system/tenant
- **Active Users**: Users with `is_active = true`
- **Students**: Count of student role users
- **Active This Week**: Users who logged in last 7 days

### Activity Chart
- Shows user registrations over last 30 days
- **Blue bars** = New students
- **Green bars** = New instructors
- Hover for daily breakdown

### Role Distribution
- **Donut chart** showing percentage by role
- Center shows total user count
- Legend with exact counts
- Active/Inactive breakdown at bottom

### Top Active Users
- Students ranked by enrollments
- Instructors ranked by courses created
- Shows engagement metrics

## 🧪 Testing Scenarios

### Scenario 1: Create Multiple Students
```bash
1. Click "Add User"
2. Create student: student1@test.com
3. Create student: student2@test.com
4. Create student: student3@test.com
5. Verify all appear in table
6. Check statistics update
```

### Scenario 2: Bulk Status Change
```bash
1. Select student1 and student2
2. Click "Deactivate"
3. Verify status changes to "Inactive"
4. Select them again
5. Click "Activate"
6. Verify status back to "Active"
```

### Scenario 3: Search & Filter
```bash
1. Type "john" in search
2. See filtered results
3. Click "Student" role filter
4. See only students named john
5. Click "Inactive" status filter
6. See only inactive students named john
7. Click filters again to clear
```

### Scenario 4: Export Users
```bash
1. Apply filters (role, status, search)
2. Click "Export" button
3. Check Downloads folder
4. Open CSV file
5. Verify correct users exported
```

### Scenario 5: Password Reset
```bash
1. Find a user
2. Click ⋮ > Reset Password
3. Click "Generate Random Password"
4. Copy the password shown
5. Click "Reset Password"
6. Test login with new password
```

## 🔐 Permission Matrix

| Action | Super Admin | School Admin | Instructor | Student |
|--------|------------|--------------|------------|---------|
| View all users | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Create user | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Edit user | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Delete user | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Reset password | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Bulk operations | ✅ | ✅ (tenant only) | ❌ | ❌ |
| Create super admin | ✅ | ❌ | ❌ | ❌ |
| Permanent delete | ✅ | ❌ | ❌ | ❌ |
| Export users | ✅ | ✅ | ❌ | ❌ |

## 🐛 Troubleshooting

### Problem: Can't see users page
**Solution**: 
- Ensure you're logged in as super_admin or school_admin
- Check role in profile: `/admin/settings`

### Problem: Statistics showing 0
**Solution**:
- Check database has users: `SELECT COUNT(*) FROM user_profiles;`
- Verify API is running: Check console for errors
- Refresh the page

### Problem: Bulk operations not working
**Solution**:
- Ensure users are selected (checkboxes checked)
- Check you have permission for the operation
- Look for error messages in red banner

### Problem: Search not working
**Solution**:
- Wait for debounce (500ms)
- Try refreshing the page
- Check network tab for API call

### Problem: Can't create super admin as school admin
**Solution**:
- This is by design for security
- Only super admins can create super admins
- Contact your super admin

## 💡 Pro Tips

1. **Quick Search**: Press `/` to focus search box
2. **Keyboard Navigation**: Use Tab to navigate form fields
3. **Copy Email**: Click on email to select and copy
4. **Filter Combos**: Combine search + role + status for precise results
5. **Export Filtered**: Export only exports filtered/searched users
6. **Pagination**: Use keyboard arrows to navigate pages
7. **Refresh Data**: Click role filter twice to refresh user list

## 📱 Mobile Usage

On mobile devices:
- Sidebar collapses to hamburger menu
- Table scrolls horizontally
- Charts stack vertically
- Modals are full-screen
- Touch-friendly buttons

## 🎨 Customization

### Change Page Size
```typescript
// In UsersPage.tsx
const { users } = useUsers({ limit: 50 }); // Default is 20
```

### Add Custom Filters
```typescript
// Add to updateFilters in UsersPage
updateFilters({ 
  role: 'student',
  customField: value 
});
```

### Modify Export Format
```typescript
// In UsersPage.tsx exportUsers function
const csv = [
  ['Email', 'Name', ...], // Add columns
  ...users.map(user => [...]) // Add data
].join('\n');
```

## 🔗 Related Documentation

- [Full System Documentation](./ADMIN_USERS_SYSTEM.md)
- [API Reference](./ADMIN_USERS_SYSTEM.md#-api-endpoints)
- [Database Schema](./database/schema.sql)
- [Authentication](./TEST_AUTHENTICATION.md)

## 🆘 Need Help?

1. Check [Common Issues](#-troubleshooting)
2. Review [Full Documentation](./ADMIN_USERS_SYSTEM.md)
3. Check console for errors (F12)
4. Review API responses in Network tab
5. Contact support team

---

**Quick Links**:
- Dashboard: `/admin/users`
- API Health: `http://localhost:3000/api/health`
- Create User: Click "+ Add User"
- View Stats: Scroll to analytics section

Happy User Management! 🎉

