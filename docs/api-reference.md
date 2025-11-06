# API Reference Documentation

## Overview

The SunLMS API provides a comprehensive RESTful interface for managing courses, users, progress, and all system functionality. The API follows REST conventions with JSON responses and includes comprehensive authentication and authorization, designed to support various industry-specific implementations.

## Base URL Structure

### Current Implementation
```
Production: https://sunlms.com/api
Development: http://localhost:5000/api
```

### URL Architecture Best Practices

Our API follows the **industry best practice** of including `/api` in the base URL for the following reasons:

#### ✅ **Advantages of Current Approach:**
- **Cleaner frontend code** - No need to repeat `/api` in every API call
- **Consistent with modern frameworks** - Express.js, FastAPI, Next.js follow this pattern
- **Easier API versioning** - Can seamlessly switch to `/api/v2` by changing base URL
- **Less error-prone** - Developers can't forget to add `/api` prefix
- **Better for microservices** - Each service can have its own base URL with different paths
- **Enterprise-ready** - Better for API gateways and reverse proxies

#### 🔧 **Frontend Implementation:**
```javascript
// Environment variables
VITE_API_URL=http://localhost:5000/api

// Frontend API calls (clean and consistent)
api.get('/users')           // → http://localhost:5000/api/users
api.get('/notifications')   // → http://localhost:5000/api/notifications
api.post('/auth/login')     // → http://localhost:5000/api/auth/login
```

#### 🚫 **Alternative Approach (Not Recommended):**
```javascript
// Would require repetitive /api prefixes
VITE_API_URL=http://localhost:5000
api.get('/api/users')       // → http://localhost:5000/api/users
api.get('/api/notifications') // → http://localhost:5000/api/notifications
```

### Environment-Specific URLs
```javascript
// Development
VITE_API_URL=http://localhost:5000/api

// Staging  
VITE_API_URL=https://staging-api.udrive.com

// Production
VITE_API_URL=https://api.udrive.com
```

### Multiple API Services (Future)
```javascript
// Main API
VITE_API_URL=http://localhost:5000/api

// File upload service
VITE_UPLOAD_API_URL=http://localhost:5001/upload

// Analytics service  
VITE_ANALYTICS_API_URL=http://localhost:5002/analytics
```

## API Versioning Strategy

### Current Version: v1 (Implicit)
Currently, our API operates on version 1 without explicit versioning in the URL. This is common for initial API releases and works well for internal applications.

### Versioning Approaches

#### 1. **URL Path Versioning (Recommended)**
```
Current: https://api.udrive.com/api/users
v2:      https://api.udrive.com/api/v2/users
v3:      https://api.udrive.com/api/v3/users
```

**Implementation:**
```javascript
// Environment variables for different versions
VITE_API_URL_V1=http://localhost:5000/api
VITE_API_URL_V2=http://localhost:5000/api/v2

// Frontend usage
const apiV1 = new APIClient(VITE_API_URL_V1);
const apiV2 = new APIClient(VITE_API_URL_V2);
```

#### 2. **Header Versioning (Alternative)**
```http
GET /api/users
API-Version: v2
```

#### 3. **Query Parameter Versioning (Not Recommended)**
```
https://api.udrive.com/api/users?version=v2
```

### When API Versioning Becomes Necessary

#### 🚨 **Breaking Changes Requiring New Version:**

1. **Schema Changes:**
   ```json
   // v1 Response
   {
     "user": {
       "id": "123",
       "name": "John Doe"
     }
   }
   
   // v2 Response (Breaking change)
   {
     "user": {
       "id": "123",
       "firstName": "John",
       "lastName": "Doe"
     }
   }
   ```

2. **Endpoint Removal:**
   ```javascript
   // v1: Available
   GET /api/legacy-feature
   
   // v2: Removed (breaking change)
   // Endpoint no longer exists
   ```

3. **Authentication Changes:**
   ```javascript
   // v1: Basic JWT
   Authorization: Bearer <token>
   
   // v2: OAuth 2.0 + JWT
   Authorization: Bearer <oauth_token>
   X-API-Key: <api_key>
   ```

4. **Response Format Changes:**
   ```json
   // v1: Simple response
   {
     "success": true,
     "data": [...]
   }
   
   // v2: Enhanced response with metadata
   {
     "success": true,
     "data": [...],
     "meta": {
       "pagination": {...},
       "rateLimit": {...}
     }
   }
   ```

5. **HTTP Method Changes:**
   ```javascript
   // v1: POST for data retrieval
   POST /api/courses/search
   
   // v2: GET for data retrieval (RESTful)
   GET /api/courses?search=term
   ```

#### ✅ **Non-Breaking Changes (No Versioning Needed):**

1. **Adding New Fields:**
   ```json
   // v1: Basic user
   {
     "id": "123",
     "name": "John Doe"
   }
   
   // v1.1: Added field (backward compatible)
   {
     "id": "123",
     "name": "John Doe",
     "email": "john@example.com"  // New field
   }
   ```

2. **Adding New Endpoints:**
   ```javascript
   // v1: Existing endpoints
   GET /api/users
   POST /api/users
   
   // v1.1: New endpoints (backward compatible)
   GET /api/users/search
   GET /api/users/analytics
   ```

3. **Optional Parameters:**
   ```javascript
   // v1: Basic endpoint
   GET /api/courses
   
   // v1.1: Added optional parameters
   GET /api/courses?status=published&limit=10
   ```

### Versioning Implementation Strategy

#### **Phase 1: Current State (v1 Implicit)**
```javascript
// Current implementation
VITE_API_URL=http://localhost:5000/api
```

#### **Phase 2: Explicit v1 (Migration)**
```javascript
// Add explicit v1 versioning
VITE_API_URL=http://localhost:5000/api/v1

// Backward compatibility
app.use('/api', v1Routes);        // Legacy support
app.use('/api/v1', v1Routes);     // Explicit v1
```

#### **Phase 3: v2 Development**
```javascript
// Parallel development
VITE_API_URL_V1=http://localhost:5000/api/v1
VITE_API_URL_V2=http://localhost:5000/api/v2

// Server routing
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

#### **Phase 4: v1 Deprecation**
```javascript
// Deprecation headers
app.use('/api/v1', (req, res, next) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', '2025-12-31');
  res.set('Link', '</api/v2>; rel="successor-version"');
  next();
}, v1Routes);
```

### Version Lifecycle Management

#### **Version Support Timeline:**
```
v1: 2024-01-01 → 2025-12-31 (24 months)
v2: 2025-01-01 → 2027-12-31 (36 months)
v3: 2027-01-01 → 2030-12-31 (36 months)
```

#### **Deprecation Process:**
1. **Announcement** (6 months before deprecation)
2. **Warning Headers** (3 months before deprecation)
3. **Sunset Date** (Final deprecation)
4. **Grace Period** (30 days after sunset)

### Real-World Examples

#### **GitHub API Versioning:**
```
https://api.github.com/user          // v3 (default)
https://api.github.com/v4/graphql    // v4 (GraphQL)
```

#### **Stripe API Versioning:**
```
https://api.stripe.com/v1/charges    // v1
https://api.stripe.com/v2/charges    // v2
```

#### **Twitter API Versioning:**
```
https://api.twitter.com/1.1/statuses/update.json  // v1.1
https://api.twitter.com/2/tweets                   // v2
```

### Best Practices for Our API

#### **1. Semantic Versioning for API Changes:**
- **Major (v2.0.0)**: Breaking changes
- **Minor (v1.1.0)**: New features, backward compatible
- **Patch (v1.0.1)**: Bug fixes, backward compatible

#### **2. Version Communication:**
```http
# Response headers
API-Version: v1
API-Supported-Versions: v1, v2
API-Deprecated-Versions: v1
```

#### **3. Client-Side Version Management:**
```javascript
// API client with version support
class UDriveAPI {
  constructor(baseURL, version = 'v1') {
    this.baseURL = `${baseURL}/${version}`;
    this.version = version;
  }
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'API-Version': this.version,
        ...options.headers
      }
    });
    
    // Check for deprecation warnings
    if (response.headers.get('Deprecation') === 'true') {
      console.warn(`API version ${this.version} is deprecated`);
    }
    
    return response;
  }
}
```

#### **4. Migration Strategy:**
```javascript
// Gradual migration approach
const apiClient = new UDriveAPI('http://localhost:5000/api', 'v1');

// Feature flags for new version testing
if (featureFlags.useV2API) {
  apiClient.setVersion('v2');
}
```

### When to Implement Versioning

#### **Immediate Implementation Needed:**
- Breaking changes to existing endpoints
- Major authentication system changes
- Database schema changes affecting API responses
- Third-party integrations requiring stable APIs

#### **Future Implementation:**
- Mobile app requiring long-term API stability
- Public API for third-party developers
- Enterprise customers with strict compatibility requirements
- Regulatory compliance requiring API stability

## API Client Implementation

### Current Frontend API Client

Our frontend uses a centralized API client that handles URL construction, authentication, and error handling automatically.

#### **API Client Features:**
```javascript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Automatic double /api prevention
const shouldStripLeadingApi = API_URL.endsWith('/api') && endpoint.startsWith('/api/');
const normalizedEndpoint = shouldStripLeadingApi ? endpoint.slice(4) : endpoint;

// Automatic authentication headers
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
}
```

#### **Usage Examples:**
```javascript
import { get, post, put, del } from '../lib/api';

// GET request
const users = await get('/users');

// POST request with data
const newUser = await post('/users', {
  email: 'user@example.com',
  name: 'John Doe'
});

// PUT request
const updatedUser = await put('/users/123', {
  name: 'Jane Doe'
});

// DELETE request
await del('/users/123');
```

#### **FormData Support:**
```javascript
// File upload with FormData
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'avatar');

const response = await post('/upload/avatar', formData);
// Automatically handles Content-Type for FormData
```

### Error Handling

#### **Automatic Error Handling:**
```javascript
try {
  const data = await get('/users');
  // Handle success
} catch (error) {
  // Automatic error handling
  console.error('API Error:', error.message);
}
```

#### **Response Format:**
```javascript
// Success response
{
  success: true,
  data: { ... },
  message: "Optional success message"
}

// Error response
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details: { ... }
}
```

### Best Practices for API Usage

#### **1. Consistent Error Handling:**
```javascript
// Good: Centralized error handling
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
};

// Usage
const result = await handleApiCall(() => get('/users'));
if (result.success) {
  setUsers(result.data);
} else {
  showError(result.error);
}
```

#### **2. Loading States:**
```javascript
const [loading, setLoading] = useState(false);

const fetchUsers = async () => {
  setLoading(true);
  try {
    const users = await get('/users');
    setUsers(users.data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

#### **3. TypeScript Support:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

// Typed API calls
const users = await get<User[]>('/users');
const newUser = await post<User>('/users', userData);
```

#### **4. Request/Response Interceptors:**
```javascript
// Future enhancement: Add interceptors for logging, retries, etc.
class APIClient {
  constructor() {
    this.interceptors = {
      request: [],
      response: []
    };
  }
  
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }
  
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }
}
```

### API Client Configuration

#### **Environment Variables:**
```bash
# .env.development
VITE_API_URL=http://localhost:5000/api

# .env.production
VITE_API_URL=https://api.udrive.com

# .env.staging
VITE_API_URL=https://staging-api.udrive.com
```

#### **Multiple API Services:**
```javascript
// Future: Support for multiple API services
const mainAPI = new APIClient(import.meta.env.VITE_API_URL);
const uploadAPI = new APIClient(import.meta.env.VITE_UPLOAD_API_URL);
const analyticsAPI = new APIClient(import.meta.env.VITE_ANALYTICS_API_URL);
```

### Migration from Manual Fetch

#### **Before (Manual Fetch):**
```javascript
// ❌ Manual fetch with potential issues
const response = await fetch('/api/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  throw new Error('Failed to fetch users');
}

const data = await response.json();
```

#### **After (API Client):**
```javascript
// ✅ Clean API client usage
const data = await get('/users');
```

### Performance Optimizations

#### **1. Request Deduplication:**
```javascript
// Future: Prevent duplicate requests
const requestCache = new Map();

const deduplicatedGet = async (endpoint) => {
  if (requestCache.has(endpoint)) {
    return requestCache.get(endpoint);
  }
  
  const promise = get(endpoint);
  requestCache.set(endpoint, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    requestCache.delete(endpoint);
  }
};
```

#### **2. Request Cancellation:**
```javascript
// Future: Support for request cancellation
const controller = new AbortController();

const cancelableGet = async (endpoint) => {
  return get(endpoint, {
    signal: controller.signal
  });
};

// Cancel request if component unmounts
useEffect(() => {
  return () => controller.abort();
}, []);
```

## Authentication

### JWT Token Authentication
All API endpoints (except login/register) require a valid JWT token in the request header:

```http
Authorization: Bearer <jwt_token>
```

### Cookie Authentication
Tokens are also accepted via secure HTTP-only cookies for web clients.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Authentication Endpoints

### POST /auth/login
Authenticate user and return JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "student",
      "tenant_id": "uuid"
    },
    "token": "jwt_token"
  }
}
```

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "tenant_id": "uuid",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "student"
    }
  }
}
```

### POST /auth/logout
Logout user and invalidate token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "tenant_id": "uuid",
    "profile": {
      "first_name": "John",
      "last_name": "Doe",
      "avatar_url": "https://..."
    }
  }
}
```

## User Management Endpoints

### GET /users
Get list of users (admin only).

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of users per page
- `role` (optional): Filter by user role
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "student",
        "is_active": true,
        "profile": {
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### POST /users
Create a new user (admin only).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe"
}
```

### GET /users/:id
Get user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "profile": {
      "first_name": "John",
      "last_name": "Doe",
      "avatar_url": "https://..."
    }
  }
}
```

### PUT /users/:id
Update user information.

**Request:**
```json
{
  "email": "newemail@example.com",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

### DELETE /users/:id
Delete user account (admin only).

## Course Management Endpoints

### GET /courses
Get list of courses.

**Query Parameters:**
- `status` (optional): Filter by course status
- `search` (optional): Search by title or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "thumbnail_url": "https://...",
      "status": "published",
      "modules_count": 5,
      "enrolled": true
    }
  ]
}
```

### POST /courses
Create a new course (instructor/admin only).

**Request:**
```json
{
  "title": "New Course",
  "description": "Course description",
  "thumbnail_url": "https://..."
}
```

### GET /courses/:id
Get course details with modules.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming",
    "modules": [
      {
        "id": "uuid",
        "title": "Module 1: Basics",
        "order_index": 1,
        "lessons": [...],
        "quizzes": [...]
      }
    ]
  }
}
```

### PUT /courses/:id
Update course information.

### DELETE /courses/:id
Delete course (admin only).

## Module Management Endpoints

### GET /modules/:courseId
Get modules for a course.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Module 1: Basics",
      "description": "Introduction to the basics",
      "order_index": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "Lesson 1.1",
          "order_index": 1
        }
      ],
      "quizzes": [
        {
          "id": "uuid",
          "title": "Quiz 1.1",
          "order_index": 2
        }
      ]
    }
  ]
}
```

### POST /modules
Create a new module.

**Request:**
```json
{
  "course_id": "uuid",
  "title": "New Module",
  "description": "Module description",
  "order_index": 1
}
```

## Lesson Management Endpoints

### GET /lessons/:id
Get lesson content.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lesson Title",
    "content": "<p>Rich HTML content</p>",
    "estimated_duration_minutes": 30,
    "order_index": 1,
    "module": {
      "id": "uuid",
      "title": "Module Title"
    }
  }
}
```

### POST /lessons
Create a new lesson.

**Request:**
```json
{
  "module_id": "uuid",
  "title": "New Lesson",
  "content": "<p>Lesson content</p>",
  "estimated_duration_minutes": 30
}
```

### PUT /lessons/:id
Update lesson content.

### DELETE /lessons/:id
Delete lesson.

## Quiz Management Endpoints

### GET /quizzes/:id
Get quiz details with questions.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Quiz Title",
    "description": "Quiz description",
    "time_limit_minutes": 30,
    "max_attempts": 3,
    "passing_score": 70,
    "questions": [
      {
        "id": "uuid",
        "question_text": "What is 2+2?",
        "question_type": "multiple_choice",
        "options": ["3", "4", "5", "6"],
        "correct_answer": "4",
        "points": 1
      }
    ]
  }
}
```

### POST /quizzes
Create a new quiz.

**Request:**
```json
{
  "module_id": "uuid",
  "title": "New Quiz",
  "description": "Quiz description",
  "time_limit_minutes": 30,
  "max_attempts": 3,
  "passing_score": 70,
  "questions": [
    {
      "question_text": "What is 2+2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4",
      "points": 1
    }
  ]
}
```

### POST /quizzes/:id/attempts
Submit quiz attempt.

**Request:**
```json
{
  "answers": {
    "question_id_1": "answer_1",
    "question_id_2": "answer_2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "score": 85,
    "passed": true,
    "time_taken_seconds": 1200
  }
}
```

### GET /quizzes/:id/attempts
Get student's quiz attempts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "score": 85,
      "time_taken_seconds": 1200,
      "completed_at": "2024-12-01T10:30:00Z"
    }
  ]
}
```

## Progress Management Endpoints

### GET /progress/student/:studentId
Get student's overall progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_courses": 5,
    "completed_courses": 2,
    "total_progress": 65,
    "courses": [
      {
        "course_id": "uuid",
        "title": "Course Title",
        "progress_percentage": 80
      }
    ]
  }
}
```

### GET /progress/course/:courseId/student/:studentId/unified
Get unified course progress (lessons + quizzes).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "module_id": "uuid",
      "module_title": "Module Title",
      "total_lessons": 5,
      "total_quizzes": 2,
      "completed_lessons": 4,
      "completed_quizzes": 1,
      "progress_percentage": 71,
      "content": [
        {
          "content_id": "uuid",
          "title": "Lesson Title",
          "type": "lesson",
          "completed": true,
          "completed_at": "2024-12-01T10:30:00Z"
        }
      ]
    }
  ]
}
```

### POST /progress/lesson/:contentId/complete
Mark content as complete (works for lessons and quizzes).

**Response:**
```json
{
  "success": true,
  "data": {
    "progress_record": {
      "id": "uuid",
      "content_id": "uuid",
      "content_type": "lesson",
      "status": "completed",
      "completed_at": "2024-12-01T10:30:00Z"
    },
    "enrollment_progress": {
      "course_progress": 75,
      "module_completed": false,
      "course_completed": false
    }
  }
}
```

### POST /progress/lesson/:contentId/incomplete
Mark content as incomplete.

## Enrollment Endpoints

### GET /enrollments
Get all enrollments with optional filtering.

**Query Parameters:**
- `student_id` (optional): Filter by student ID
- `course_id` (optional): Filter by course ID
- `status` (optional): Filter by enrollment status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "course_title": "Course Title",
      "student_id": "uuid",
      "student_name": "Student Name",
      "enrolled_at": "2024-12-01T10:30:00Z",
      "progress_percentage": 75,
      "status": "active"
    }
  ]
}
```

### GET /enrollments/student/:studentId
Get student's enrollments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "course_title": "Course Title",
      "enrolled_at": "2024-12-01T10:30:00Z",
      "progress_percentage": 75,
      "status": "active"
    }
  ]
}
```

### POST /enrollments
Enroll user in course (supports dual-role enrollment).

**Request:**
```json
{
  "course_id": "uuid",
  "student_id": "uuid" // Optional - defaults to current user if not provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "student_id": "uuid",
    "enrolled_at": "2024-12-01T10:30:00Z",
    "status": "active",
    "progress_percentage": 0
  },
  "message": "User enrolled successfully"
}
```

### PUT /enrollments/:id/status
Update enrollment status.

**Request:**
```json
{
  "status": "active" | "completed" | "suspended"
}
```

### PUT /enrollments/:id/progress
Update enrollment progress.

**Request:**
```json
{
  "progress_percentage": 75
}
```

### DELETE /enrollments/:id
Delete enrollment.

## Contact Messages Endpoints

### POST /api/contact
Submit a contact message from the public landing page (no authentication required).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about pricing",
  "message": "I would like to know more about your pricing plans."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about pricing",
    "message": "I would like to know more about your pricing plans.",
    "status": "new",
    "is_read": false,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "Contact message submitted successfully"
}
```

### GET /api/contact/messages
Get all contact messages (Super Admin only). Supports filtering, search, and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (new, read, replied, archived)
- `is_read` (optional): Filter by read status (true/false)
- `search` (optional): Search in name, email, subject, or message
- `limit` (optional): Number of messages per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Question about pricing",
      "message": "I would like to know more...",
      "status": "new",
      "is_read": false,
      "created_at": "2025-01-15T10:30:00Z",
      "reply_count": 0,
      "replied_by_name": null,
      "replied_by_email": null
    }
  ]
}
```

### GET /api/contact/messages/stats
Get contact message statistics (Super Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "new_count": 25,
    "read_count": 80,
    "replied_count": 40,
    "archived_count": 5,
    "unread_count": 30
  }
}
```

### GET /api/contact/messages/:id
Get a single contact message with all replies (Super Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about pricing",
    "message": "I would like to know more...",
    "status": "replied",
    "is_read": true,
    "created_at": "2025-01-15T10:30:00Z",
    "replied_at": "2025-01-15T11:00:00Z",
    "replied_by": "admin-uuid",
    "replied_by_name": "System Admin",
    "replied_by_email": "admin@sunlms.com",
    "reply_count": 1,
    "replies": [
      {
        "id": "reply-uuid",
        "contact_message_id": "uuid",
        "replied_by": "admin-uuid",
        "reply_message": "Thank you for your inquiry...",
        "created_at": "2025-01-15T11:00:00Z",
        "replied_by_name": "System Admin",
        "replied_by_email": "admin@sunlms.com"
      }
    ]
  }
}
```

### PUT /api/contact/messages/:id/read
Mark a contact message as read (Super Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_read": true,
    "status": "read"
  },
  "message": "Message marked as read"
}
```

### POST /api/contact/messages/:id/reply
Reply to a contact message (Super Admin only). Sends email notification to original sender.

**Request:**
```json
{
  "reply_message": "Thank you for your inquiry. We'll get back to you soon."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": {
      "id": "reply-uuid",
      "contact_message_id": "uuid",
      "replied_by": "admin-uuid",
      "reply_message": "Thank you for your inquiry...",
      "created_at": "2025-01-15T11:00:00Z"
    },
    "contactMessage": {
      "id": "uuid",
      "status": "replied",
      "replied_at": "2025-01-15T11:00:00Z"
    }
  },
  "message": "Reply sent successfully"
}
```

### PUT /api/contact/messages/:id/status
Update contact message status (Super Admin only).

**Request:**
```json
{
  "status": "archived"
}
```

**Valid Status Values:**
- `new` - Newly received message
- `read` - Message has been read
- `replied` - Message has been replied to
- `archived` - Message archived

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "archived"
  },
  "message": "Status updated successfully"
}
```

**Note:** Contact messages are system-level and accessible only to super administrators. School admins (tenant-level) do not have access to contact messages.

## File Upload Endpoints

### POST /upload/avatar
Upload user avatar.

**Request:** Multipart form data with `avatar` file field.

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/avatar.jpg"
  }
}
```

### POST /upload/course-thumbnail
Upload course thumbnail.

**Request:** Multipart form data with `thumbnail` file field.

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid authentication token
- `AUTH_EXPIRED`: Authentication token expired
- `AUTH_INSUFFICIENT_PERMISSIONS`: Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Invalid data format
- `DUPLICATE_ENTRY`: Duplicate entry exists

### Resource Errors
- `RESOURCE_NOT_FOUND`: Resource not found
- `RESOURCE_ALREADY_EXISTS`: Resource already exists
- `RESOURCE_ACCESS_DENIED`: Access denied to resource
- `RESOURCE_CONFLICT`: Resource conflict

### System Errors
- `INTERNAL_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `FILE_UPLOAD_ERROR`: File upload failed
- `EXTERNAL_SERVICE_ERROR`: External service error

## Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## Webhooks (Future)

### Events
- `user.created`: User account created
- `course.completed`: Course completed by student
- `quiz.submitted`: Quiz attempt submitted
- `progress.updated`: Progress updated

### Webhook Payload
```json
{
  "event": "course.completed",
  "timestamp": "2024-12-01T10:30:00Z",
  "data": {
    "student_id": "uuid",
    "course_id": "uuid",
    "completed_at": "2024-12-01T10:30:00Z"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @udrive-lms/api-client
```

```javascript
import { UDriveAPI } from '@udrive-lms/api-client';

const api = new UDriveAPI({
  baseURL: 'https://api.udrive-lms.com',
  token: 'your-jwt-token'
});

const courses = await api.courses.list();
```

### Python
```bash
pip install udrive-lms-api
```

```python
from udrive_lms import UDriveAPI

api = UDriveAPI(
    base_url='https://api.udrive-lms.com',
    token='your-jwt-token'
)

courses = api.courses.list()
```

## Implementation Status

### ✅ Fully Implemented
- Authentication endpoints
- User management
- Course management
- Lesson management
- Quiz management
- Progress tracking
- File uploads
- Contact messages (public form and admin management)

### 🚧 Partially Implemented
- Advanced search and filtering
- Bulk operations
- Webhook system
- Rate limiting (basic implementation)

### 📋 Planned
- GraphQL API
- Real-time subscriptions
- Advanced analytics endpoints
- Mobile-specific endpoints
- Third-party integrations

---

*This API reference documentation is maintained alongside the codebase and reflects the current API implementation as of November 2025.*
