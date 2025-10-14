// User Role Distribution Component
import React from 'react';
import { Shield, Users, GraduationCap, BookOpen } from 'lucide-react';

interface UserRoleDistributionProps {
  statistics: any;
  loading: boolean;
}

const UserRoleDistribution: React.FC<UserRoleDistributionProps> = ({ statistics, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
        <div className="flex justify-center items-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const roles = [
    {
      name: 'Students',
      count: parseInt(statistics.students) || 0,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      name: 'Instructors',
      count: parseInt(statistics.instructors) || 0,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-600',
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      name: 'School Admins',
      count: parseInt(statistics.school_admins) || 0,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'Super Admins',
      count: parseInt(statistics.super_admins) || 0,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      icon: <Shield className="w-5 h-5" />
    }
  ];

  const totalUsers = parseInt(statistics.total_users) || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">User Distribution</h3>

      {/* Donut Chart */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
            />
            
            {/* Role segments */}
            {(() => {
              let cumulativePercentage = 0;
              return roles.map((role, index) => {
                const percentage = totalUsers > 0 ? (role.count / totalUsers) * 100 : 0;
                const strokeDasharray = `${(percentage / 100) * 251.2} 251.2`; // 2 * π * 40 = 251.2
                const strokeDashoffset = -((cumulativePercentage / 100) * 251.2);
                cumulativePercentage += percentage;

                // Color mapping
                const strokeColors: { [key: string]: string } = {
                  'bg-orange-500': '#f97316',
                  'bg-green-500': '#22c55e',
                  'bg-blue-500': '#3b82f6',
                  'bg-purple-500': '#a855f7'
                };

                return percentage > 0 ? (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={strokeColors[role.color]}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                ) : null;
              });
            })()}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {roles.map((role, index) => {
          const percentage = totalUsers > 0 ? ((role.count / totalUsers) * 100).toFixed(1) : '0';
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${role.lightColor}`}>
                  <div className={role.textColor}>{role.icon}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{role.name}</p>
                  <p className="text-xs text-gray-500">{percentage}% of total</p>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-900">{role.count}</div>
            </div>
          );
        })}
      </div>

      {/* Active/Inactive Status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Active Users</span>
          <span className="text-sm font-semibold text-green-600">
            {statistics.active_users} ({totalUsers > 0 ? ((parseInt(statistics.active_users) / totalUsers) * 100).toFixed(1) : 0}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Inactive Users</span>
          <span className="text-sm font-semibold text-red-600">
            {statistics.inactive_users} ({totalUsers > 0 ? ((parseInt(statistics.inactive_users) / totalUsers) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserRoleDistribution;

