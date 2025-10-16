// Student Courses Page - Browse and enroll in available courses
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play, CheckCircle } from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useToast } from '../../contexts/ToastContext';
import PageLayout from '../ui/PageLayout';
import api from '../../lib/api';

const StudentCoursesPage: React.FC = () => {
  const { courses, loading: coursesLoading } = useCourses();
  const { enrollments, loading: enrollmentsLoading, createEnrollment } = useEnrollments();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');

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

      // Navigate to first lesson
      const modulesRes = await api.get(`/modules/course/${courseId}`);
      if (modulesRes.success && modulesRes.data.length > 0) {
        const firstModule = modulesRes.data[0];
        const lessonsRes = await api.get(`/lessons/module/${firstModule.id}`);
        
        if (lessonsRes.success && lessonsRes.data.length > 0) {
          const firstLesson = lessonsRes.data[0];
          navigate(`/student/courses/${courseId}/lessons/${firstLesson.id}`);
          return;
        }
      }
      
      // Fallback
      navigate(`/student/dashboard`);
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
      const modulesRes = await api.get(`/modules/course/${courseId}`);
      if (modulesRes.success && modulesRes.data.length > 0) {
        const firstModule = modulesRes.data[0];
        const lessonsRes = await api.get(`/lessons/module/${firstModule.id}`);
        
        if (lessonsRes.success && lessonsRes.data.length > 0) {
          const firstLesson = lessonsRes.data[0];
          navigate(`/student/courses/${courseId}/lessons/${firstLesson.id}`);
          return;
        }
      }
    } catch (err) {
      console.error('Error navigating to course:', err);
    }
    
    navigate(`/student/dashboard`);
  };

  const handleViewCertificate = (courseId: string) => {
    const enrollment = getEnrollmentForCourse(courseId);
    if (enrollment) {
      return navigate(`/student/certificates/${enrollment.id}`);
    }
    return navigate('/student/certificates');
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
      description="Discover and enroll in driving courses"
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
                  <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center relative">
                    <BookOpen className="h-16 w-16 text-white" />
                    {isEnrolled && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
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
                      progress >= 100 ? (
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
                        <button
                          onClick={() => handleContinueCourse(course.id)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Play size={16} className="mr-2" />
                          {progress > 0 ? 'Continue Learning' : 'Start Course'}
                        </button>
                      )
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
    </PageLayout>
  );
};

export default StudentCoursesPage;

