// Student Dashboard - View enrolled courses and progress
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Award, Play, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useToast } from '../../contexts/ToastContext';
import api, { quizzesApi } from '../../lib/api';
import { useProgress } from '../../hooks/useProgress';
import ConfirmationModal from '../ui/ConfirmationModal';

const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { enrollments, loading, refreshEnrollments } = useEnrollments(profile?.id ? { student_id: profile.id } : undefined as any);
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [unenrollingCourseId, setUnenrollingCourseId] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState<{ enrollmentId: string; courseId: string; courseTitle: string } | null>(null);

  // Get enrolled courses (active enrollments only)
  const enrolledCourses = enrollments.filter(e => e.status === 'active');
  const completedCourses = enrollments.filter(e => e.status === 'completed');

  // Calculate overall progress
  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  const handleStartCourse = async (courseId: string) => {
    // Get first lesson in course
    try {
      // Get slug for nicer URL
      const courseRes = await api.get(`/courses/${courseId}`);
      if (!courseRes.success) {
        showError(courseRes.error || 'Failed to load course');
        return;
      }
      
      const slugOrId = courseRes.data?.slug ? courseRes.data.slug : courseId;
      const modulesRes = await api.get(`/modules/course/${courseId}`);
      
      if (!modulesRes.success) {
        showError(modulesRes.error || 'Failed to load course modules');
        return;
      }
      
      if (modulesRes.data.length === 0) {
        showError('Course has no modules available yet');
        return;
      }
      
      const firstModule = modulesRes.data[0];
      const lessonsRes = await api.get(`/lessons/module/${firstModule.id}`);
      
      if (!lessonsRes.success) {
        showError(lessonsRes.error || 'Failed to load course lessons');
        return;
      }
      
      if (lessonsRes.data.length === 0) {
        showError('Course has no lessons available yet');
        return;
      }
      
      const firstLesson = lessonsRes.data[0];
      const slug = (firstLesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      navigate(`/student/courses/${slugOrId}/lessons/${slug}-${firstLesson.id}`);
    } catch (err: any) {
      console.error('Error navigating to course:', err);
      const errorMessage = err?.message || err?.error || 'Failed to access course. Please try again.';
      showError(errorMessage);
    }
  };

  const handleUnenrollClick = (enrollmentId: string, courseId: string) => {
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) {
      showError('Enrollment not found');
      return;
    }

    const courseTitle = enrollment.course_title || 'this course';
    setConfirmUnenroll({ enrollmentId, courseId, courseTitle });
  };

  const handleUnenrollConfirm = async () => {
    if (!confirmUnenroll) return;

    try {
      setUnenrollingCourseId(confirmUnenroll.courseId);
      const response = await api.del(`/enrollments/${confirmUnenroll.enrollmentId}`);
      
      if (response.success) {
        success('Successfully unenrolled from course');
        await refreshEnrollments();
        setConfirmUnenroll(null);
      } else {
        showError(response.error || 'Failed to unenroll');
      }
    } catch (error: unknown) {
      console.error('Error unenrolling:', error);
      const message = (error as any)?.message || 'Failed to unenroll from course';
      showError(message);
    } finally {
      setUnenrollingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.first_name || 'Student'}!
        </h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{enrolledCourses.length}</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProgress}%</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{completedCourses.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{completedCourses.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Courses */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Continue Learning</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleStartCourse(enrollment.course_id)}
                >
                  {/* Course Thumbnail */}
                  <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="h-12 w-12 text-white absolute z-0" />
                    {enrollment.thumbnail_url && (
                      <img
                        src={enrollment.thumbnail_url}
                        alt={enrollment.course_title || 'Course'}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          // Hide image on error - fallback icon will show
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {enrollment.course_title || 'Course'}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(enrollment.progress_percentage || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons - Only show unenroll for non-completed courses */}
                    {enrollment.progress_percentage && enrollment.progress_percentage >= 100 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/certificates/${enrollment.id}`);
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Award size={16} className="mr-2" />
                        View Certificate
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCourse(enrollment.course_id);
                          }}
                          className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mb-2"
                        >
                          <Play size={16} className="mr-2" />
                          {(enrollment.progress_percentage || 0) > 0 ? 'Continue' : 'Start Course'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnenrollClick(enrollment.id, enrollment.course_id);
                          }}
                          disabled={unenrollingCourseId === enrollment.course_id}
                          className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {unenrollingCourseId === enrollment.course_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              Unenrolling...
                            </>
                          ) : (
                            <>
                              <X size={16} className="mr-2" />
                              Unenroll
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {enrolledCourses.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Courses</h3>
          <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet</p>
          <button
            onClick={() => navigate('/student/courses')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Completed Courses</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {completedCourses.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center mr-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{enrollment.course_title}</h4>
                      <p className="text-sm text-gray-500">
                        Completed on {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/student/certificates/${enrollment.id}`)}
                    className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    View Certificate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unenroll Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmUnenroll}
        onClose={() => setConfirmUnenroll(null)}
        onConfirm={handleUnenrollConfirm}
        title="Unenroll from Course"
        message={`Are you sure you want to unenroll from "${confirmUnenroll?.courseTitle}"?\n\nYour progress will be lost and you will need to re-enroll to access this course again.`}
        confirmText="Unenroll"
        cancelText="Cancel"
        variant="warning"
        isLoading={!!confirmUnenroll && unenrollingCourseId === confirmUnenroll.courseId}
      />
    </div>
  );
};

export default StudentDashboardPage;

