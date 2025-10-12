// Super Admin Dashboard - System-wide overview
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, BookOpen, TrendingUp, Award, Plus, BarChart3, Settings as SettingsIcon, Globe } from 'lucide-react';
import { useAnalytics, useRecentActivity } from '../../hooks/useAnalytics';
import { useSchools } from '../../hooks/useSchools';

const SuperAdminDashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useAnalytics();
  const { activities, loading: activityLoading } = useRecentActivity(5);
  const { schools, loading: schoolsLoading } = useSchools();
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

  const activeSchools = schools?.filter(s => s.is_active).length || 0;

  const quickActions = [
    {
      id: 'create-school',
      title: 'Create School',
      description: 'Add new driving school',
      icon: <Building2 className="w-6 h-6" />,
      action: () => navigate('/admin/schools'),
      color: 'bg-purple-500'
    },
    {
      id: 'view-schools',
      title: 'Manage Schools',
      description: 'View all schools',
      icon: <Globe className="w-6 h-6" />,
      action: () => navigate('/admin/schools'),
      color: 'bg-blue-500'
    },
    {
      id: 'all-courses',
      title: 'All Courses',
      description: 'System-wide courses',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => navigate('/school/courses'),
      color: 'bg-green-500'
    },
    {
      id: 'system-analytics',
      title: 'System Analytics',
      description: 'View detailed reports',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => navigate('/admin/analytics'),
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600">System-wide overview and management</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Schools */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schools</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{schools?.length || 0}</p>
              <p className="text-sm text-green-600 mt-1">
                {activeSchools} active
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Students (All Schools) */}
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

        {/* Total Courses (All Schools) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
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

        {/* System-Wide Completion Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completionRate || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.totalEnrollments || 0} enrollments
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Schools Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Schools Overview</h2>
          <button
            onClick={() => navigate('/admin/schools')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="p-6">
          {schoolsLoading ? (
            <div className="text-center py-4 text-gray-500">Loading schools...</div>
          ) : schools && schools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.slice(0, 6).map((school) => (
                <div
                  key={school.id}
                  onClick={() => navigate('/admin/schools')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{school.name}</h3>
                        <p className="text-xs text-gray-500">{school.subdomain}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      school.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-lg font-bold text-gray-900">{school.student_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Courses</p>
                      <p className="text-lg font-bold text-gray-900">{school.course_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Enrollments</p>
                      <p className="text-lg font-bold text-gray-900">{school.enrollment_count || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No schools yet. Create your first school!
            </div>
          )}
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

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instructors */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Instructors</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeInstructors || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Across all schools</p>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Certificates Issued</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.certificatesIssued || 0}</p>
          <p className="text-xs text-green-600 mt-1">+{stats?.monthlyCertificates || 0} this month</p>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Progress</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.averageProgress || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">System-wide metric</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
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
    </div>
  );
};

export default SuperAdminDashboard;

