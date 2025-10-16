// Student Dashboard - View enrolled courses and progress
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Award, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEnrollments } from '../../hooks/useEnrollments';
import api from '../../lib/api';

const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { enrollments, loading } = useEnrollments();
  const navigate = useNavigate();

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
      const slugOrId = courseRes?.success && courseRes.data?.slug ? courseRes.data.slug : courseId;
      const modulesRes = await api.get(`/modules/course/${courseId}`);
      if (modulesRes.success && modulesRes.data.length > 0) {
        const firstModule = modulesRes.data[0];
        const lessonsRes = await api.get(`/lessons/module/${firstModule.id}`);
        
        if (lessonsRes.success && lessonsRes.data.length > 0) {
          const firstLesson = lessonsRes.data[0];
          navigate(`/student/courses/${slugOrId}/lessons/${firstLesson.id}`);
          return;
        }
      }
    } catch (err) {
      console.error('Error navigating to course:', err);
    }
    
    // Fallback: go to course page
    navigate(`/student/courses/${courseId}`);
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
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProgress}%</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
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
                  <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white" />
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

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCourse(enrollment.course_id);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Play size={16} className="mr-2" />
                      {(enrollment.progress_percentage || 0) > 0 ? 'Continue' : 'Start Course'}
                    </button>
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
    </div>
  );
};

export default StudentDashboardPage;

