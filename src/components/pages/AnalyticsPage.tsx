import React from 'react';
import PageLayout from '../ui/PageLayout';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Calendar } from 'lucide-react';

interface AnalyticsPageProps {
  role: 'super_admin' | 'school_admin' | 'instructor';
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Analytics' }
  ];

  const getTitle = () => {
    switch (role) {
      case 'super_admin':
        return 'Platform Analytics';
      case 'school_admin':
        return 'School Analytics';
      case 'instructor':
        return 'My Analytics';
      default:
        return 'Analytics';
    }
  };

  const getDescription = () => {
    switch (role) {
      case 'super_admin':
        return 'Monitor platform-wide performance and usage metrics';
      case 'school_admin':
        return 'Track school performance, student progress, and course effectiveness';
      case 'instructor':
        return 'View your course performance and student progress';
      default:
        return 'Analytics and reporting dashboard';
    }
  };

  return (
    <PageLayout
      title={getTitle()}
      description={getDescription()}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-green-600">+3 new this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completions</p>
                <p className="text-2xl font-bold text-gray-900">892</p>
                <p className="text-sm text-green-600">+18% completion rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                <p className="text-2xl font-bold text-gray-900">73%</p>
                <p className="text-sm text-green-600">+5% improvement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New student enrolled', course: 'Basic Driving Course', time: '2 hours ago' },
              { action: 'Course completed', course: 'Advanced Defensive Driving', time: '4 hours ago' },
              { action: 'Quiz submitted', course: 'Traffic Laws Review', time: '6 hours ago' },
              { action: 'Certificate issued', course: 'Basic Driving Course', time: '1 day ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.course}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AnalyticsPage;