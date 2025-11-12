// Student Courses Page - Browse and enroll in available courses
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play, CheckCircle, X } from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PageLayout from '../ui/PageLayout';
import api from '../../lib/api';
import ConfirmationModal from '../ui/ConfirmationModal';

const StudentCoursesPage: React.FC = () => {
  const { courses, loading: coursesLoading } = useCourses();
  const { profile } = useAuth();
  const { enrollments, loading: enrollmentsLoading, createEnrollment, refreshEnrollments } = useEnrollments(profile?.id ? { student_id: profile.id } : undefined as any);
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [confirmUnenroll, setConfirmUnenroll] = useState<{ enrollmentId: string; courseId: string; courseTitle: string } | null>(null);

  // Get published courses only
  const publishedCourses = courses.filter(c => c.status === 'published');

  // Get enrolled course IDs
  const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

  // Filter courses
  const filteredCourses = publishedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'enrolled') {
      return matchesSearch && enrolledCourseIds.has(course.id);
    } else if (filter === 'available') {
      return matchesSearch && !enrolledCourseIds.has(course.id);
    }
    
    return matchesSearch;
  });

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      await createEnrollment({
        course_id: courseId,
        status: 'active'
      });
      
      success('Enrolled successfully');

      // Determine slug for nicer URL
      const courseMeta = courses.find(c => c.id === courseId);
      const coursePathId = courseMeta?.slug || courseId;

      // Navigate to first lesson
      const modulesRes = await api.get(`/modules/course/${courseId}`);
      if (modulesRes.success && modulesRes.data.length > 0) {
        const firstModule = modulesRes.data[0];
        const lessonsRes = await api.get(`/lessons/module/${firstModule.id}`);
        
        if (lessonsRes.success && lessonsRes.data.length > 0) {
          const firstLesson = lessonsRes.data[0];
          const slug = (firstLesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
          navigate(`/student/courses/${coursePathId}/lessons/${slug}-${firstLesson.id}`);
          return;
        } else {
          showError('Course has no lessons available yet');
          return;
        }
      } else {
        showError('Course has no modules available yet');
        return;
      }
    } catch (error: unknown) {
      console.error('Error enrolling:', error);
      const message = (error as Error)?.message || 'Failed to enroll in course';
      showError(message);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleContinueCourse = async (courseId: string) => {
    try {
      const courseMeta = courses.find(c => c.id === courseId);
      const coursePathId = courseMeta?.slug || courseId;
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
      navigate(`/student/courses/${coursePathId}/lessons/${slug}-${firstLesson.id}`);
    } catch (err: any) {
      console.error('Error navigating to course:', err);
      const errorMessage = err?.message || err?.error || 'Failed to access course. Please try again.';
      showError(errorMessage);
    }
  };

  const handleViewCertificate = (courseId: string) => {
    const enrollment = getEnrollmentForCourse(courseId);
    if (enrollment) {
      return navigate(`/student/certificates/${enrollment.id}`);
    }
    return navigate('/student/certificates');
  };

  const handleUnenrollClick = (courseId: string) => {
    const enrollment = getEnrollmentForCourse(courseId);
    if (!enrollment) {
      showError('Enrollment not found');
      return;
    }

    const course = courses.find(c => c.id === courseId);
    const courseTitle = course?.title || 'this course';
    setConfirmUnenroll({ enrollmentId: enrollment.id, courseId, courseTitle });
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

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  const loading = coursesLoading || enrollmentsLoading;

  const breadcrumbs = [
    { label: 'My Courses' }
  ];

  return (
    <PageLayout
      title="Browse Courses"
      description="Discover and enroll in our courses tailormade for you"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setFilter('enrolled')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'enrolled'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Courses
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'available'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Available
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading courses...</p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && filteredCourses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}

        {!loading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const enrollment = getEnrollmentForCourse(course.id);
              const isEnrolled = !!enrollment;
              const progress = enrollment?.progress_percentage || 0;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Course Image */}
                  <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="h-16 w-16 text-white absolute z-0" />
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          // Hide image on error - fallback icon will show
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {isEnrolled && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center z-20">
                        <CheckCircle size={12} className="mr-1" />
                        Enrolled
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {course.duration_weeks || 4} weeks
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {course.student_count || 0}
                      </div>
                      <div className="flex items-center">
                        <BookOpen size={14} className="mr-1" />
                        {course.module_count || 0} modules
                      </div>
                    </div>

                    {/* Instructor */}
                    {course.instructor_name && (
                      <p className="text-sm text-gray-600 mb-4">
                        By {course.instructor_name}
                      </p>
                    )}

                    {/* Progress Bar (if enrolled) */}
                    {isEnrolled && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isEnrolled ? (
                      <>
                        {progress >= 100 ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleViewCertificate(course.id)}
                              className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <CheckCircle size={16} className="mr-2" />
                              View Certificate
                            </button>
                            <button
                              onClick={() => handleContinueCourse(course.id)}
                              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Play size={16} className="mr-2" />
                              Review Course
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleContinueCourse(course.id)}
                              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mb-2"
                            >
                              <Play size={16} className="mr-2" />
                              {progress > 0 ? 'Continue Learning' : 'Start Course'}
                            </button>
                            <button
                              onClick={() => handleUnenrollClick(course.id)}
                              disabled={unenrollingCourseId === course.id}
                              className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {unenrollingCourseId === course.id ? (
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
                      </>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingCourseId === course.id}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enrollingCourseId === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-2" />
                            Enroll Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </PageLayout>
  );
};

export default StudentCoursesPage;

