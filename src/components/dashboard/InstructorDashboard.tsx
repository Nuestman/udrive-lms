// Instructor Dashboard - Course creation and student management
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, TrendingUp, Award, Plus, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import { useEnrollments } from '../../hooks/useEnrollments';

const InstructorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();
  const navigate = useNavigate();

  // Filter courses created by this instructor
  const myCourses = courses.filter(c => c.created_by === profile?.id);
  
  // Count students enrolled in instructor's courses
  const myStudents = new Set(
    enrollments
      .filter(e => myCourses.some(c => c.id === e.course_id))
      .map(e => e.student_id)
  ).size;

  const activeEnrollments = enrollments.filter(e => 
    myCourses.some(c => c.id === e.course_id) && e.status === 'active'
  ).length;

  const quickActions = [
    {
      id: 'create-course',
      title: 'Create Course',
      description: 'Design a new course',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => navigate('/school/courses'),
      color: 'bg-green-500'
    },
    {
      id: 'view-students',
      title: 'View Students',
      description: 'See your students',
      icon: <Users className="w-6 h-6" />,
      action: () => navigate('/school/students'),
      color: 'bg-blue-500'
    },
    {
      id: 'track-progress',
      title: 'Track Progress',
      description: 'Monitor student progress',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => navigate('/school/analytics'),
      color: 'bg-purple-500'
    }
  ];

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-gray-600">Here's an overview of your teaching</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Courses */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{myCourses.length}</p>
              <p className="text-sm text-gray-600 mt-1">
                {myCourses.filter(c => c.status === 'published').length} published
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* My Students */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{myStudents}</p>
              <p className="text-sm text-gray-600 mt-1">
                {activeEnrollments} active enrollments
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Avg Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {enrollments.length > 0 
                  ? Math.round(enrollments
                      .filter(e => myCourses.some(c => c.id === e.course_id))
                      .reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / 
                      enrollments.filter(e => myCourses.some(c => c.id === e.course_id)).length || 1)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Your courses
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {enrollments.filter(e => myCourses.some(c => c.id === e.course_id) && e.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Completed enrollments
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left group"
            >
              <div className={`${action.color} p-2 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
          <button
            onClick={() => navigate('/school/courses')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </button>
        </div>
        {myCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first course</p>
            <button
              onClick={() => navigate('/school/courses')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Create Course
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {myCourses.slice(0, 5).map((course) => {
                const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
                const avgProgress = courseEnrollments.length > 0
                  ? Math.round(courseEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / courseEnrollments.length)
                  : 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/school/courses/${course.id}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center flex-1">
                      <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{course.module_count || 0} modules</span>
                          <span>{course.student_count || 0} students</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            course.status === 'published' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{avgProgress}%</div>
                      <div className="text-xs text-gray-500">Avg Progress</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;

