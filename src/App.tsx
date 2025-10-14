import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/dashboard/DashboardLayout';
import BlockEditor from './components/lesson/BlockEditor';
import QuizEngine from './components/quiz/QuizEngine';
import CertificateGenerator from './components/certificate/CertificateGenerator';
import StudentManagement from './components/student/StudentManagement';
import EnrollmentSystem from './components/enrollment/EnrollmentSystem';
import MediaLibrary from './components/media/MediaLibrary';
import SchoolAdminDashboard from './components/dashboard/SchoolDashboard';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard';
import InstructorDashboard from './components/dashboard/InstructorDashboard';

// Page Components
import CoursesPage from './components/courses/CoursesPage';
import CourseDetailsPage from './components/courses/CourseDetailsPage';
import StudentsPage from './components/students/StudentsPage';
import EnrollmentsPage from './components/enrollments/EnrollmentsPage';
import SchoolsPage from './components/schools/SchoolsPage';
import UsersPage from './components/users/UsersPage';
import InstructorsPage from './components/instructors/InstructorsPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import CertificatesPage from './components/pages/CertificatesPage';
import HelpPage from './components/pages/HelpPage';
import StudentDashboardPage from './components/student/StudentDashboardPage';
import StudentProgressPage from './components/pages/student/StudentProgressPage';
import StudentLessonViewer from './components/student/StudentLessonViewer';
import StudentCoursesPage from './components/student/StudentCoursesPage';

// New Phase 3 Components
import LearningPathNavigation from './components/student/LearningPathNavigation';
import AssignmentSubmission from './components/student/AssignmentSubmission';
import ProgressTracking from './components/student/ProgressTracking';

// Auth Pages
import LandingPage from './components/pages/LandingPage';
import LoginPage from './components/pages/Auth/LoginPage';
import SignupPage from './components/pages/Auth/SignupPage';
import SignupSchoolPage from './components/pages/Auth/SignupSchoolPage';
import ForgotPasswordPage from './components/pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/Auth/ResetPasswordPage';

// Static Pages
import PrivacyPage from './components/pages/PrivacyPage';
import TermsPage from './components/pages/TermsPage';
import ContactPage from './components/pages/ContactPage';

// Auth Context
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, profile, loading } = useAuth();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Auth state changed:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      profile: profile ? { role: profile.role, tenant_id: profile.tenant_id } : null,
      loading 
    });
  }, [user, profile, loading]);

  // Sample quiz questions for demonstration (keep for components that use them)
  const sampleQuestions = [
    {
      id: '1',
      type: 'multiple_choice' as const,
      text: 'What should you do when approaching a yellow traffic light?',
      options: [
        'Speed up to get through',
        'Prepare to stop if it is safe to do so',
        'Always stop immediately',
        'Ignore it if no other cars are present'
      ],
      correctAnswer: 'Prepare to stop if it is safe to do so',
      points: 10,
      explanation: 'A yellow light indicates that the signal is about to turn red. You should prepare to stop if you can do so safely, as rushing through could be dangerous.'
    },
    {
      id: '2',
      type: 'true_false' as const,
      text: 'In most states, it is legal to turn right on a red light after coming to a complete stop, unless otherwise posted.',
      correctAnswer: 'True',
      points: 5,
      explanation: 'Right turns on red are generally permitted in the United States after a complete stop, unless a sign prohibits it. Always check for pedestrians and oncoming traffic.'
    },
    {
      id: '3',
      type: 'multiple_choice' as const,
      text: 'What is the proper following distance in good weather conditions?',
      options: [
        '1 second',
        '2 seconds',
        '3 seconds',
        '5 seconds'
      ],
      correctAnswer: '3 seconds',
      points: 10,
      explanation: 'The three-second rule provides a safe following distance in good weather conditions. This gives you enough time to react if the vehicle ahead suddenly stops.'
    }
  ];

  // Sample content blocks for demonstration
  const sampleBlocks = [
    {
      id: 'block-1',
      type: 'text',
      content: {
        text: 'Welcome to UDrive - The comprehensive Learning Management System for driving schools. This platform helps schools manage their curriculum, track student progress, and deliver high-quality educational content.',
        formatting: 'paragraph'
      }
    },
    {
      id: 'block-2',
      type: 'image',
      content: {
        imageUrl: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        caption: 'Professional driving instruction made easy with UDrive LMS',
        altText: 'Driving instructor teaching a student in a car'
      }
    },
    {
      id: 'block-3',
      type: 'road_sign',
      content: {
        signId: 'stop',
        description: 'Understanding stop signs is crucial for safe driving.',
        showMeaning: true,
        interactive: true
      }
    },
    {
      id: 'block-4',
      type: 'scenario',
      content: {
        scenarioType: 'intersection',
        description: 'Practice making safe decisions at intersections.',
        interactive: true
      }
    }
  ];

  // Sample certificate data
  const sampleCertificateData = {
    studentName: "Sarah Johnson",
    courseName: "Advanced Defensive Driving",
    completionDate: "March 15, 2024",
    certificateId: "CERT-2024-0001",
    schoolName: "Premier Driving Academy",
    instructorName: "Michael Anderson"
  };

  // Sample course data for learning path
  const sampleCourse = {
    id: '1',
    title: 'Basic Driving Course',
    description: 'Learn the fundamentals of safe driving',
    overallProgress: 75,
    difficulty: 'beginner' as const,
    modules: [
      {
        id: '1',
        title: 'Getting Started',
        description: 'Introduction to driving basics',
        progress: 100,
        isUnlocked: true,
        estimatedTime: '2 hours',
        lessons: [
          {
            id: '1-1',
            title: 'Vehicle Controls',
            type: 'lesson' as const,
            status: 'completed' as const,
            duration: '30 min',
            isRequired: true
          },
          {
            id: '1-2',
            title: 'Safety Check Quiz',
            type: 'quiz' as const,
            status: 'completed' as const,
            score: 95,
            isRequired: true
          }
        ]
      },
      {
        id: '2',
        title: 'Basic Maneuvers',
        description: 'Learn essential driving maneuvers',
        progress: 60,
        isUnlocked: true,
        estimatedTime: '3 hours',
        lessons: [
          {
            id: '2-1',
            title: 'Parking Techniques',
            type: 'lesson' as const,
            status: 'current' as const,
            duration: '45 min',
            isRequired: true
          },
          {
            id: '2-2',
            title: 'Three-Point Turn',
            type: 'lesson' as const,
            status: 'available' as const,
            duration: '30 min',
            isRequired: true
          }
        ]
      }
    ]
  };

  // Sample assignment data
  const sampleAssignment = {
    id: '1',
    title: 'Defensive Driving Essay',
    description: 'Write a comprehensive essay about defensive driving techniques',
    dueDate: '2024-03-25T23:59:00',
    maxScore: 100,
    submissionTypes: ['text', 'file'] as const,
    instructions: 'Write a 500-word essay discussing the importance of defensive driving techniques. Include at least three specific examples of defensive driving strategies and explain how they help prevent accidents.',
    status: 'not_submitted' as const,
    rubric: [
      {
        criteria: 'Content Quality',
        points: 40,
        description: 'Demonstrates understanding of defensive driving concepts'
      },
      {
        criteria: 'Examples',
        points: 30,
        description: 'Provides relevant and specific examples'
      },
      {
        criteria: 'Writing Quality',
        points: 20,
        description: 'Clear, well-organized writing with proper grammar'
      },
      {
        criteria: 'Length',
        points: 10,
        description: 'Meets the 500-word requirement'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading UDrive LMS...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login/signup pages
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/school" element={<SignupSchoolPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // If user is logged in but no profile, show loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and has profile, show the main dashboard
  return (
    <Router>
      <DashboardLayout role={profile.role} currentPath={window.location.pathname}>
        <Routes>
          {/* Default route for logged-in users - redirect based on role */}
          <Route path="/" element={
            profile.role === 'student' ? <Navigate to="/student/dashboard" replace /> :
            profile.role === 'instructor' ? <Navigate to="/instructor/dashboard" replace /> :
            profile.role === 'school_admin' ? <Navigate to="/school/dashboard" replace /> :
            profile.role === 'super_admin' ? <Navigate to="/admin/dashboard" replace /> :
            <Navigate to="/school/dashboard" replace />
          } />

          {/* School Admin Routes */}
          <Route path="/school/dashboard" element={<SchoolAdminDashboard />} />
          <Route path="/school/courses" element={<CoursesPage role="school_admin" />} />
          <Route path="/school/courses/:id" element={<CourseDetailsPage />} />
          <Route path="/school/students" element={<StudentsPage />} />
          <Route path="/school/instructors" element={<InstructorsPage />} />
          <Route path="/school/enrollments" element={<EnrollmentsPage />} />
          <Route path="/school/analytics" element={<AnalyticsPage role="school_admin" />} />
          <Route path="/school/settings" element={<SettingsPage role="school_admin" />} />
          <Route path="/school/certificates" element={<CertificatesPage role="school_admin" />} />
          <Route path="/media-library" element={<MediaLibrary />} />

          {/* Super Admin Routes */}
          <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/admin/schools" element={<SchoolsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/instructors" element={<InstructorsPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage role="super_admin" />} />
          <Route path="/admin/settings" element={<SettingsPage role="super_admin" />} />
          
          {/* Instructor Routes */}
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/courses" element={<CoursesPage role="instructor" />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/progress" element={<StudentProgressPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/courses/:courseId/lessons/:lessonId" element={<StudentLessonViewer />} />
          <Route path="/student/certificates" element={<CertificatesPage role="student" />} />

          {/* Common Pages - Accessible to all roles */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Demo Components */}
          <Route path="/block-editor-demo" element={<BlockEditor initialContent={sampleBlocks} showPreview={true} onChange={(blocks) => console.log('Content updated:', blocks)} />} />
          <Route path="/quiz-engine-demo" element={<QuizEngine questions={sampleQuestions} timeLimit={5} passingScore={70} showFeedback={true} onComplete={(score, answers) => console.log('Quiz completed', { score, answers })} />} />
          <Route path="/certificate-generator-demo" element={<CertificateGenerator data={sampleCertificateData} onGenerate={(url) => console.log('Certificate generated:', url.substring(0, 100) + '...')} />} />
          <Route path="/student-management-demo" element={<StudentManagement role="school_admin" />} />
          <Route path="/enrollment-system-demo" element={<EnrollmentSystem role="school_admin" />} />
          <Route path="/learning-path-navigation-demo" element={<LearningPathNavigation course={sampleCourse} onLessonSelect={(lessonId) => console.log('Selected lesson:', lessonId)} />} />
          <Route path="/assignment-submission-demo" element={<AssignmentSubmission assignment={sampleAssignment} onSubmit={(submission) => console.log('Assignment submitted:', submission)} onSaveDraft={(draft) => console.log('Draft saved:', draft)} />} />
          <Route path="/progress-tracking-demo" element={<ProgressTracking studentId="demo-student-id" />} />

          {/* Fallback for unknown routes - redirect based on role */}
          <Route path="*" element={
            profile.role === 'student' ? <Navigate to="/student/dashboard" replace /> :
            profile.role === 'instructor' ? <Navigate to="/instructor/dashboard" replace /> :
            profile.role === 'school_admin' ? <Navigate to="/school/dashboard" replace /> :
            profile.role === 'super_admin' ? <Navigate to="/admin/dashboard" replace /> :
            <Navigate to="/student/dashboard" replace />
          } />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;