# Authentication System Documentation

## Overview

The SunLMS Authentication System provides secure, multi-tenant user authentication and authorization. It supports multiple user roles with granular permissions and ensures complete data isolation between tenants (organizations across various industries).

## Key Features

### 🔐 Multi-Tenant Authentication
- **Tenant Isolation**: Complete data separation between organizations
- **Role-Based Access Control**: Super Admin, Tenant Admin, Instructor, Student roles
- **Secure Session Management**: JWT-based authentication with secure cookies
- **Password Security**: Bcrypt hashing with salt rounds

### 🛡️ Security Features
- **JWT Tokens**: Secure, stateless authentication
- **HTTP-Only Cookies**: XSS protection for session tokens
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Validation**: Server-side validation for all authentication inputs
- **Rate Limiting**: Protection against brute force attacks

### 👥 User Management
- **User Registration**: Secure user account creation
- **Profile Management**: Comprehensive user profile system
- **Password Reset**: Secure password reset flow
- **Account Activation**: Email-based account verification

## Architecture

### Authentication Flow

```
User Login → Credential Validation → JWT Generation → Secure Cookie Storage → Request Authentication
```

### Authorization Levels

#### 1. Super Admin
- **Access**: Full system access across all tenants
- **Permissions**: 
  - Create and manage tenants
  - Access all tenant data
  - System-wide configuration
  - User management across tenants

#### 2. Tenant Admin
- **Access**: Full access within their organization
- **Permissions**:
  - Manage users within tenant
  - Configure tenant settings
  - Access all courses and content
  - Generate reports and analytics

#### 3. Instructor
- **Access**: Course and content management
- **Permissions**:
  - Create and manage courses
  - Manage students in their courses
  - Create lessons and quizzes
  - View student progress

#### 4. Student
- **Access**: Learning content only
- **Permissions**:
  - Enroll in courses
  - Access assigned content
  - Track personal progress
  - Submit assignments and quizzes

## Database Schema

### Core Authentication Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'instructor', 'student')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### user_profiles
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### tenants
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Components

### Authentication Components

#### LoginForm
```typescript
interface LoginFormProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
}
```

**Features:**
- Email and password validation
- Remember me functionality
- Error handling and display
- Loading states
- Responsive design

#### RegisterForm
```typescript
interface RegisterFormProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
  tenantId?: string;
}
```

**Features:**
- Form validation
- Password strength checking
- Email verification
- Terms and conditions acceptance
- Role-based registration

#### PasswordResetForm
```typescript
interface PasswordResetFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}
```

**Features:**
- Email validation
- Reset token handling
- New password confirmation
- Security requirements
- Success feedback

### User Management Components

#### UserProfile
```typescript
interface UserProfileProps {
  user: User;
  onUpdate: (updates: Partial<UserProfile>) => void;
  editable?: boolean;
}
```

**Features:**
- Profile information display
- Avatar upload
- Form validation
- Auto-save functionality
- Permission-based editing

#### UserList
```typescript
interface UserListProps {
  users: User[];
  onUserUpdate: (user: User) => void;
  onUserDelete: (userId: string) => void;
  currentUserRole: string;
}
```

**Features:**
- User listing with pagination
- Role-based actions
- Search and filtering
- Bulk operations
- Export functionality

## Backend Services

### Authentication Service (`server/services/auth.service.js`)

#### Core Functions
```javascript
// User authentication
async function authenticateUser(email, password, tenantId)
async function generateJWT(user)
async function verifyJWT(token)

// User management
async function createUser(userData, tenantId)
async function updateUser(userId, updates, tenantId)
async function deleteUser(userId, tenantId)
async function getUserById(userId, tenantId)

// Password management
async function hashPassword(password)
async function comparePassword(password, hash)
async function generatePasswordResetToken(userId)
async function resetPassword(token, newPassword)

// Session management
async function createSession(userId, tenantId)
async function destroySession(sessionId)
async function validateSession(sessionId)
```

### User Service (`server/services/user.service.js`)

#### Profile Management
```javascript
// Profile operations
async function createUserProfile(userId, profileData)
async function updateUserProfile(userId, updates)
async function getUserProfile(userId)
async function deleteUserProfile(userId)

// Avatar management
async function uploadAvatar(userId, file)
async function deleteAvatar(userId)
async function getAvatarUrl(userId)
```

### Tenant Service (`server/services/tenant.service.js`)

#### Tenant Management
```javascript
// Tenant operations
async function createTenant(tenantData)
async function updateTenant(tenantId, updates)
async function getTenantById(tenantId)
async function deleteTenant(tenantId)

// Tenant settings
async function updateTenantSettings(tenantId, settings)
async function getTenantSettings(tenantId)
```

## Middleware

### Authentication Middleware (`server/middleware/auth.middleware.js`)

```javascript
// JWT verification
function requireAuth(req, res, next) {
  // Verify JWT token
  // Extract user information
  // Attach user to request object
}

// Role-based authorization
function requireRole(roles) {
  return (req, res, next) => {
    // Check user role against required roles
    // Allow or deny access
  };
}

// Permission checking
function requirePermission(permission) {
  return (req, res, next) => {
    // Check specific permission
    // Allow or deny access
  };
}
```

### Tenant Middleware (`server/middleware/tenant.middleware.js`)

```javascript
// Tenant context injection
function tenantContext(req, res, next) {
  // Extract tenant from user or request
  // Inject tenant context
  // Set tenant isolation
}

// Tenant validation
function validateTenant(req, res, next) {
  // Validate tenant access
  // Check tenant status
  // Allow or deny access
}
```

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login              # User login
POST   /api/auth/register           # User registration
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh JWT token
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with token
GET    /api/auth/me                 # Get current user
```

### User Management Endpoints
```
GET    /api/users                   # Get users (admin only)
POST   /api/users                   # Create user (admin only)
GET    /api/users/:id               # Get user by ID
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user
GET    /api/users/:id/profile       # Get user profile
PUT    /api/users/:id/profile       # Update user profile
POST   /api/users/:id/avatar        # Upload avatar
```

### Tenant Management Endpoints
```
GET    /api/tenants                 # Get tenants (super admin only)
POST   /api/tenants                 # Create tenant (super admin only)
GET    /api/tenants/:id             # Get tenant by ID
PUT    /api/tenants/:id             # Update tenant
DELETE /api/tenants/:id             # Delete tenant
GET    /api/tenants/:id/settings    # Get tenant settings
PUT    /api/tenants/:id/settings    # Update tenant settings
```

## Security Implementation

### Password Security
```javascript
// Password hashing with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation
const isValid = await bcrypt.compare(password, hashedPassword);
```

### JWT Implementation
```javascript
// JWT generation
const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email, 
    role: user.role, 
    tenantId: user.tenant_id 
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// JWT verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Cookie Security
```javascript
// Secure cookie configuration
res.cookie('auth_token', token, {
  httpOnly: true,        // Prevent XSS
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

## User Flows

### 1. User Registration Flow
```
User → Fill Form → Validation → Account Creation → Email Verification → Login
```

**Detailed Steps:**
1. User accesses registration page
2. Fills out registration form with required information
3. System validates input data
4. Password is hashed and stored
5. User account is created with 'pending' status
6. Verification email is sent
7. User clicks verification link
8. Account is activated
9. User can now login

### 2. User Login Flow
```
User → Enter Credentials → Validation → JWT Generation → Cookie Storage → Dashboard
```

**Detailed Steps:**
1. User enters email and password
2. System validates credentials
3. JWT token is generated
4. Token is stored in secure HTTP-only cookie
5. User is redirected to appropriate dashboard
6. Subsequent requests include authentication

### 3. Password Reset Flow
```
User → Request Reset → Email Sent → Click Link → Enter New Password → Login
```

**Detailed Steps:**
1. User requests password reset
2. System generates secure reset token
3. Reset email is sent with token link
4. User clicks link and enters new password
5. Password is updated and token is invalidated
6. User can login with new password

### 4. Role-Based Access Flow
```
Request → JWT Verification → Role Check → Permission Validation → Access Granted/Denied
```

**Detailed Steps:**
1. User makes authenticated request
2. JWT token is verified
3. User role is extracted from token
4. Required permissions are checked
5. Access is granted or denied based on role
6. Appropriate response is returned

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
```

### Security Headers
```javascript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## Performance Considerations

### Database Optimization
- **Indexed Queries**: Optimized indexes for user lookups
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimized authentication queries

### Caching Strategy
- **Session Caching**: Redis for session storage (future)
- **User Data Caching**: Strategic caching of user information
- **Token Validation**: Efficient JWT verification

### Security Performance
- **Rate Limiting**: Protection against brute force attacks
- **Token Expiration**: Automatic token cleanup
- **Session Management**: Efficient session handling

## Troubleshooting

### Common Issues

#### Login Failures
- **Check**: Email and password are correct
- **Check**: User account is active
- **Check**: Tenant access is valid
- **Check**: No database connection issues

#### Token Expiration
- **Check**: JWT expiration time
- **Check**: System clock synchronization
- **Check**: Token refresh mechanism

#### Permission Denied
- **Check**: User role and permissions
- **Check**: Tenant isolation rules
- **Check**: Resource access rights

### Debug Information
- **Authentication Logs**: Detailed login attempt logs
- **Token Validation**: JWT verification logs
- **Permission Checks**: Authorization decision logs
- **Database Queries**: User lookup query logs

## Future Enhancements

### Planned Features
- **Two-Factor Authentication**: SMS and TOTP support
- **Social Login**: Google, Microsoft, and other providers
- **Single Sign-On (SSO)**: SAML and OAuth integration
- **Advanced Permissions**: Granular permission system
- **Audit Logging**: Comprehensive activity tracking
- **Account Lockout**: Brute force protection
- **Password Policies**: Configurable password requirements

### Security Improvements
- **Advanced Threat Detection**: Anomaly detection
- **Device Management**: Trusted device tracking
- **Location-Based Security**: Geographic access control
- **Biometric Authentication**: Fingerprint and face recognition

---

*This documentation reflects the current authentication system implementation as of December 2024. For the latest updates, refer to the system changelog.*
