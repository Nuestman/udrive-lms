# Student Module Documentation

## Overview

The Student Module is the core learning experience component of SunLMS. It provides students with a comprehensive interface for accessing courses, taking lessons, completing quizzes, and tracking their learning progress across various industries. The module features a unified content model where lessons and quizzes are treated consistently for a seamless learning experience.

## Key Features

### 🎓 Learning Experience
- **Unified Content Model**: Lessons and quizzes share the same interface and completion flow
- **Progress Tracking**: Real-time progress updates across all learning content
- **Course Navigation**: Intuitive course and module navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 📚 Course Management
- **Course Enrollment**: Easy enrollment in available courses
- **Module Progression**: Sequential module completion with unlock system
- **Content Access**: Organized access to lessons and quizzes
- **Completion Tracking**: Visual progress indicators and completion status

### 🎯 Interactive Learning
- **Lesson Viewer**: Rich content display with media support
- **Quiz Engine**: Interactive quiz taking with immediate feedback
- **Mark as Complete**: Explicit completion marking for all content
- **Retake Functionality**: Quiz retaking with attempt tracking

### 📊 Progress Analytics
- **Course Progress**: Overall course completion percentage
- **Module Progress**: Individual module completion tracking
- **Content Progress**: Detailed lesson and quiz completion status
- **Time Tracking**: Time spent on learning activities

## Architecture

### Core Components

#### StudentDashboard
```typescript
interface StudentDashboardProps {
  studentId: string;
  onCourseSelect: (courseId: string) => void;
}
```

**Features:**
- Course enrollment overview
- Progress summaries
- Recent activity
- Quick access to continue learning
- Achievement displays

#### CourseViewer
```typescript
interface CourseViewerProps {
  courseId: string;
  studentId: string;
  onModuleSelect: (moduleId: string) => void;
}
```

**Features:**
- Course information display
- Module listing with progress
- Enrollment status
- Course navigation
- Progress visualization

#### StudentLessonViewer
```typescript
interface StudentLessonViewerProps {
  lessonId?: string;
  quizId?: string;
  courseId: string;
  studentId: string;
  onContentComplete: (contentId: string) => void;
}
```

**Features:**
- Unified lesson and quiz display
- Content navigation
- Progress tracking
- Completion management
- Responsive design

### Backend Services

#### Progress Service (`server/services/progress.service.js`)
```javascript
// Unified progress tracking
async function getUnifiedCourseProgress(courseId, studentId, tenantId)
async function markLessonComplete(contentId, studentId, tenantId) // Works for lessons and quizzes
async function markLessonIncomplete(contentId, studentId, tenantId)
async function updateEnrollmentProgress(contentId, studentId, courseId, moduleId)
```

#### Course Service (`server/services/course.service.js`)
```javascript
// Course management
async function getCoursesForStudent(studentId, tenantId)
async function enrollStudentInCourse(courseId, studentId, tenantId)
async function getCourseProgress(courseId, studentId, tenantId)
async function getModuleProgress(moduleId, studentId, tenantId)
```

## Database Schema

### Core Tables

#### enrollments
```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, course_id)
);
```

#### content_progress (Unified Progress Table)
```sql
CREATE TABLE content_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL, -- Can be lesson_id or quiz_id
    content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position TEXT,
    UNIQUE(student_id, content_id)
);
```

#### courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### modules
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## User Flows

### 1. Course Enrollment Flow
```
Student → Browse Courses → Select Course → Enroll → Access Content
```

**Detailed Steps:**
1. Student views available courses on dashboard
2. Clicks on course to view details
3. Reviews course information and requirements
4. Clicks "Enroll" button
5. Enrollment is created in database
6. Student gains access to course content
7. Redirected to course viewer

### 2. Learning Content Flow
```
Student → Select Module → Choose Content → Learn/Quiz → Mark Complete → Next Content
```

**Detailed Steps:**
1. Student navigates to course and selects module
2. Views available lessons and quizzes
3. Clicks on content to start learning
4. Completes lesson or takes quiz
5. Clicks "Mark as Complete" button
6. Progress is updated in database
7. Next content becomes available
8. Module completion is checked

### 3. Quiz Completion Flow
```
Student → Start Quiz → Answer Questions → Submit → View Results → Mark Complete (if passed)
```

**Detailed Steps:**
1. Student clicks on quiz in lesson viewer
2. Reviews quiz information and requirements
3. Clicks "Start Quiz" button
4. Answers questions with navigation controls
5. Submits quiz when complete
6. Views detailed results and score
7. If passing score met, "Mark as Complete" button appears
8. Student clicks to mark quiz as completed
9. Progress is updated and next content unlocked

### 4. Progress Tracking Flow
```
System → Calculate Progress → Update Database → Refresh UI → Show Achievements
```

**Detailed Steps:**
1. Student completes content (lesson or quiz)
2. System calculates module progress percentage
3. System calculates course progress percentage
4. Database is updated with new progress
5. UI is refreshed to show updated progress
6. Module/course completion is checked
7. Celebration modal is shown if completed
8. Achievements are unlocked if applicable

## Component Details

### StudentLessonViewer

The `StudentLessonViewer` is the central component that handles both lessons and quizzes in a unified manner.

#### Key Features:
- **Unified Interface**: Same interface for lessons and quizzes
- **Content Navigation**: Previous/Next navigation between content
- **Progress Integration**: Real-time progress updates
- **Completion Management**: Explicit completion marking
- **Responsive Design**: Works on all device sizes

#### State Management:
```typescript
interface LessonViewerState {
  currentLesson: Lesson | null;
  currentQuiz: Quiz | null;
  allContent: ContentItem[];
  progress: ProgressData;
  isCompleted: boolean;
  isCompleting: boolean;
  quizStarted: boolean;
  quizAttempts: QuizAttempt[];
}
```

#### Key Functions:
```typescript
// Content completion
const handleToggleComplete = async () => {
  // Unified completion logic for lessons and quizzes
  // Updates progress in content_progress table
  // Refreshes progress data
  // Shows celebration if module/course completed
};

// Quiz management
const handleQuizComplete = async (score: number, answers: Record<string, any>) => {
  // Submits quiz attempt
  // Refreshes quiz attempts
  // Stops quiz to show results
  // Does NOT auto-complete quiz
};

const handleRetakeQuiz = async () => {
  // Resets quiz completion status
  // Refreshes quiz attempts
  // Starts quiz engine
};
```

### Progress Integration

The student module uses a unified progress tracking system that treats lessons and quizzes equally.

#### Progress Calculation:
```javascript
// Module progress calculation
const moduleProgress = (completedContent / totalContent) * 100;

// Course progress calculation
const courseProgress = (completedModules / totalModules) * 100;

// Content completion check
const isContentCompleted = (contentId) => {
  return progress.some(item => 
    item.content_id === contentId && 
    item.status === 'completed'
  );
};
```

#### Progress Updates:
```javascript
// Mark content as complete
await markLessonComplete(contentId, studentId, tenantId);

// Update enrollment progress
await updateEnrollmentProgress(contentId, studentId, courseId, moduleId);

// Refresh progress data
await refreshProgress();
```

## API Endpoints

### Student-Specific Endpoints
```
GET    /api/students/:id/courses           # Get student's enrolled courses
POST   /api/students/:id/enroll            # Enroll student in course
GET    /api/students/:id/progress          # Get student's overall progress
GET    /api/students/:id/achievements      # Get student's achievements
```

### Course Access Endpoints
```
GET    /api/courses/:id                    # Get course details
GET    /api/courses/:id/modules            # Get course modules
GET    /api/courses/:id/progress/:studentId # Get course progress for student
POST   /api/courses/:id/enroll             # Enroll in course
```

### Progress Endpoints
```
GET    /api/progress/course/:courseId/student/:studentId/unified # Get unified progress
POST   /api/progress/lesson/:contentId/complete    # Mark content as complete
POST   /api/progress/lesson/:contentId/incomplete  # Mark content as incomplete
GET    /api/progress/module/:moduleId/student/:studentId # Get module progress
```

### Content Endpoints
```
GET    /api/lessons/:id                    # Get lesson content
GET    /api/quizzes/:id                    # Get quiz content
POST   /api/quizzes/:id/attempts           # Submit quiz attempt
GET    /api/quizzes/:id/attempts           # Get quiz attempts
```

## User Interface

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Student Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│  Welcome, [Student Name]                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   My Courses    │ │   Progress      │ │   Achievements  │ │
│  │                 │ │                 │ │                 │ │
│  │ [Course 1]      │ │ Course 1: 75%   │ │ [Badge 1]       │ │
│  │ [Course 2]      │ │ Course 2: 100%  │ │ [Badge 2]       │ │
│  │ [Course 3]      │ │ Course 3: 25%   │ │ [Badge 3]       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Course Viewer Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Course: [Course Name]                    │
├─────────────────────────────────────────────────────────────┤
│  Progress: 60% ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Module 1: Introduction (100% Complete)                 │ │
│  │ ├─ Lesson 1.1: Welcome ✓                              │ │
│  │ ├─ Lesson 1.2: Overview ✓                              │ │
│  │ └─ Quiz 1.1: Module 1 Quiz ✓                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Module 2: Core Concepts (60% Complete)                 │ │
│  │ ├─ Lesson 2.1: Basics ✓                               │ │
│  │ ├─ Lesson 2.2: Advanced →                             │ │
│  │ └─ Quiz 2.1: Module 2 Quiz                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Lesson/Quiz Viewer Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [← Previous] [Course] > [Module] > [Lesson/Quiz] [Next →] │
├─────────────────────────────────────────────────────────────┤
│  [Mark as Complete] [Progress: 75%] [Time: 15 min]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Lesson/Quiz Content                      │
│                                                             │
│  [Rich content with images, videos, text, etc.]            │
│                                                             │
│  [For quizzes: Question interface with navigation]         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [← Previous] [Mark as Complete] [Next →]                  │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Frontend Optimization
- **Lazy Loading**: Components loaded on demand
- **State Management**: Efficient state updates
- **Caching**: Strategic caching of course and progress data
- **Responsive Images**: Optimized images for different screen sizes

### Backend Optimization
- **Database Indexing**: Optimized indexes for student queries
- **Query Optimization**: Efficient joins for progress calculations
- **Caching**: Strategic caching of frequently accessed data
- **Pagination**: Large result sets are paginated

### Progress Calculation Optimization
- **Incremental Updates**: Only recalculate when content is completed
- **Batch Operations**: Multiple progress updates in single transaction
- **Efficient Queries**: Optimized SQL for progress calculations
- **Real-time Updates**: Immediate UI updates after completion

## Security Considerations

### Access Control
- **Student Isolation**: Students can only access their own data
- **Course Access**: Students can only access enrolled courses
- **Content Protection**: Content is protected by enrollment status
- **Progress Security**: Progress data is isolated by student

### Data Validation
- **Input Validation**: All student inputs are validated
- **Progress Validation**: Progress updates are validated server-side
- **Content Validation**: Content access is validated before display
- **Enrollment Validation**: Enrollment status is checked for all operations

## Troubleshooting

### Common Issues

#### Content Not Loading
- **Check**: Student is enrolled in the course
- **Check**: Content is published and accessible
- **Check**: No network or server errors
- **Check**: Browser console for JavaScript errors

#### Progress Not Updating
- **Check**: Content completion is properly marked
- **Check**: Database connection is working
- **Check**: Progress service is functioning
- **Check**: No JavaScript errors in console

#### Quiz Not Working
- **Check**: Quiz is published and accessible
- **Check**: Student has not exceeded attempt limits
- **Check**: Quiz engine is properly loaded
- **Check**: No JavaScript errors in console

### Debug Information
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Verify API calls are successful
- **Database Logs**: Check for database errors
- **Server Logs**: Review backend error logs

## Future Enhancements

### Planned Features
- **Offline Support**: Download content for offline learning
- **Advanced Analytics**: Detailed learning analytics
- **Social Features**: Discussion forums and peer interaction
- **Gamification**: Points, badges, and leaderboards
- **Adaptive Learning**: Personalized content recommendations
- **Mobile App**: Native mobile learning experience
- **Accessibility**: Enhanced accessibility features

### Technical Improvements
- **Real-time Collaboration**: Live learning sessions
- **Advanced Caching**: Redis integration for better performance
- **Progressive Web App**: PWA capabilities for mobile
- **AI Integration**: Intelligent content recommendations

---

*This documentation reflects the current student module implementation as of December 2024. For the latest updates, refer to the system changelog.*
