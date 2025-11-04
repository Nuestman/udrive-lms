// Instructor Activity Chart with Recharts
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface InstructorActivityChartProps {
  activity: any[];
  loading: boolean;
}

const InstructorActivityChart: React.FC<InstructorActivityChartProps> = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64 text-gray-500">
          No activity data available
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = activity.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    newInstructors: parseInt(item.new_instructors) || 0
  }));

  const totalNewInstructors = activity.reduce((sum, a) => sum + (parseInt(a.new_instructors) || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {totalNewInstructors} new instructors
          </span>
        </div>
      </div>

      <div className="h-64 min-h-[256px] min-w-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={256}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorNewInstructors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
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
                `${value} new instructors`,
                'Registrations'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="newInstructors"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNewInstructors)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InstructorActivityChart;

