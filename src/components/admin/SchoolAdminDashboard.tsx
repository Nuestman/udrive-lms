import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar, 
  Bell,
  Settings,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  UserPlus,
  FileText,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  activeInstructors: number;
  totalCourses: number;
  completionRate: number;
  monthlyEnrollments: number;
  certificatesIssued: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'completion' | 'certificate' | 'course_created';
  description: string;
  timestamp: string;
  user?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const SchoolAdminDashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>({
    totalStudents: 247,
    activeInstructors: 12,
    totalCourses: 8,
    completionRate: 78,
    monthlyEnrollments: 34,
    certificatesIssued: 156
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'enrollment',
      description: 'Sarah Johnson enrolled in Advanced Defensive Driving',
      timestamp: '2 hours ago',
      user: 'Sarah Johnson'
    },
    {
      id: '2',
      type: 'completion',
      description: 'Michael Chen completed Basic Driving Course',
      timestamp: '4 hours ago',
      user: 'Michael Chen'
    },
    {
      id: '3',
      type: 'certificate',
      description: 'Certificate issued to Emily Rodriguez',
      timestamp: '6 hours ago',
      user: 'Emily Rodriguez'
    },
    {
      id: '4',
      type: 'course_created',
      description: 'New course "Highway Safety" created by John Smith',
      timestamp: '1 day ago',
      user: 'John Smith'
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      id: 'add-student',
      title: 'Add Student',
      description: 'Enroll a new student',
      icon: <UserPlus className="w-6 h-6" />,
      action: () => console.log('Add student'),
      color: 'bg-blue-500'
    },
    {
      id: 'create-course',
      title: 'Create Course',
      description: 'Design a new course',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => console.log('Create course'),
      color: 'bg-green-500'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create analytics report',
      icon: <FileText className="w-6 h-6" />,
      action: () => console.log('Generate report'),
      color: 'bg-purple-500'
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => console.log('View analytics'),
      color: 'bg-orange-500'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'completion':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'course_created':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
            <p className="text-primary-100 mt-1">
              Here's what's happening at your driving school today
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Today's Date</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Instructors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeInstructors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyEnrollments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.certificatesIssued}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 ${action.color} rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Course Completion</span>
                <span className="text-sm text-gray-900">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Student Satisfaction</span>
                <span className="text-sm text-gray-900">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '92%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Instructor Utilization</span>
                <span className="text-sm text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Revenue Target</span>
                <span className="text-sm text-gray-900">73%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: '73%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-900">Instructor Meeting</span>
            </div>
            <p className="text-sm text-blue-700">Tomorrow, 2:00 PM</p>
            <p className="text-xs text-blue-600 mt-1">Monthly review and planning</p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-900">Graduation Ceremony</span>
            </div>
            <p className="text-sm text-green-700">March 25, 10:00 AM</p>
            <p className="text-xs text-green-600 mt-1">15 students graduating</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Settings className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-purple-900">System Maintenance</span>
            </div>
            <p className="text-sm text-purple-700">March 30, 12:00 AM</p>
            <p className="text-xs text-purple-600 mt-1">Scheduled downtime: 2 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;