import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WhiteLabelProvider, useWhiteLabel } from './contexts/WhiteLabelContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TimezoneProvider } from './contexts/TimezoneContext';
import { CompactModeProvider } from './contexts/CompactModeContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const CertificateViewPage = lazy(() => import('./components/certificate/CertificateViewPage'));
const CertificateVerificationPage = lazy(() => import('./components/certificate/CertificateVerificationPage'));
const CertificateManagementPage = lazy(() => import('./components/certificate/CertificateManagementPage'));
const MediaLibrary = lazy(() => import('./components/media/MediaLibrary'));
const SchoolAdminDashboard = lazy(() => import('./components/dashboard/SchoolDashboard'));
const SuperAdminDashboard = lazy(() => import('./components/dashboard/SuperAdminDashboard'));
const InstructorDashboard = lazy(() => import('./components/dashboard/InstructorDashboard'));
const CoursesPage = lazy(() => import('./components/courses/CoursesPage'));
const CourseDetailsPage = lazy(() => import('./components/courses/CourseDetailsPage'));
const StudentsPage = lazy(() => import('./components/students/StudentsPage'));
const EnrollmentsPage = lazy(() => import('./components/enrollments/EnrollmentsPage'));
const SchoolsPage = lazy(() => import('./components/schools/SchoolsPage'));
const UsersPage = lazy(() => import('./components/users/UsersPage'));
const InstructorsPage = lazy(() => import('./components/instructors/InstructorsPage'));
const AnalyticsPage = lazy(() => import('./components/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));
const ContactMessagesPage = lazy(() => import('./components/pages/ContactMessagesPage'));
const CertificatesPage = lazy(() => import('./components/pages/CertificatesPage'));
const HelpPage = lazy(() => import('./components/pages/HelpPage'));
const NotificationsPage = lazy(() => import('./components/pages/NotificationsPage'));
const FeedbackPage = lazy(() => import('./components/pages/FeedbackPage'));
const ReviewsModerationPage = lazy(() => import('./components/pages/Admin/ReviewsModerationPage'));
const FeedbackInsightsPage = lazy(() => import('./components/pages/Admin/FeedbackInsightsPage'));
const TestimonialsManagerPage = lazy(() => import('./components/pages/Admin/TestimonialsManagerPage'));
const StudentDashboardPage = lazy(() => import('./components/student/StudentDashboardPage'));
const StudentProgressPage = lazy(() => import('./components/pages/student/StudentProgressPage'));
const StudentLessonViewer = lazy(() => import('./components/student/StudentLessonViewer'));
const StudentCoursesPage = lazy(() => import('./components/student/StudentCoursesPage'));
const AnnouncementsManagementPage = lazy(() => import('./components/announcements/AnnouncementsManagementPage'));
const StudentAnnouncementsPage = lazy(() => import('./components/student/StudentAnnouncementsPage'));
const LandingPage = lazy(() => import('./components/pages/LandingPage'));
const LoginPage = lazy(() => import('./components/pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('./components/pages/Auth/SignupPage'));
const SignupSchoolPage = lazy(() => import('./components/pages/Auth/SignupSchoolPage'));
const SignupSuperAdminPage = lazy(() => import('./components/pages/Auth/SignupSuperAdminPage'));
const ForgotPasswordPage = lazy(() => import('./components/pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/pages/Auth/ResetPasswordPage'));
const PrivacyPage = lazy(() => import('./components/pages/PrivacyPage'));
const TermsPage = lazy(() => import('./components/pages/TermsPage'));
const ContactPage = lazy(() => import('./components/pages/ContactPage'));
const ImplementationProgressPage = lazy(() => import('./components/pages/ImplementationProgressPage'));
const UserProfilePage = lazy(() => import('./components/profile/UserProfilePage'));
const DocumentationLayout = lazy(() => import('./components/docs/DocumentationLayout'));

type UserRole = 'super_admin' | 'school_admin' | 'instructor' | 'student';

const getDefaultRouteForRole = (role?: UserRole | null) => {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'instructor':
      return '/instructor/dashboard';
    case 'super_admin':
      return '/admin/dashboard';
    case 'school_admin':
    default:
      return '/school/dashboard';
  }
};

const DashboardRedirect: React.FC<{ role?: UserRole | null }> = ({ role }) => {
  const target = getDefaultRouteForRole(role);
  return <Navigate to={target} replace />;
};

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-700 text-lg">{message}</p>
    </div>
  </div>
);

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return null;
}

interface RouteTitleMatcher {
  pattern: RegExp;
  title: string;
}

const routeTitleMatchers: RouteTitleMatcher[] = [
  { pattern: /^\/$/, title: 'Welcome' },
  { pattern: /^\/docs\/implementation-progress$/, title: 'Implementation Progress' },
  { pattern: /^\/docs(?:\/.*)?$/, title: 'Documentation' },
  { pattern: /^\/privacy$/, title: 'Privacy Policy' },
  { pattern: /^\/terms$/, title: 'Terms of Service' },
  { pattern: /^\/contact$/, title: 'Contact Us' },
  { pattern: /^\/verify\/[^/]+$/, title: 'Verify Certificate' },
  { pattern: /^\/login$/, title: 'Log In' },
  { pattern: /^\/signup\/super-admin$/, title: 'Super Admin Sign Up' },
  { pattern: /^\/signup\/school$/, title: 'School Sign Up' },
  { pattern: /^\/signup$/, title: 'Create Account' },
  { pattern: /^\/forgot-password$/, title: 'Forgot Password' },
  { pattern: /^\/reset-password$/, title: 'Reset Password' },
  { pattern: /^\/school\/dashboard$/, title: 'School Dashboard' },
  { pattern: /^\/school\/courses\/[^/]+$/, title: 'Course Details' },
  { pattern: /^\/school\/courses$/, title: 'Manage Courses' },
  { pattern: /^\/school\/students$/, title: 'Student Directory' },
  { pattern: /^\/school\/instructors$/, title: 'Instructor Directory' },
  { pattern: /^\/school\/enrollments$/, title: 'Enrollment Management' },
  { pattern: /^\/school\/analytics$/, title: 'School Analytics' },
  { pattern: /^\/school\/settings$/, title: 'School Settings' },
  { pattern: /^\/school\/certificates$/, title: 'Certificate Management' },
  { pattern: /^\/school\/announcements$/, title: 'Announcements' },
  { pattern: /^\/school\/reviews$/, title: 'Reviews Moderation' },
  { pattern: /^\/school\/feedback-insights$/, title: 'Feedback Insights' },
  { pattern: /^\/school\/profile$/, title: 'Profile Settings' },
  { pattern: /^\/media-library$/, title: 'Media Library' },
  { pattern: /^\/admin\/dashboard$/, title: 'Super Admin Dashboard' },
  { pattern: /^\/admin\/schools$/, title: 'Schools' },
  { pattern: /^\/admin\/users$/, title: 'User Management' },
  { pattern: /^\/admin\/instructors$/, title: 'Instructor Management' },
  { pattern: /^\/admin\/analytics$/, title: 'Platform Analytics' },
  { pattern: /^\/admin\/settings$/, title: 'Platform Settings' },
  { pattern: /^\/admin\/certificates$/, title: 'Certificate Management' },
  { pattern: /^\/admin\/contact-messages$/, title: 'Contact Messages' },
  { pattern: /^\/admin\/reviews$/, title: 'Reviews Moderation' },
  { pattern: /^\/admin\/feedback-insights$/, title: 'Feedback Insights' },
  { pattern: /^\/admin\/announcements$/, title: 'Announcements' },
  { pattern: /^\/admin\/testimonials$/, title: 'Testimonials Manager' },
  { pattern: /^\/admin\/profile$/, title: 'Profile Settings' },
  { pattern: /^\/instructor\/dashboard$/, title: 'Instructor Dashboard' },
  { pattern: /^\/instructor\/courses$/, title: 'Instructor Courses' },
  { pattern: /^\/instructor\/certificates$/, title: 'Certificate Management' },
  { pattern: /^\/instructor\/announcements$/, title: 'Announcements' },
  { pattern: /^\/instructor\/profile$/, title: 'Profile Settings' },
  { pattern: /^\/student\/courses\/[^/]+\/lessons\/[^/]+$/, title: 'Lesson Viewer' },
  { pattern: /^\/student\/dashboard$/, title: 'Student Dashboard' },
  { pattern: /^\/student\/progress$/, title: 'Progress Overview' },
  { pattern: /^\/student\/courses$/, title: 'My Courses' },
  { pattern: /^\/student\/certificates\/[^/]+$/, title: 'Certificate Viewer' },
  { pattern: /^\/student\/certificates$/, title: 'My Certificates' },
  { pattern: /^\/student\/announcements$/, title: 'Announcements' },
  { pattern: /^\/student\/profile$/, title: 'Profile Settings' },
  { pattern: /^\/feedback$/, title: 'Feedback' },
  { pattern: /^\/notifications$/, title: 'Notifications' },
  { pattern: /^\/help$/, title: 'Help Center' },
];

const resolvePageTitle = (pathname: string) => {
  for (const matcher of routeTitleMatchers) {
    if (matcher.pattern.test(pathname)) {
      return matcher.title;
    }
  }
  if (/^\/(app|dashboard)/.test(pathname)) {
    return 'Dashboard';
  }
  return null;
};

const RouteTitleUpdater: React.FC = () => {
  const location = useLocation();
  const { getBrandingConfig } = useWhiteLabel();
  const brandingConfig = useMemo(() => getBrandingConfig(), [getBrandingConfig]);
  const companyName = brandingConfig.companyName || 'SunLMS';

  useEffect(() => {
    const pageTitle = resolvePageTitle(location.pathname);
    document.title = pageTitle ? `${pageTitle} | ${companyName}` : companyName;
  }, [location.pathname, companyName]);

  return null;
};

interface AuthenticatedProvidersProps {
  profile: {
    role: UserRole;
    active_role?: UserRole | null;
  };
}

const AuthenticatedProviders: React.FC<AuthenticatedProvidersProps> = ({ profile }) => {
  const location = useLocation();
  const activeRole = profile.active_role || profile.role;

  return (
    <ToastProvider>
      <SettingsProvider>
        <FeatureFlagsProvider>
          <NotificationProvider>
            <LanguageProvider>
              <TimezoneProvider>
                <CompactModeProvider>
                  <DashboardLayout role={activeRole} currentPath={location.pathname}>
                    <Outlet />
                  </DashboardLayout>
                </CompactModeProvider>
              </TimezoneProvider>
            </LanguageProvider>
          </NotificationProvider>
        </FeatureFlagsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
};

const RequireAuth: React.FC<{
  user: unknown;
  profile: AuthenticatedProvidersProps['profile'] | null;
}> = ({ user, profile }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  return <AuthenticatedProviders profile={profile} />;
};

function App() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    console.log('Auth state changed:', {
      user: user ? { id: user.id, email: user.email } : null,
      profile: profile ? { role: profile.role, tenant_id: profile.tenant_id } : null,
      loading
    });
  }, [user, profile, loading]);
  if (loading) {
    return <LoadingScreen message="Loading SunLMS..." />;
  }

  const activeRole = profile?.active_role || profile?.role || null;

  return (
    <WhiteLabelProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <RouteTitleUpdater />
          <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Routes>
            {/* Public marketing and informational pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<DocumentationLayout />} />
            <Route path="/docs/implementation-progress" element={<ImplementationProgressPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/verify/:verificationCode" element={<CertificateVerificationPage />} />

            {/* Auth pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/school" element={<SignupSchoolPage />} />
            <Route path="/signup/super-admin" element={<SignupSuperAdminPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected app routes */}
            <Route element={<RequireAuth user={user} profile={profile} />}>
              <Route path="/app" element={<DashboardRedirect role={activeRole} />} />
              <Route path="/dashboard" element={<DashboardRedirect role={activeRole} />} />

              <Route path="/school/dashboard" element={<SchoolAdminDashboard />} />
              <Route path="/school/courses" element={<CoursesPage role="school_admin" />} />
              <Route path="/school/courses/:id" element={<CourseDetailsPage />} />
              <Route path="/school/students" element={<StudentsPage />} />
              <Route path="/school/instructors" element={<InstructorsPage />} />
              <Route path="/school/enrollments" element={<EnrollmentsPage />} />
              <Route path="/school/analytics" element={<AnalyticsPage role="school_admin" />} />
              <Route path="/school/settings" element={<SettingsPage role="school_admin" />} />
              <Route path="/school/certificates" element={<CertificateManagementPage />} />
              <Route path="/school/announcements" element={<AnnouncementsManagementPage role="school_admin" />} />
              <Route path="/school/reviews" element={<ReviewsModerationPage />} />
              <Route path="/school/feedback-insights" element={<FeedbackInsightsPage />} />
              <Route path="/school/profile" element={<UserProfilePage />} />
              <Route path="/media-library" element={<MediaLibrary />} />

              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/schools" element={<SchoolsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/instructors" element={<InstructorsPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage role="super_admin" />} />
              <Route path="/admin/settings" element={<SettingsPage role="super_admin" />} />
              <Route path="/admin/certificates" element={<CertificateManagementPage />} />
              <Route path="/admin/contact-messages" element={<ContactMessagesPage />} />
              <Route path="/admin/reviews" element={<ReviewsModerationPage />} />
              <Route path="/admin/feedback-insights" element={<FeedbackInsightsPage />} />
              <Route path="/admin/announcements" element={<AnnouncementsManagementPage role="super_admin" />} />
              <Route path="/admin/testimonials" element={<TestimonialsManagerPage />} />
              <Route path="/admin/profile" element={<UserProfilePage />} />

              <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="/instructor/courses" element={<CoursesPage role="instructor" />} />
              <Route path="/instructor/certificates" element={<CertificateManagementPage />} />
              <Route path="/instructor/announcements" element={<AnnouncementsManagementPage role="instructor" />} />
              <Route path="/instructor/profile" element={<UserProfilePage />} />

              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
              <Route path="/student/progress" element={<StudentProgressPage />} />
              <Route path="/student/courses" element={<StudentCoursesPage />} />
              <Route path="/student/courses/:courseId/lessons/:lessonId" element={<StudentLessonViewer />} />
              <Route path="/student/certificates" element={<CertificatesPage role="student" />} />
              <Route path="/student/certificates/:enrollmentId" element={<CertificateViewPage />} />
              <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
              <Route path="/student/profile" element={<UserProfilePage />} />

              {/* Shared app utilities */}
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/help" element={<HelpPage />} />

              <Route path="*" element={<DashboardRedirect role={activeRole} />} />
            </Route>

            {/* Public fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </WhiteLabelProvider>
  );
}

export default App;

