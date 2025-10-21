# API Reference Documentation

## Overview

The SunLMS API provides a comprehensive RESTful interface for managing courses, users, progress, and all system functionality. The API follows REST conventions with JSON responses and includes comprehensive authentication and authorization, designed to support various industry-specific implementations.

## Base URL
```
Production: https://sunlms.com/api
Development: http://localhost:3001/api
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

*This API reference documentation is maintained alongside the codebase and reflects the current API implementation as of October 2025.*
