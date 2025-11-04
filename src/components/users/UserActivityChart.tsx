// User Activity Chart Component
import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface UserActivityChartProps {
  activity: any[];
  loading: boolean;
}

const UserActivityChart: React.FC<UserActivityChartProps> = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">New User Registrations</h3>
            <p className="text-sm text-gray-600">Daily breakdown of new users by role</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">New User Registrations</h3>
            <p className="text-sm text-gray-600">Daily breakdown of new users by role</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-full min-h-[400px] text-gray-500">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No user registration data available</p>
            <p className="text-gray-400 text-sm">Data will appear once users start registering</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = activity.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    students: parseInt(item.new_students) || 0,
    instructors: parseInt(item.new_instructors) || 0,
    total: parseInt(item.new_users) || 0
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">New User Registrations</h3>
          <p className="text-sm text-gray-600">Daily breakdown of new users by role</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {activity.reduce((sum, a) => sum + (parseInt(a.new_users) || 0), 0)} total new users
          </span>
        </div>
      </div>

      <div className="h-full min-h-[400px] min-w-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorInstructors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax']}
              tickCount={6}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              labelStyle={{ color: '#F9FAFB', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => [
                `${value} ${name}`,
                name === 'students' ? 'Students' : 'Instructors'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="students"
              stackId="1"
              stroke="#3B82F6"
              fill="url(#colorStudents)"
              name="Students"
            />
            <Area
              type="monotone"
              dataKey="instructors"
              stackId="1"
              stroke="#10B981"
              fill="url(#colorInstructors)"
              name="Instructors"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserActivityChart;

