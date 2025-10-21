# Quiz Engine Documentation

## Overview

The SunLMS Quiz Engine is a comprehensive system for creating, managing, and delivering quizzes within the learning management system. It features a unified approach where quizzes are treated as a special type of lesson content, providing a consistent user experience across all learning materials for various industries and use cases.

## Key Features

### 🎯 Unified Content Model
- **Consistent Experience**: Quizzes and lessons share the same completion flow
- **Unified Progress**: Both content types contribute to the same progress tracking
- **Seamless Navigation**: Same interface patterns for all learning content

### 📝 Quiz Creation & Management
- **Rich Question Types**: Multiple choice, true/false, and more
- **Flexible Configuration**: Time limits, attempt limits, passing scores
- **Question Management**: Easy addition, editing, and reordering of questions
- **Media Support**: Images and rich text in questions and answers

### 🎮 Interactive Quiz Experience
- **Real-time Feedback**: Immediate feedback on answers (configurable)
- **Progress Tracking**: Visual progress indicators during quiz taking
- **Time Management**: Optional time limits with countdown timers
- **Responsive Design**: Works seamlessly on all devices

### 📊 Advanced Features
- **Multiple Attempts**: Configurable attempt limits per quiz
- **Passing Score Requirements**: Customizable passing thresholds
- **Detailed Results**: Comprehensive score breakdowns and explanations
- **Retake Functionality**: Easy quiz retaking with attempt tracking

## Architecture

### Frontend Components

#### QuizBuilderModal
```typescript
interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onQuizCreated?: (quiz: Quiz) => void;
}
```

**Features:**
- Drag-and-drop question reordering
- Rich text editor for questions and answers
- Media upload integration
- Real-time validation
- Auto-save functionality

#### QuizEngine
```typescript
interface QuizEngineProps {
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
  showFeedback: boolean;
  onComplete: (score: number, answers: Record<string, any>) => void;
}
```

**Features:**
- Question navigation (previous/next)
- Answer selection and validation
- Timer display and management
- Progress tracking
- Submission handling

#### StudentLessonViewer (Quiz Integration)
**Features:**
- Unified lesson/quiz display
- Quiz results presentation
- "Mark as Complete" functionality
- Retake quiz capability
- Progress integration

### Backend Services

#### Quiz Service (`server/services/quiz.service.js`)
```javascript
// Key functions:
- createQuiz(quizData, moduleId, tenantId)
- updateQuiz(quizId, updates, tenantId)
- deleteQuiz(quizId, tenantId)
- getQuizById(quizId, tenantId)
- submitQuizAttempt(quizId, studentId, answers, tenantId)
- getQuizAttempts(quizId, studentId, tenantId)
```

#### Progress Service Integration
```javascript
// Unified progress tracking:
- markLessonComplete(contentId, studentId, tenantId) // Works for both lessons and quizzes
- markLessonIncomplete(contentId, studentId, tenantId) // Unified incomplete marking
- getUnifiedCourseProgress(courseId, studentId, tenantId) // Includes quiz completion
```

## Database Schema

### Core Tables

#### quizzes
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 0,
    passing_score INTEGER DEFAULT 70,
    show_feedback VARCHAR(20) DEFAULT 'after_completion',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### quiz_questions
```sql
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    score INTEGER,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

## User Flows

### 1. Quiz Creation Flow
```
Instructor → Create Quiz → Add Questions → Configure Settings → Publish
```

**Detailed Steps:**
1. Instructor navigates to module
2. Clicks "Add Quiz" button
3. Opens QuizBuilderModal
4. Enters quiz title and description
5. Adds questions with answers
6. Configures time limits and passing scores
7. Sets attempt limits and feedback options
8. Publishes quiz

### 2. Student Quiz Taking Flow
```
Student → Start Quiz → Answer Questions → Submit → View Results → Mark Complete
```

**Detailed Steps:**
1. Student navigates to quiz in lesson viewer
2. Reviews quiz information and requirements
3. Clicks "Start Quiz" button
4. Answers questions with navigation controls
5. Submits quiz when complete
6. Views detailed results and score
7. If passing score met, "Mark as Complete" button appears
8. Student clicks to mark quiz as completed in progress

### 3. Quiz Retake Flow
```
Student → View Results → Click Retake → Take Quiz Again → New Results
```

**Detailed Steps:**
1. Student views quiz results
2. If attempts remaining, "Retake Quiz" button is available
3. Student clicks retake button
4. Quiz engine resets and starts fresh
5. Student takes quiz again
6. New results are displayed
7. Progress is updated with latest attempt

## Configuration Options

### Quiz Settings
- **Time Limit**: Optional time constraint in minutes
- **Max Attempts**: Limit on number of attempts (0 = unlimited)
- **Passing Score**: Minimum score required to pass (percentage)
- **Feedback Display**: When to show feedback (never, after_completion, immediately)

### Question Types
- **Multiple Choice**: Single correct answer from options
- **True/False**: Binary choice questions
- **Multiple Select**: Multiple correct answers (future enhancement)
- **Short Answer**: Text input questions (future enhancement)

### Progress Integration
- **Unified Completion**: Quizzes contribute to module completion percentage
- **Attempt Tracking**: All attempts are recorded and accessible
- **Score History**: Complete score history for analytics
- **Time Tracking**: Time spent on quizzes is recorded

## API Endpoints

### Quiz Management
```
GET    /api/quizzes/module/:moduleId          # Get quizzes for module
POST   /api/quizzes                          # Create new quiz
GET    /api/quizzes/:quizId                  # Get quiz details
PUT    /api/quizzes/:quizId                  # Update quiz
DELETE /api/quizzes/:quizId                  # Delete quiz
```

### Quiz Taking
```
POST   /api/quizzes/:quizId/attempts         # Submit quiz attempt
GET    /api/quizzes/:quizId/attempts         # Get student's attempts
GET    /api/quizzes/:quizId/attempts/:attemptId # Get specific attempt
```

### Progress Integration
```
POST   /api/progress/lesson/:contentId/complete    # Mark quiz as complete
POST   /api/progress/lesson/:contentId/incomplete  # Mark quiz as incomplete
GET    /api/progress/course/:courseId/student/:studentId/unified # Get unified progress
```

## Security Considerations

### Access Control
- **Tenant Isolation**: All quiz data is filtered by tenant
- **Role-Based Access**: Instructors can manage, students can take
- **Attempt Validation**: Server-side validation of quiz attempts
- **Time Limit Enforcement**: Server-side time limit validation

### Data Protection
- **Answer Encryption**: Sensitive answer data is protected
- **Audit Trail**: All quiz attempts are logged
- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries only

## Performance Optimization

### Database Optimization
- **Indexed Queries**: Optimized indexes for common quiz queries
- **Efficient Joins**: Optimized joins for progress calculations
- **Pagination**: Large result sets are paginated
- **Caching**: Strategic caching of quiz data

### Frontend Optimization
- **Lazy Loading**: Quiz components are loaded on demand
- **State Management**: Efficient state updates during quiz taking
- **Memory Management**: Proper cleanup of quiz state
- **Responsive Design**: Optimized for all device sizes

## Troubleshooting

### Common Issues

#### Quiz Not Starting
- **Check**: Quiz status is 'published'
- **Check**: Student has access to the module
- **Check**: No technical errors in browser console

#### Progress Not Updating
- **Check**: Quiz completion is properly marked
- **Check**: Database connection is working
- **Check**: Progress service is functioning

#### Retake Button Not Working
- **Check**: Attempt limits are not exceeded
- **Check**: Quiz is not already completed
- **Check**: JavaScript errors in console

### Debug Information
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Verify API calls are successful
- **Database Logs**: Check for database errors
- **Server Logs**: Review backend error logs

## Future Enhancements

### Planned Features
- **Advanced Question Types**: Fill-in-the-blank, matching, essay
- **Question Banks**: Reusable question libraries
- **Adaptive Quizzes**: Difficulty adjustment based on performance
- **Offline Support**: Quiz taking without internet connection
- **Advanced Analytics**: Detailed performance analytics
- **Question Randomization**: Random question order and answer options
- **Proctoring Integration**: Advanced cheating prevention

### Technical Improvements
- **Real-time Collaboration**: Live quiz sessions
- **Advanced Caching**: Redis integration for better performance
- **Mobile App**: Native mobile quiz experience
- **AI Integration**: Intelligent question generation and analysis

---

*This documentation reflects the current quiz engine implementation as of December 2024. For the latest updates, refer to the system changelog.*
