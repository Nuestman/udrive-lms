# Progress Management Documentation

## Overview

The SunLMS Progress Management System provides comprehensive tracking of student learning progress across all content types and industries. It features a unified approach where lessons and quizzes are treated equally, contributing to the same progress calculations and completion tracking for various use cases.

## Key Features

### 🎯 Unified Progress Tracking
- **Content Agnostic**: Lessons and quizzes use the same progress system
- **Real-time Updates**: Immediate progress updates after content completion
- **Comprehensive Tracking**: Module, course, and overall progress calculation
- **Consistent Experience**: Same completion flow for all content types

### 📊 Progress Analytics
- **Course Progress**: Overall course completion percentage
- **Module Progress**: Individual module completion tracking
- **Content Progress**: Detailed lesson and quiz completion status
- **Time Tracking**: Time spent on learning activities
- **Achievement Tracking**: Progress-based achievements and milestones

### 🔄 Progress Synchronization
- **Multi-device Sync**: Progress synchronized across all devices
- **Real-time Updates**: Immediate UI updates after completion
- **Data Consistency**: Ensures progress data integrity
- **Backup and Recovery**: Progress data backup and recovery

## Architecture

### Database Schema

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
    last_position TEXT, -- For tracking position in lesson or quiz
    UNIQUE(student_id, content_id)
);

-- Indexes for performance
CREATE INDEX idx_content_progress_student_id ON content_progress(student_id);
CREATE INDEX idx_content_progress_content_id ON content_progress(content_id);
CREATE INDEX idx_content_progress_content_type ON content_progress(content_type);
```

#### enrollments (Course Enrollment Progress)
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

### Backend Services

#### Progress Service (`server/services/progress.service.js`)

##### Core Functions
```javascript
// Unified content completion
async function markLessonComplete(contentId, studentId, tenantId, isSuperAdmin = false) {
  // Determines if content is lesson or quiz
  // Updates content_progress table
  // Calculates and updates enrollment progress
  // Returns completion data with enrollment progress
}

// Unified content incompletion
async function markLessonIncomplete(contentId, studentId, tenantId, isSuperAdmin = false) {
  // Determines if content is lesson or quiz
  // Updates content_progress table to 'not_started'
  // Recalculates enrollment progress
  // Returns updated progress data
}

// Get unified course progress
async function getUnifiedCourseProgress(courseId, studentId, tenantId, isSuperAdmin = false) {
  // Returns detailed progress by module
  // Includes both lessons and quizzes
  // Calculates completion percentages
  // Returns content array with completion status
}

// Update enrollment progress
async function updateEnrollmentProgress(contentId, studentId, courseId, moduleId) {
  // Calculates course-level progress
  // Calculates module-level progress
  // Updates enrollment table
  // Checks for module/course completion
  // Returns completion status
}
```

##### Progress Calculation Logic
```javascript
// Course progress calculation
const courseProgress = await query(`
  SELECT 
    (SELECT COUNT(*) FROM lessons l 
     JOIN modules m ON l.module_id = m.id 
     WHERE m.course_id = $1) as total_lessons,
    (SELECT COUNT(*) FROM quizzes q 
     JOIN modules m ON q.module_id = m.id 
     WHERE m.course_id = $1 AND q.status = 'published') as total_quizzes,
    (SELECT COUNT(*) FROM content_progress cp
     JOIN lessons l ON cp.content_id = l.id
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1 AND cp.student_id = $2 AND cp.content_type = 'lesson' AND cp.status = 'completed') as completed_lessons,
    (SELECT COUNT(*) FROM content_progress cp
     JOIN quizzes q ON cp.content_id = q.id
     JOIN modules m ON q.module_id = m.id
     WHERE m.course_id = $1 AND cp.student_id = $2 AND cp.content_type = 'quiz' AND cp.status = 'completed') as completed_quizzes
`, [courseId, studentId]);

const totalContent = parseInt(total_lessons) + parseInt(total_quizzes);
const completedContent = parseInt(completed_lessons) + parseInt(completed_quizzes);
const progressPercentage = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
```

### Frontend Integration

#### useProgress Hook (`src/hooks/useProgress.ts`)
```typescript
export function useProgress(studentId?: string, courseId?: string) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!studentId) return;
    
    let response;
    if (courseId) {
      // Get course-specific progress using unified endpoint
      response = await api.get(`/progress/course/${courseId}/student/${studentId}/unified`);
    } else {
      // Get overall progress
      response = await api.get(`/progress/student/${studentId}`);
    }
    
    if (response.success) {
      setProgress(response.data);
    }
  }, [studentId, courseId]);

  const markLessonComplete = async (lessonId: string) => {
    const response = await api.post(`/progress/lesson/${lessonId}/complete`);
    if (response.success) {
      await fetchProgress(); // Refresh progress
      return response.data;
    }
  };

  const markLessonIncomplete = async (lessonId: string) => {
    const response = await api.post(`/progress/lesson/${lessonId}/incomplete`);
    if (response.success) {
      await fetchProgress(); // Refresh progress
      return response.data;
    }
  };

  return {
    progress,
    loading,
    error,
    markLessonComplete,
    markLessonIncomplete,
    refresh: fetchProgress
  };
}
```

#### Progress Components
```typescript
// Progress display component
interface ProgressDisplayProps {
  progress: ProgressData;
  showDetails?: boolean;
  onProgressClick?: (moduleId: string) => void;
}

// Progress bar component
interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

## Progress Flow

### 1. Content Completion Flow
```
Student Completes Content → Mark Complete → Update Database → Calculate Progress → Update UI → Check Achievements
```

**Detailed Steps:**
1. Student completes lesson or quiz
2. Clicks "Mark as Complete" button
3. `markLessonComplete` function is called
4. Content type is determined (lesson or quiz)
5. `content_progress` table is updated
6. Course and module progress is recalculated
7. `enrollments` table is updated
8. UI is refreshed with new progress
9. Module/course completion is checked
10. Celebration modal is shown if completed

### 2. Progress Calculation Flow
```
Content Completion → Query Content Counts → Calculate Percentages → Update Enrollments → Return Progress Data
```

**Detailed Steps:**
1. Content is marked as complete
2. System queries total lessons and quizzes in course
3. System queries completed lessons and quizzes for student
4. Progress percentage is calculated
5. Module completion is checked
6. Course completion is checked
7. Enrollment progress is updated
8. Progress data is returned to frontend

### 3. Progress Display Flow
```
Progress Data → Component Rendering → Visual Progress Bars → Interactive Elements → Real-time Updates
```

**Detailed Steps:**
1. Progress data is fetched from API
2. Progress components are rendered
3. Progress bars show completion percentages
4. Interactive elements allow navigation
5. Real-time updates reflect changes
6. Achievements are displayed when earned

## API Endpoints

### Progress Management Endpoints
```
GET    /api/progress/student/:studentId                    # Get student's overall progress
GET    /api/progress/course/:courseId/student/:studentId   # Get course progress
GET    /api/progress/course/:courseId/student/:studentId/unified # Get unified progress (lessons + quizzes)
POST   /api/progress/lesson/:contentId/complete            # Mark content as complete
POST   /api/progress/lesson/:contentId/incomplete          # Mark content as incomplete
GET    /api/progress/module/:moduleId/student/:studentId   # Get module progress
```

### Enrollment Endpoints
```
GET    /api/enrollments/student/:studentId                 # Get student enrollments
POST   /api/enrollments                                    # Create enrollment
PUT    /api/enrollments/:id                                # Update enrollment
DELETE /api/enrollments/:id                                # Delete enrollment
```

## Progress Data Structure

### Course Progress Response
```typescript
interface CourseProgress {
  course_id: string;
  course_title: string;
  total_progress: number;
  modules: ModuleProgress[];
  enrollment: {
    enrolled_at: string;
    progress_percentage: number;
    status: string;
    completed_at?: string;
  };
}

interface ModuleProgress {
  module_id: string;
  module_title: string;
  order_index: number;
  total_lessons: number;
  total_quizzes: number;
  completed_lessons: number;
  completed_quizzes: number;
  total_content: number;
  completed_content: number;
  progress_percentage: number;
  is_completed: boolean;
  content: ContentItem[];
}

interface ContentItem {
  content_id: string;
  lesson_id?: string;
  quiz_id?: string;
  title: string;
  order_index: number;
  type: 'lesson' | 'quiz';
  completed: boolean;
  completed_at?: string;
}
```

### Progress Update Response
```typescript
interface ProgressUpdateResponse {
  success: boolean;
  progress_record: {
    id: string;
    student_id: string;
    content_id: string;
    content_type: 'lesson' | 'quiz';
    status: 'completed';
    completed_at: string;
  };
  enrollment_progress: {
    course_progress: number;
    module_progress: number;
    module_completed: boolean;
    course_completed: boolean;
    module_id: string;
    course_id: string;
  };
}
```

## Performance Optimization

### Database Optimization
- **Indexed Queries**: Optimized indexes for progress queries
- **Efficient Joins**: Optimized joins for progress calculations
- **Batch Updates**: Multiple progress updates in single transaction
- **Query Caching**: Strategic caching of progress data

### Frontend Optimization
- **Incremental Updates**: Only update changed progress data
- **Debounced Updates**: Prevent excessive API calls
- **Local State Management**: Efficient state updates
- **Optimistic Updates**: Immediate UI updates with rollback

### Caching Strategy
- **Progress Caching**: Cache progress data for quick access
- **Calculation Caching**: Cache progress calculations
- **Invalidation**: Smart cache invalidation on updates
- **Compression**: Compress progress data for storage

## Security Considerations

### Data Protection
- **Student Isolation**: Students can only access their own progress
- **Tenant Isolation**: Progress data is isolated by tenant
- **Input Validation**: All progress updates are validated
- **SQL Injection Prevention**: Parameterized queries only

### Access Control
- **Role-Based Access**: Different access levels for different roles
- **Progress Privacy**: Progress data is private to student
- **Audit Logging**: All progress changes are logged
- **Data Integrity**: Ensures progress data consistency

## Troubleshooting

### Common Issues

#### Progress Not Updating
- **Check**: Content completion is properly marked
- **Check**: Database connection is working
- **Check**: Progress service is functioning
- **Check**: No JavaScript errors in console

#### Incorrect Progress Calculation
- **Check**: Content counts are accurate
- **Check**: Completion status is correct
- **Check**: Progress calculation logic
- **Check**: Database queries are working

#### Performance Issues
- **Check**: Database indexes are optimized
- **Check**: Queries are efficient
- **Check**: Caching is working
- **Check**: No excessive API calls

### Debug Information
- **Progress Logs**: Detailed progress update logs
- **Calculation Logs**: Progress calculation logs
- **Database Logs**: Progress query logs
- **Performance Logs**: Progress performance metrics

## Migration from Legacy System

### Migration Process
1. **Create content_progress table**: New unified progress table
2. **Migrate lesson_progress data**: Move lesson progress to new table
3. **Migrate quiz_attempts data**: Move quiz completion to new table
4. **Update progress calculations**: Use new unified queries
5. **Update frontend**: Use new progress endpoints
6. **Test and validate**: Ensure all progress data is correct

### Migration SQL
```sql
-- Migrate lesson progress
INSERT INTO content_progress (student_id, content_id, content_type, status, started_at, completed_at, time_spent_seconds)
SELECT student_id, lesson_id, 'lesson', status, started_at, completed_at, time_spent_seconds
FROM lesson_progress;

-- Migrate quiz completion
INSERT INTO content_progress (student_id, content_id, content_type, status, completed_at)
SELECT student_id, quiz_id, 'quiz', 'completed', completed_at
FROM quiz_attempts
WHERE score >= (SELECT passing_score FROM quizzes WHERE id = quiz_id);
```

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed learning analytics and insights
- **Progress Predictions**: AI-powered progress predictions
- **Adaptive Progress**: Personalized progress tracking
- **Social Progress**: Progress sharing and comparison
- **Progress Gamification**: Points and achievements based on progress
- **Progress Reporting**: Comprehensive progress reports
- **Progress Export**: Export progress data for external analysis

### Technical Improvements
- **Real-time Progress**: WebSocket-based real-time progress updates
- **Advanced Caching**: Redis integration for better performance
- **Progress Compression**: Efficient progress data storage
- **Progress Backup**: Automated progress data backup

---

*This documentation reflects the current progress management system implementation as of December 2024. For the latest updates, refer to the system changelog.*
