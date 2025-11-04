import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Award, CheckCircle } from 'lucide-react';
import { enrollmentsApi, coursesApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface Enrollment {
  id: string;
  course_id: string;
  course_title: string;
  course_description?: string;
  thumbnail_url?: string;
  duration_weeks?: number;
  total_modules: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  status: string;
  enrolled_at: string;
}

interface UniversalStudentDashboardProps {
  className?: string;
}

export const UniversalStudentDashboard: React.FC<UniversalStudentDashboardProps> = ({
  className = '',
}) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await enrollmentsApi.getByStudent(user.id);
      setEnrollments(response.data || []);
    } catch (error: any) {
      console.error('Failed to load enrollments:', error);
      showToast('Failed to load your courses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleSpecificTitle = () => {
    switch (user?.role) {
      case 'instructor':
        return 'My Learning';
      case 'school_admin':
        return 'My Courses';
      case 'super_admin':
        return 'My Learning';
      default:
        return 'My Courses';
    }
  };

  const getRoleSpecificDescription = () => {
    switch (user?.role) {
      case 'instructor':
        return 'Courses you are taking as a student';
      case 'school_admin':
        return 'Courses you are enrolled in';
      case 'super_admin':
        return 'Courses you are taking across the platform';
      default:
        return 'Your enrolled courses';
    }
  };

  const formatProgress = (completed: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((completed / total) * 100)}%`;
  };

  const handleStartCourse = async (courseId: string) => {
    try {
      // Get course modules and navigate to first lesson
      const modulesRes = await coursesApi.getById(courseId);
      if (modulesRes.success && modulesRes.data.modules?.length > 0) {
        const firstModule = modulesRes.data.modules[0];
        if (firstModule.lessons?.length > 0) {
          const firstLesson = firstModule.lessons[0];
          const slug = (firstLesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
          
          // Navigate based on user role
          const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
          navigate(`${basePath}/courses/${courseId}/lessons/${slug}-${firstLesson.id}`);
          return;
        }
      }
      
      // Fallback to course overview
      const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
      navigate(`${basePath}/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error navigating to course:', error);
      showToast('Failed to navigate to course', 'error');
    }
  };

  const handleViewCertificate = () => {
    // Navigate to certificates page
    const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
    navigate(`${basePath}/certificates`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getRoleSpecificTitle()}
        </h2>
        <p className="text-gray-600 mb-4">
          {getRoleSpecificDescription()}
        </p>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'student' 
              ? 'Get started by enrolling in a course.'
              : 'You haven\'t enrolled in any courses yet. Browse available courses to get started.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {getRoleSpecificTitle()}
        </h2>
        <p className="text-gray-600 mt-1">
          {getRoleSpecificDescription()}
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {enrollment.course_title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status}
                    </span>
                  </div>
                  
                  {enrollment.course_description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {enrollment.course_description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {enrollment.total_modules} modules
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {enrollment.completed_lessons}/{enrollment.total_lessons} lessons
                    </div>
                    {enrollment.duration_weeks && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {enrollment.duration_weeks} weeks
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {enrollment.progress_percentage}%
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, enrollment.progress_percentage))}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatProgress(enrollment.completed_lessons, enrollment.total_lessons)} complete
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  {enrollment.status === 'completed' ? (
                    <>
                      <button
                        onClick={handleViewCertificate}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        View Certificate
                      </button>
                      <button
                        onClick={() => handleStartCourse(enrollment.course_id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Review Course
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartCourse(enrollment.course_id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {enrollment.progress_percentage > 0 ? 'Continue Learning' : 'Start Course'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UniversalStudentDashboard;
