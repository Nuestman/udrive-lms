// School Dashboard - Real Statistics from Database
import React from 'react';
import { Users, BookOpen, TrendingUp, Award, Calendar, Plus, UserPlus, FileText, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics, useRecentActivity } from '../../hooks/useAnalytics';

const SchoolDashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useAnalytics();
  const { activities, loading: activityLoading } = useRecentActivity(5);
  const navigate = useNavigate();

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      id: 'add-student',
      title: 'Add Student',
      description: 'Enroll a new student',
      icon: <UserPlus className="w-6 h-6" />,
      action: () => navigate('/school/students'),
      color: 'bg-blue-500'
    },
    {
      id: 'create-course',
      title: 'Create Course',
      description: 'Design a new course',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => navigate('/school/courses'),
      color: 'bg-green-500'
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Check performance',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => navigate('/school/analytics'),
      color: 'bg-purple-500'
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Manage certificates',
      icon: <Award className="w-6 h-6" />,
      action: () => navigate('/school/certificates'),
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your driving school.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalStudents || 0}</p>
              <p className="text-sm text-green-600 mt-1">
                +{stats?.newStudentsThisMonth || 0} this month
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Courses */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCourses || 0}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.publishedCourses || 0} published
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completionRate || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.activeEnrollments || 0} active enrollments
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.certificatesIssued || 0}</p>
              <p className="text-sm text-green-600 mt-1">
                +{stats?.monthlyCertificates || 0} this month
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activityLoading ? (
            <div className="p-6 text-center text-gray-500">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent activity</div>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'enrollment' ? 'bg-blue-100' :
                      activity.type === 'certificate' ? 'bg-yellow-100' :
                      activity.type === 'completion' ? 'bg-green-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'enrollment' && <BookOpen className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'certificate' && <Award className="h-4 w-4 text-yellow-600" />}
                      {activity.type === 'completion' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instructors */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Active Instructors</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeInstructors || 0}</p>
        </div>

        {/* Monthly Enrollments */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Enrollments</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.monthlyEnrollments || 0}</p>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Progress</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.averageProgress || 0}%</p>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;

