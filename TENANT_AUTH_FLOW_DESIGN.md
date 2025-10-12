# 🔐 Tenant-Aware Authentication Flow

## Problem Statement

Current auth signup requires `tenant_id` (subdomain), but we need to handle:
1. **Super admin creation** (no tenant needed)
2. **First school creation** (create tenant + first admin)
3. **Subsequent users** (join existing tenant via subdomain)

---

## Proposed Solution

### Option A: Dual Signup Flows (Recommended)

#### Flow 1: Super Admin Signup (No Tenant)
```
Path: /signup/super-admin
Requires: Email, Password, Name
Creates: Super admin user with tenant_id = NULL
Use Case: System initialization only
```

#### Flow 2: School Creation Signup (First User)
```
Path: /signup/school
Requires: 
  - School name
  - School subdomain
  - Admin email, password, name
Creates: 
  1. New tenant/school
  2. School admin user linked to that tenant
Use Case: New school registration
```

#### Flow 3: Regular Signup (Join Existing School)
```
Path: /signup
Requires:
  - Subdomain (to identify school)
  - Email, password, name
  - Role (student/instructor)
Creates:
  - User linked to existing tenant
Use Case: Students and instructors joining existing school
```

---

### Option B: Smart Single Signup (Alternative)

Single signup endpoint that:
1. Checks if subdomain exists
2. If NO → Create tenant + user as school_admin
3. If YES → Create user in existing tenant

---

## Implementation Plan

### Backend Changes:

**1. Update Auth Service** (`server/services/auth.service.js`):
```javascript
// New: Super admin signup (no tenant)
export async function signupSuperAdmin(userData) {
  // Only allow if no super admin exists (security)
  // Create user with tenant_id = NULL
}

// New: School creation signup
export async function signupWithSchool(userData, schoolData) {
  // Create tenant first
  // Then create school_admin user
  // Return both
}

// Updated: Regular signup
export async function signup(userData) {
  // Verify tenant exists
  // Create user in tenant
  // Validate subdomain
}
```

**2. New Auth Routes** (`server/routes/auth.js`):
```javascript
POST /api/auth/signup/super-admin
POST /api/auth/signup/school  // Create school + first admin
POST /api/auth/signup         // Join existing school
```

### Frontend Changes:

**1. New Signup Pages**:
```
src/components/pages/Auth/
├── SignupPage.tsx (existing - for joining school)
├── SignupSchoolPage.tsx (new - create school)
└── SignupSuperAdminPage.tsx (new - super admin only)
```

**2. Update Routes** (`src/App.tsx`):
```javascript
<Route path="/signup" element={<SignupPage />} />
<Route path="/signup/school" element={<SignupSchoolPage />} />
<Route path="/signup/super-admin" element={<SignupSuperAdminPage />} />
```

---

## User Experience Flow

### Scenario 1: New System (No Schools)
```
1. Visit /signup/super-admin
2. Create super admin account
3. Login as super admin
4. Go to "Schools" → Create first school
5. Share school signup link with school admin
```

### Scenario 2: New School Registration
```
1. Visit /signup/school
2. Fill:
   - School Name: "Elite Driving Academy"
   - Subdomain: "elite-driving"
   - Your Name, Email, Password
3. Submit
4. Creates: School + You as school_admin
5. Auto-login to your new school
6. Share subdomain with students/instructors
```

### Scenario 3: Join Existing School
```
1. Visit /signup
2. Enter subdomain: "elite-driving"
3. Fill: Name, Email, Password, Role
4. Submit
5. Creates: User account in that school
6. Login to school
```

---

## Security Considerations

### Super Admin Signup:
- ⚠️ Should be restricted (only first super admin OR via existing super admin)
- Check: No super admin exists OR requester is super admin
- Alternative: Create via database seed, disable public signup

### School Creation Signup:
- ✅ Anyone can create a new school
- Validates unique subdomain
- Creates school_admin role automatically
- School is active by default

### Regular Signup:
- ✅ Must provide valid subdomain
- Validates tenant exists
- Defaults to 'student' role
- Can specify 'instructor' if school allows

---

## Implementation Priority

### High Priority (Immediate):
1. ✅ School creation signup flow
2. ✅ Update regular signup to validate subdomain
3. ✅ Subdomain validation in signup

### Medium Priority:
4. Super admin signup (or keep as database-only)
5. Email verification (optional)
6. Approval workflow for instructors

### Low Priority:
7. School registration approval
8. Invitation links
9. SSO integration

---

## Recommended Approach

**For Now:**
1. Create super admin via database (manual)
2. Implement school creation signup (/signup/school)
3. Regular signup validates existing subdomain

**Benefits:**
- Secure (super admin not publicly accessible)
- Simple (two signup flows)
- Flexible (schools can self-register)
- Tenant-aware (subdomain-based)

---

## Next Steps

1. Implement `/api/auth/signup/school` endpoint
2. Create `SignupSchoolPage.tsx` component
3. Update regular signup to validate subdomain
4. Update landing page with "Create School" option
5. Test complete flow

---

**Ready to implement? This will complete the tenant-aware auth!** 🔐

